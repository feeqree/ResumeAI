"use client";

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface JobDescriptionCardProps {
  jobDescription: string;
  setJobDescription: (value: string) => void;
}

export function JobDescriptionCard({ jobDescription, setJobDescription }: JobDescriptionCardProps) {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <FileText className="w-6 h-6 mr-2 text-primary" />
          Job Description
        </CardTitle>
        <CardDescription>
          Paste the job description below to analyze resumes against it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full gap-1.5">
          <Label htmlFor="job-description" className="sr-only">Job Description</Label>
          <Textarea
            id="job-description"
            placeholder="Paste job description here..."
            value={jobDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJobDescription(e.target.value)}
            rows={10}
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
