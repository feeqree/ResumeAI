
'use server';

/**
 * @fileOverview A resume spam detection AI agent.
 *
 * - detectResumeSpam - A function that handles the resume spam detection process.
 * - DetectResumeSpamInput - The input type for the detectResumeSpam function.
 * - DetectResumeSpamOutput - The return type for the detectResumeSpam function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectResumeSpamInputSchema = z.object({
  resumeText: z.string().describe('The text content of the resume to be checked for spam.'),
  currentYear: z.number().describe('The current calendar year to provide context for dates mentioned in the resume.'),
});
export type DetectResumeSpamInput = z.infer<typeof DetectResumeSpamInputSchema>;

const DetectResumeSpamOutputSchema = z.object({
  isSpam: z.boolean().describe('Whether the resume is likely to be spam or AI-generated.'),
  confidenceScore: z
    .number()
    .describe('A score between 0 and 1 indicating the confidence in the spam detection (1 being most confident).'),
  explanation: z
    .string()
    .describe('A brief explanation of why the resume was classified as spam or not spam, considering the current year for date-related claims.'),
});
export type DetectResumeSpamOutput = z.infer<typeof DetectResumeSpamOutputSchema>;

export async function detectResumeSpam(input: DetectResumeSpamInput): Promise<DetectResumeSpamOutput> {
  return detectResumeSpamFlow(input);
}

const detectResumeSpamPrompt = ai.definePrompt({
  name: 'detectResumeSpamPrompt',
  input: {schema: DetectResumeSpamInputSchema},
  output: {schema: DetectResumeSpamOutputSchema},
  prompt: `You are an AI-powered spam detection expert specializing in identifying spam or AI-generated resumes. The current year is {{{currentYear}}}.

  Analyze the resume text provided and determine if it is likely to be spam or AI-generated content.
  When evaluating dates (e.g., graduation, awards, experience), use the current year {{{currentYear}}} as a reference.
  - Claims from the recent past or within {{{currentYear}}} should be considered plausible unless other factors suggest fabrication.
  - Claims for achievements or qualifications dated significantly in the future (e.g., {{{currentYear}}} + 2 or more) are highly suspicious.
  - Minor discrepancies in dates for very recent events in {{{currentYear}}} might be acceptable if the overall content seems genuine.

  Focus on identifying:
  1. Verifiably false information (e.g., awards from a future year like {{{currentYear}}} + 5, claims of attending non-existent institutions, or impossible qualifications).
  2. Grossly exaggerated or impossible claims regarding responsibilities, achievements, or timelines.
  3. Incoherent, nonsensical, or placeholder text.
  4. Overly generic, templated text that lacks any personalization or specific details suggestive of a mass application.

  Be cautious about flagging content as spam if it's merely unconventional, ambitious, or contains minor typos, as long as it's not clearly fabricated or nonsensical. Distinguish between genuine (though perhaps poorly written) content and deliberate attempts to deceive or spam.

  Provide a confidence score between 0 and 1 (where 1 indicates highest confidence that it IS spam).
  Explain your reasoning, especially if it relates to dates or seemingly unrealistic claims, referencing the current year {{{currentYear}}}.

  Resume Text: {{{resumeText}}}
  `,
});

const detectResumeSpamFlow = ai.defineFlow(
  {
    name: 'detectResumeSpamFlow',
    inputSchema: DetectResumeSpamInputSchema,
    outputSchema: DetectResumeSpamOutputSchema,
  },
  async input => {
    const {output} = await detectResumeSpamPrompt(input);
    return output!;
  }
);
