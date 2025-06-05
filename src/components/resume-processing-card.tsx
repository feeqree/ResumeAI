
"use client";

import * as React from 'react';
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResultsTable } from "./results-table";
import type { ProcessedResume } from "@/lib/types";
import { UploadCloud, Zap, List, X, Loader2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { parseResume, type ParseResumeOutput } from '@/ai/flows/parse-resume';
import { detectResumeSpam } from '@/ai/flows/detect-resume-spam';
import { calculateRelevancyScore } from '@/ai/flows/calculate-relevancy-score';

interface ResumeProcessingCardProps {
  jobDescription: string;
}

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const BACKOFF_FACTOR = 2;

async function retryAsyncFunction<T>(
  fn: () => Promise<T>,
  fileNameForToast: string,
  operationName: string,
  toastFn: (options: any) => void
): Promise<T> {
  let attempts = 0;
  let delay = INITIAL_DELAY_MS;
  while (attempts < MAX_RETRIES) {
    try {
      return await fn();
    } catch (error: any) {
      attempts++;
      if (error.message && error.message.includes("503 Service Unavailable") && attempts < MAX_RETRIES) {
        toastFn({
          title: `API Overload: ${operationName} (${fileNameForToast})`,
          description: `Attempt ${attempts} of ${MAX_RETRIES} failed. Retrying in ${delay / 1000}s...`,
          variant: "default",
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= BACKOFF_FACTOR;
      } else {
        throw error; 
      }
    }
  }
  throw new Error(`Failed ${operationName} for ${fileNameForToast} after ${MAX_RETRIES} retries.`);
}


export function ResumeProcessingCard({ jobDescription }: ResumeProcessingCardProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingResults, setProcessingResults] = useState<ProcessedResume[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const uniqueNewFiles = newFiles.filter(nf => !uploadedFiles.some(uf => uf.name === nf.name));
      setUploadedFiles((prevFiles) => [...prevFiles, ...uniqueNewFiles]);
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    setProcessingResults(prevResults => prevResults.filter(result => result.fileName !== fileName));
  }

  const handleProcessResumes = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job Description Missing",
        description: "Please provide a job description before processing resumes.",
        variant: "destructive",
      });
      return;
    }
    if (uploadedFiles.length === 0) {
      toast({
        title: "No Resumes Uploaded",
        description: "Please upload resumes to process.",
        variant: "destructive",
      });
      return;
    }
     if (currentYear === null) {
      toast({
        title: "System Error",
        description: "Could not determine the current year. Please refresh.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    toast({
      title: "Processing Started",
      description: `Analyzing ${uploadedFiles.length} resume(s)...`,
    });

    const initialResults: ProcessedResume[] = uploadedFiles.map(file => ({
      id: `${file.name}-${Date.now()}`,
      file,
      fileName: file.name,
      status: 'queued',
    }));
    setProcessingResults(initialResults);
    

    for (let i = 0; i < initialResults.length; i++) {
      const currentResume = initialResults[i];
      
      try {
        setProcessingResults(prev => prev.map(r => r.id === currentResume.id ? { ...r, status: 'parsing' } : r));
        const resumeDataUri = await readFileAsDataURL(currentResume.file);
        
        const parsedResult: ParseResumeOutput = await retryAsyncFunction(
            () => parseResume({ resumeDataUri }),
            currentResume.fileName,
            "Parsing Resume",
            toast
        );
        
        setProcessingResults(prev => prev.map(r => r.id === currentResume.id ? { ...r, status: 'analyzing', parseOutput: parsedResult } : r));
        
        const resumeTextToAnalyze = parsedResult.parsedText;
        if (!resumeTextToAnalyze) {
            throw new Error("Resume parsing returned no text.");
        }

        const [spamResult, relevancyResult] = await Promise.all([
          retryAsyncFunction(
            () => detectResumeSpam({ resumeText: resumeTextToAnalyze, currentYear }),
            currentResume.fileName,
            "Spam Detection",
            toast
          ),
          retryAsyncFunction(
            () => calculateRelevancyScore({ jobDescription, resumeText: resumeTextToAnalyze }),
            currentResume.fileName,
            "Relevancy Scoring",
            toast
          )
        ]);

        setProcessingResults(prev => prev.map(r => r.id === currentResume.id ? {
          ...r,
          status: 'completed',
          spamDetectionData: spamResult,
          relevancyScoreData: relevancyResult,
        } : r));

        toast({
          title: "Resume Processed",
          description: `${currentResume.fileName} analyzed successfully.`,
        });

      } catch (error: any) {
        console.error(`Error processing ${currentResume.fileName}:`, error);
        const isServiceUnavailable = error.message && error.message.includes("503 Service Unavailable");
        const errorMessage = isServiceUnavailable
          ? `The AI service is temporarily overloaded. Please try again later for ${currentResume.fileName}.`
          : error.message || `An unknown error occurred while processing ${currentResume.fileName}.`;

        setProcessingResults(prev => prev.map(r => r.id === currentResume.id ? {
          ...r,
          status: 'error',
          errorMessage: isServiceUnavailable 
            ? `AI service temporarily overloaded. Please try again later.`
            : (error.message || 'An unknown error occurred'),
        } : r));
        
        toast({
          title: isServiceUnavailable ? "API Service Overload" : "Processing Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
    setIsProcessing(false);
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <UploadCloud className="w-6 h-6 mr-2 text-primary" />
          Resume Processing
        </CardTitle>
        <CardDescription>
          Upload resumes (PDF, DOCX, TXT) and process them against the job description.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Input
            id="resume-upload"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt" 
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isProcessing}>
            <UploadCloud className="w-4 h-4 mr-2" />
            Select Resumes
          </Button>
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium flex items-center"><List className="w-4 h-4 mr-2" />Selected Files:</h3>
              <ul className="max-h-32 overflow-y-auto rounded-md border p-2 space-y-1">
                {uploadedFiles.map((file) => (
                  <li key={file.name} className="text-xs flex justify-between items-center p-1 bg-muted/50 rounded">
                    <span className="truncate" title={file.name}>{file.name}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFile(file.name)} disabled={isProcessing}>
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Button onClick={handleProcessResumes} disabled={isProcessing || uploadedFiles.length === 0} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
            {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <Zap className="w-4 h-4 mr-2" />
            )}
            Process Resumes
            </Button>
        </div>
         <div className="flex items-start text-xs text-muted-foreground mt-2">
            <Info className="w-3 h-3 mr-1.5 mt-0.5 shrink-0" />
            <p>
                By processing resumes, you acknowledge that resume data will be sent to a third-party AI service for analysis.
            </p>
        </div>


        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 font-headline">Processing Results</h3>
          <ResultsTable results={processingResults} />
        </div>
      </CardContent>
    </Card>
  );
}
