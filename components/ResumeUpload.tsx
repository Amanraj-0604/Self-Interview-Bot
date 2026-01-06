
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { ResumeData } from '../types';

interface ResumeUploadProps {
  onParsed: (data: ResumeData) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onParsed }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });

      // Updated to follow @google/genai guidelines: use process.env.API_KEY directly
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: file.type,
                  data: fileData
                }
              },
              {
                text: "Extract information from this resume for a technical interview prep app. Return a JSON object containing the candidate's name, their core technical skills as a string array, a short experience summary, and 5 suggested advanced technical interview questions based on their profile."
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              experienceSummary: { type: Type.STRING },
              suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['name', 'skills', 'experienceSummary', 'suggestedQuestions']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      onParsed(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to parse resume. Please ensure it's a valid PDF or Image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12 animate-in fade-in duration-700">
      <div className="text-center max-w-2xl space-y-4">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Level up your <span className="gradient-text">Interview Skills</span>
        </h2>
        <p className="text-slate-400 text-lg">
          Upload your resume and let our AI coach simulate a high-pressure technical round with live audio, video, and screen sharing.
        </p>
      </div>

      <div className="w-full max-w-md">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative group cursor-pointer border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all duration-300
            ${isUploading ? 'bg-slate-800/20 border-blue-500/50 cursor-wait' : 'hover:border-blue-500/50 hover:bg-slate-800/30 border-slate-700'}
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-400 font-medium">Analyzing your profile...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Upload Resume</h3>
              <p className="text-slate-500 text-sm mt-1">PDF, PNG, or JPG (max 5MB)</p>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.png,.jpg,.jpeg"
          />
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-12">
        <FeatureCard 
          icon="🎙️"
          title="Voice Interactive"
          desc="Speak naturally with a human-like AI interviewer."
        />
        <FeatureCard 
          icon="💻"
          title="Coding Rounds"
          desc="Share your screen to solve live technical challenges."
        />
        <FeatureCard 
          icon="📈"
          title="Deep Feedback"
          desc="Get a detailed breakdown of your performance."
        />
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{icon: string, title: string, desc: string}> = ({ icon, title, desc }) => (
  <div className="glass-panel p-6 rounded-2xl hover:translate-y-[-4px] transition-transform">
    <div className="text-3xl mb-3">{icon}</div>
    <h4 className="font-bold text-white mb-2">{title}</h4>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default ResumeUpload;