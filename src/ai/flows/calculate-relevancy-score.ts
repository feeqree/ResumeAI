'use server';
/**
 * @fileOverview Flow to calculate the relevancy score of a resume against a job description.
 *
 * - calculateRelevancyScore - A function that calculates the relevancy score.
 * - CalculateRelevancyScoreInput - The input type for the calculateRelevancyScore function.
 * - CalculateRelevancyScoreOutput - The return type for the calculateRelevancyScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateRelevancyScoreInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description to compare the resume against.'),
  resumeText: z.string().describe('The text content of the resume.'),
});
export type CalculateRelevancyScoreInput = z.infer<
  typeof CalculateRelevancyScoreInputSchema
>;

const CalculateRelevancyScoreOutputSchema = z.object({
  relevancyScore: z
    .number()
    .describe(
      'A numerical score (0-100) indicating the resume relevance to the job description.'
    ),
  matchedSkills: z
    .array(z.string())
    .describe('An array of skills from the resume that match the job description.'),
  explanation: z
    .string()
    .describe(
      'A short textual explanation of the relevancy score, highlighting the matched skills.'
    ),
});
export type CalculateRelevancyScoreOutput = z.infer<
  typeof CalculateRelevancyScoreOutputSchema
>;

export async function calculateRelevancyScore(
  input: CalculateRelevancyScoreInput
): Promise<CalculateRelevancyScoreOutput> {
  return calculateRelevancyScoreFlow(input);
}

const calculateRelevancyScorePrompt = ai.definePrompt({
  name: 'calculateRelevancyScorePrompt',
  input: {schema: CalculateRelevancyScoreInputSchema},
  output: {schema: CalculateRelevancyScoreOutputSchema},
  prompt: `You are an AI expert in resume screening and candidate matching.

You will receive a job description and a resume text. Your task is to:

1.  Calculate a relevancy score (0-100) indicating how well the resume matches the job description.
2.  Identify and list the specific skills from the resume that align with the job description.
3.  Provide a concise explanation of the relevancy score, emphasizing the identified skills.

Job Description: {{{jobDescription}}}

Resume Text: {{{resumeText}}}

Ensure that the relevancyScore is a number between 0 and 100, matchedSkills is an array of strings, and explanation is a clear, textual summary.

Output:`,
});

const calculateRelevancyScoreFlow = ai.defineFlow(
  {
    name: 'calculateRelevancyScoreFlow',
    inputSchema: CalculateRelevancyScoreInputSchema,
    outputSchema: CalculateRelevancyScoreOutputSchema,
  },
  async input => {
    const {output} = await calculateRelevancyScorePrompt(input);
    return output!;
  }
);
