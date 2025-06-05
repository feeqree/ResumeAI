
"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { JobDescriptionCard } from "@/components/job-description-card";
import { ResumeProcessingCard } from "@/components/resume-processing-card";

export default function Home() {
  const [jobDescription, setJobDescription] = useState<string>("");
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-background selection:bg-primary/20 selection:text-primary">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <AppHeader />
        <main className="space-y-8">
          <JobDescriptionCard
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
          />
          <ResumeProcessingCard jobDescription={jobDescription} />
        </main>
        <footer className="text-center py-6 text-sm text-muted-foreground">
          {currentYear !== null ? (
            <p>&copy; {currentYear} ResumeFlow AI. Powered by Generative AI.</p>
          ) : (
            <p>&copy; ResumeFlow AI. Powered by Generative AI.</p>
          )}
        </footer>
      </div>
    </div>
  );
}
