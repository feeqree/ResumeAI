
'use server';

/**
 * @fileOverview Parses resumes in various formats (PDF, DOCX) into a standardized text format,
 * and attempts to extract key skills and experience summaries.
 *
 * - parseResume - A function that handles the resume parsing process.
 * - ParseResumeInput - The input type for the parseResume function.
 * - ParseResumeOutput - The return type for the parseResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "A resume file (PDF, DOCX, TXT) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ParseResumeInput = z.infer<typeof ParseResumeInputSchema>;

const ParseResumeOutputSchema = z.object({
  parsedText: z
    .string()
    .describe('The extracted text content from the resume in a standardized format.'),
  extractedSkills: z
    .array(z.string())
    .optional()
    .describe('A list of skills explicitly mentioned or inferred from the resume text.'),
  extractedExperienceSummaries: z
    .array(z.string())
    .optional()
    .describe('Short summaries or key phrases extracted from work experience sections.'),
});
export type ParseResumeOutput = z.infer<typeof ParseResumeOutputSchema>;

export async function parseResume(input: ParseResumeInput): Promise<ParseResumeOutput> {
  return parseResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseResumePrompt',
  input: {schema: ParseResumeInputSchema},
  output: {schema: ParseResumeOutputSchema},
  prompt: `You are an expert at extracting text and structured information from documents.

  Extract all of the text from the following resume. Ignore headers and footers, and attempt to order the text in a sensible way.
  This will be the 'parsedText'.

  Additionally, from the extracted text:
  1. Identify and list key skills mentioned in a section or throughout the resume. This will be 'extractedSkills'.
  2. Provide short, distinct summaries or key phrases from the work experience sections. This will be 'extractedExperienceSummaries'.

  Resume: {{media url=resumeDataUri}}`,
});

const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResumeFlow',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ParseResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
