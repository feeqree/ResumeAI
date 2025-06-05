import { config } from 'dotenv';
config();

import '@/ai/flows/calculate-relevancy-score.ts';
import '@/ai/flows/detect-resume-spam.ts';
import '@/ai/flows/parse-resume.ts';