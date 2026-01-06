
import React, { useState } from 'react';
import { ResumeData, InterviewConfig, SkillLevel } from '../types';

interface InterviewSetupProps {
  resumeData: ResumeData;
  onStart: (config: InterviewConfig) => void;
}

const InterviewSetup: React.FC<InterviewSetupProps> = ({ resumeData, onStart }) => {
  const [level, setLevel] = useState<SkillLevel>(SkillLevel.INTERMEDIATE);
  const [duration, setDuration] = useState(20);
  const [focus, setFocus] = useState('Full Stack Engineering');

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in slide-in-from-bottom duration-500">
      <div className="glass-panel rounded-3xl p-8 space-y-8">
        <div className="border-b border-slate-800 pb-6">
          <h2 className="text-3xl font-bold mb-2">Welcome, {resumeData.name}!</h2>
          <p className="text-slate-400">Based on your skills: {resumeData.skills.slice(0, 5).join(', ')}...</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">Skill Level</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(SkillLevel).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    className={`
                      px-4 py-3 rounded-xl text-sm font-medium border transition-all
                      ${level === lvl 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-500'}
                    `}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">Interview Focus</label>
              <input 
                type="text"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="e.g. Backend with Node.js"
                className="w-full bg-slate-800/40 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">Duration: {duration} Minutes</label>
              <input 
                type="range" 
                min="10" 
                max="60" 
                step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>10m</span>
                <span>30m</span>
                <span>60m</span>
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Round Preparation</h4>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">✓</span>
                  <span>Audio & Video session</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">✓</span>
                  <span>Screen sharing for coding</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">✓</span>
                  <span>Real-time technical questioning</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={() => onStart({ level, duration, focus })}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center space-x-3 group"
        >
          <span>Begin Interview Session</span>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default InterviewSetup;
