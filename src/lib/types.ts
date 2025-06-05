import type { CalculateRelevancyScoreOutput } from '@/ai/flows/calculate-relevancy-score';
import type { DetectResumeSpamOutput } from '@/ai/flows/detect-resume-spam';
import type { ParseResumeOutput } from '@/ai/flows/parse-resume';

export interface ProcessedResume {
  id: string;
  file: File;
  fileName: string;
  status: 'queued' | 'parsing' | 'analyzing' | 'completed' | 'error';
  parseOutput?: ParseResumeOutput;
  relevancyScoreData?: CalculateRelevancyScoreOutput;
  spamDetectionData?: DetectResumeSpamOutput;
  errorMessage?: string;
}
