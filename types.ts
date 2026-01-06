
export enum AppStage {
  UPLOAD = 'UPLOAD',
  PREPARING = 'PREPARING',
  INTERVIEW = 'INTERVIEW',
  FEEDBACK = 'FEEDBACK'
}

export enum SkillLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  EXPERT = 'Expert'
}

export interface ResumeData {
  name: string;
  skills: string[];
  experienceSummary: string;
  suggestedQuestions: string[];
}

export interface InterviewConfig {
  level: SkillLevel;
  duration: number; // in minutes
  focus: string;
}

export interface FeedbackData {
  score: number;
  strengths: string[];
  areasForImprovement: string[];
  technicalAccuracy: string;
  communicationSkills: string;
  overallSummary: string;
}

export interface TranscriptionItem {
  speaker: 'user' | 'ai';
  text: string;
  timestamp: number;
}
