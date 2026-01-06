
import React from 'react';
import { FeedbackData, TranscriptionItem } from '../types';

interface FeedbackReportProps {
  feedback: FeedbackData;
  transcription: TranscriptionItem[];
  onRestart: () => void;
}

const FeedbackReport: React.FC<FeedbackReportProps> = ({ feedback, transcription, onRestart }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
      <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold mb-2">Performance Summary</h2>
            <p className="text-slate-400">Review your strengths and areas for growth from the session.</p>
          </div>
          <div className="flex items-center space-x-4 bg-slate-800/50 p-4 rounded-3xl border border-slate-700">
            <div className={`text-5xl font-black ${getScoreColor(feedback.score)}`}>
              {feedback.score}
            </div>
            <div className="text-xs uppercase font-bold tracking-widest text-slate-500 leading-tight">
              OVERALL<br/>SCORE
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-green-500 mb-4 flex items-center space-x-2">
                <span>Key Strengths</span>
              </h3>
              <ul className="space-y-3">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="flex items-start space-x-3 text-slate-300">
                    <span className="text-green-500 mt-1">✦</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-4 flex items-center space-x-2">
                <span>Technical Accuracy</span>
              </h3>
              <p className="text-slate-300 bg-blue-600/5 p-4 rounded-2xl border border-blue-500/10 italic text-sm leading-relaxed">
                "{feedback.technicalAccuracy}"
              </p>
            </section>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-500 mb-4 flex items-center space-x-2">
                <span>Improvements</span>
              </h3>
              <ul className="space-y-3">
                {feedback.areasForImprovement.map((s, i) => (
                  <li key={i} className="flex items-start space-x-3 text-slate-300">
                    <span className="text-yellow-500 mt-1">△</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-purple-400 mb-4 flex items-center space-x-2">
                <span>Communication</span>
              </h3>
              <p className="text-slate-300 bg-purple-600/5 p-4 rounded-2xl border border-purple-500/10 italic text-sm leading-relaxed">
                "{feedback.communicationSkills}"
              </p>
            </section>
          </div>
        </div>

        <div className="mt-12 p-6 bg-slate-800/30 rounded-3xl border border-slate-800">
          <h3 className="text-lg font-bold mb-4">The Verdict</h3>
          <p className="text-slate-400 leading-relaxed">{feedback.overallSummary}</p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onRestart}
            className="flex-grow py-4 bg-white text-slate-950 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Try Another Session</span>
          </button>
          <button className="flex-grow py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackReport;
