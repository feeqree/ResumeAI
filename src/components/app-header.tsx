"use client";

import { Bot } from "lucide-react";

export function AppHeader() {
  return (
    <header className="w-full py-8 text-center">
      <div className="flex items-center justify-center mb-4">
        <Bot className="w-12 h-12 mr-3 text-primary" />
        <h1 className="text-4xl font-headline font-bold text-primary">
          ResumeFlow AI
        </h1>
      </div>
      <p className="text-lg text-muted-foreground">
        Streamline your hiring with AI-powered resume analysis.
      </p>
    </header>
  );
}
