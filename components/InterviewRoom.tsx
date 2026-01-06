
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ResumeData, InterviewConfig, FeedbackData, TranscriptionItem } from '../types';

interface InterviewRoomProps {
  resumeData: ResumeData;
  config: InterviewConfig;
  onEnd: (transcription: TranscriptionItem[], feedback: FeedbackData) => void;
}

const InterviewRoom: React.FC<InterviewRoomProps> = ({ resumeData, config, onEnd }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(config.duration * 60);
  const [transcription, setTranscription] = useState<TranscriptionItem[]>([]);
  const [currentAIWords, setCurrentAIWords] = useState("");
  const [currentUserWords, setCurrentUserWords] = useState("");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  // Audio Processing Helpers
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    setIsConnecting(true);
    try {
      // 1. Get User Media
      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { width: 480, height: 270 } 
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = streamRef.current;

      // 2. Get Screen Media
      // Fixed: Casting video constraints to any to avoid error 'Object literal may only specify known properties' for 'cursor'
      screenStreamRef.current = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: false
      });
      if (screenVideoRef.current) screenVideoRef.current.srcObject = screenStreamRef.current;

      // 3. Setup Audio Contexts
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outputNode = outputAudioContextRef.current.createGain();
      outputNode.connect(outputAudioContextRef.current.destination);

      // 4. Connect to Gemini Live API
      // Updated to follow @google/genai guidelines: use process.env.API_KEY directly
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Session Opened');
            setIsActive(true);
            setIsConnecting(false);
            
            // Start streaming microphone
            const source = audioContextRef.current!.createMediaStreamSource(streamRef.current!);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);

            // Start streaming screen frames (Interviewer sees your code)
            const canvas = canvasRef.current!;
            const ctx = canvas.getContext('2d')!;
            const video = screenVideoRef.current!;
            frameIntervalRef.current = window.setInterval(() => {
              if (!video.videoWidth) return;
              canvas.width = 320; // Lower res for efficiency
              canvas.height = (video.videoHeight / video.videoWidth) * 320;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(async (blob) => {
                if (blob) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } }));
                  };
                  reader.readAsDataURL(blob);
                }
              }, 'image/jpeg', 0.6);
            }, 2000); // 1 frame every 2 seconds for technical oversight
          },
          onmessage: async (message: LiveServerMessage) => {
            // Process AI Transcription
            if (message.serverContent?.outputTranscription) {
              setCurrentAIWords(prev => prev + message.serverContent!.outputTranscription!.text);
            } else if (message.serverContent?.inputTranscription) {
              setCurrentUserWords(prev => prev + message.serverContent!.inputTranscription!.text);
            }

            if (message.serverContent?.turnComplete) {
              // Commit to history when turn finishes
              setTranscription(prev => [
                ...prev, 
                { speaker: 'ai', text: currentAIWords, timestamp: Date.now() },
                { speaker: 'user', text: currentUserWords, timestamp: Date.now() }
              ]);
              setCurrentAIWords("");
              setCurrentUserWords("");
            }

            // Process AI Audio
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outputAudioContextRef.current, 24000, 1);
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNode);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error('Gemini Error:', e),
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are a high-level technical interviewer for a ${config.focus} role at a top-tier tech company. 
          The candidate is ${resumeData.name} at a ${config.level} level. 
          Use their resume for context: ${resumeData.experienceSummary}. 
          Skills: ${resumeData.skills.join(', ')}.
          Suggested questions to weave in: ${resumeData.suggestedQuestions.join(', ')}.
          
          Conduct a professional coding round. Ask them to solve a problem and explain their logic. 
          Watch their screen share to see their code. Provide encouragement but remain rigorous. 
          Interview duration is ${config.duration} minutes. Start by introducing yourself and asking a light icebreaker before diving into the code.`,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  const stopSession = async () => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop());
    if (sessionRef.current) sessionRef.current.close();
    
    setIsActive(false);
    generateFeedback();
  };

  const generateFeedback = async () => {
    // Combine session history for final feedback
    // Updated to follow @google/genai guidelines: use process.env.API_KEY directly
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const fullTranscript = transcription.map(t => `${t.speaker}: ${t.text}`).join('\n');
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{
          parts: [{
            text: `Analyze this technical interview transcript and provide a detailed feedback report for the candidate ${resumeData.name}. 
            Transcript:
            ${fullTranscript}
            
            Return JSON with score (0-100), strengths (array), areasForImprovement (array), technicalAccuracy (string), communicationSkills (string), and overallSummary (string).`
          }]
        }],
        config: {
          responseMimeType: 'application/json'
        }
      });
      
      const fbData = JSON.parse(response.text || '{}');
      onEnd(transcription, fbData);
    } catch (err) {
      console.error("Feedback generation failed", err);
    }
  };

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      const timer = setInterval(() => setTimeRemaining(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (isActive && timeRemaining === 0) {
      stopSession();
    }
  }, [isActive, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
          <span className="font-mono text-sm tracking-widest text-slate-300 uppercase">
            {isActive ? 'Session Live' : 'Not Started'}
          </span>
        </div>
        <div className="px-4 py-1 bg-slate-800 rounded-full border border-slate-700 font-mono text-blue-400">
          {formatTime(timeRemaining)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-grow">
        {/* Main Coding/Screen View */}
        <div className="lg:col-span-3 relative glass-panel rounded-3xl overflow-hidden group">
          {!isActive && !isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/40 backdrop-blur-sm">
              <button 
                onClick={startSession}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-xl"
              >
                Join Interview Room
              </button>
            </div>
          )}
          {isConnecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900/60 backdrop-blur-md">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white font-semibold">Establishing Secure Connection...</p>
            </div>
          )}
          <video 
            ref={screenVideoRef} 
            autoPlay 
            muted 
            className="w-full h-full object-cover bg-black"
          />
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs font-medium text-slate-400 bg-slate-900/80 px-2 py-1 rounded">SCREEN SHARE SOURCE</span>
            <div className="flex space-x-2">
               <button onClick={stopSession} className="bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors">End Session</button>
            </div>
          </div>
        </div>

        {/* Sidebar: AI Transcript & Self Video */}
        <div className="flex flex-col space-y-4">
          <div className="h-48 relative glass-panel rounded-3xl overflow-hidden bg-black border border-slate-800">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 text-[10px] rounded uppercase font-bold tracking-tighter">Candidate Cam</div>
          </div>

          <div className="flex-grow glass-panel rounded-3xl p-4 overflow-y-auto flex flex-col space-y-4 scroll-smooth">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-2">Live Transcript</div>
            
            {transcription.map((t, i) => (
              <div key={i} className={`flex flex-col ${t.speaker === 'ai' ? 'items-start' : 'items-end'}`}>
                <span className={`text-[10px] uppercase font-bold mb-1 ${t.speaker === 'ai' ? 'text-blue-500' : 'text-slate-500'}`}>
                  {t.speaker === 'ai' ? 'Interviewer' : 'You'}
                </span>
                <p className={`text-sm p-3 rounded-2xl leading-relaxed ${t.speaker === 'ai' ? 'bg-blue-600/10 text-blue-100' : 'bg-slate-800/50 text-slate-300'}`}>
                  {t.text}
                </p>
              </div>
            ))}

            {currentAIWords && (
              <div className="flex flex-col items-start animate-pulse">
                <span className="text-[10px] uppercase font-bold text-blue-500 mb-1">Interviewer Speaking...</span>
                <p className="text-sm bg-blue-600/10 text-blue-100 p-3 rounded-2xl leading-relaxed italic">
                  {currentAIWords}
                </p>
              </div>
            )}
            
            {currentUserWords && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-slate-500 mb-1">You</span>
                <p className="text-sm bg-slate-800/50 text-slate-400 p-3 rounded-2xl leading-relaxed">
                  {currentUserWords}...
                </p>
              </div>
            )}
            
            {transcription.length === 0 && !currentAIWords && !currentUserWords && (
               <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center py-8">
                  <svg className="w-8 h-8 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-xs uppercase tracking-tighter">Waiting for conversation...</p>
               </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default InterviewRoom;