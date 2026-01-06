
import React from 'react';

interface HeaderProps {
  onReset: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-slate-800">
      <div 
        className="flex items-center space-x-2 cursor-pointer" 
        onClick={onReset}
      >
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight gradient-text">InterviewAI</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-xs font-medium text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">LIVE API MODE</span>
        <button 
          onClick={onReset}
          className="text-sm text-slate-300 hover:text-white transition-colors"
        >
          New Session
        </button>
      </div>
    </header>
  );
};

export default Header;
