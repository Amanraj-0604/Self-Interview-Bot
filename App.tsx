
import React, { useState } from 'react';
import { AppStage, ResumeData, InterviewConfig, SkillLevel, FeedbackData, TranscriptionItem } from './types';
import ResumeUpload from './components/ResumeUpload';
import InterviewSetup from './components/InterviewSetup';
import InterviewRoom from './components/InterviewRoom';
import FeedbackReport from './components/FeedbackReport';
import Header from './components/Header';

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.UPLOAD);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig>({
    level: SkillLevel.INTERMEDIATE,
    duration: 20,
    focus: 'Software Engineering'
  });
  const [transcription, setTranscription] = useState<TranscriptionItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);

  const handleResumeParsed = (data: ResumeData) => {
    setResumeData(data);
    setStage(AppStage.PREPARING);
  };

  const handleStartInterview = (config: InterviewConfig) => {
    setInterviewConfig(config);
    setStage(AppStage.INTERVIEW);
  };

  const handleInterviewEnd = (finalTranscription: TranscriptionItem[], feedbackData: FeedbackData) => {
    setTranscription(finalTranscription);
    setFeedback(feedbackData);
    setStage(AppStage.FEEDBACK);
  };

  const reset = () => {
    setStage(AppStage.UPLOAD);
    setResumeData(null);
    setTranscription([]);
    setFeedback(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onReset={reset} />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        {stage === AppStage.UPLOAD && (
          <ResumeUpload onParsed={handleResumeParsed} />
        )}
        
        {stage === AppStage.PREPARING && resumeData && (
          <InterviewSetup 
            resumeData={resumeData} 
            onStart={handleStartInterview} 
          />
        )}
        
        {stage === AppStage.INTERVIEW && resumeData && (
          <InterviewRoom 
            resumeData={resumeData}
            config={interviewConfig}
            onEnd={handleInterviewEnd}
          />
        )}

        {stage === AppStage.FEEDBACK && feedback && (
          <FeedbackReport 
            feedback={feedback} 
            transcription={transcription}
            onRestart={reset}
          />
        )}
      </main>
      
      <footer className="py-6 text-center text-slate-500 text-sm border-t border-slate-800">
        Powered by Gemini 2.5 Flash & 3 Pro • Real-time AI Interviewing
      </footer>
    </div>
  );
};

export default App;
