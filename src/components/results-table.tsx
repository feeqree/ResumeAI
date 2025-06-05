
"use client";

import * as React from "react";
import type { ProcessedResume } from "@/lib/types";
import type { CalculateRelevancyScoreOutput } from '@/ai/flows/calculate-relevancy-score';
import type { DetectResumeSpamOutput } from '@/ai/flows/detect-resume-spam';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  FileArchive,
  Gauge,
  ShieldCheck,
  ShieldAlert,
  ListChecks,
  MessageSquareText,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface ResultsTableProps {
  results: ProcessedResume[];
}

type SortableKeys = "fileName" | "relevancyScore" | "isSpam";
type DialogType = 'spam' | 'skills' | 'explanation';

export function ResultsTable({ results }: ResultsTableProps) {
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKeys | null; direction: "ascending" | "descending" }>({
    key: null,
    direction: "ascending",
  });
  const isMobile = useIsMobile();
  const [activeDialog, setActiveDialog] = React.useState<{ resumeId: string; type: DialogType } | null>(null);

  const openDialog = (resumeId: string, type: DialogType) => {
    setActiveDialog({ resumeId, type });
  };

  const closeDialog = () => {
    setActiveDialog(null);
  };

  const sortedResults = React.useMemo(() => {
    let sortableItems = [...results];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue: string | number | boolean | undefined;
        let bValue: string | number | boolean | undefined;

        if (sortConfig.key === "fileName") {
          aValue = a.fileName.toLowerCase();
          bValue = b.fileName.toLowerCase();
        } else if (sortConfig.key === "relevancyScore") {
          aValue = a.relevancyScoreData?.relevancyScore;
          bValue = b.relevancyScoreData?.relevancyScore;
        } else if (sortConfig.key === "isSpam") {
          aValue = a.spamDetectionData?.isSpam;
          bValue = b.spamDetectionData?.isSpam;
        }
        
        if (aValue === undefined && bValue !== undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (aValue !== undefined && bValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue === undefined && bValue === undefined) return 0;


        if (aValue! < bValue!) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue! > bValue!) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [results, sortConfig]);

  const requestSort = (key: SortableKeys) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableKeys) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />;
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUp className="ml-2 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-2 h-3 w-3" />
    );
  };


  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileArchive className="w-12 h-12 mx-auto mb-4" />
        <p>No resumes processed yet. Upload resumes and click "Process Resumes".</p>
      </div>
    );
  }

  const renderSpamCheckContent = (item: ProcessedResume) => (
    <>
      <p className="text-sm font-semibold">Confidence: {(item.spamDetectionData!.confidenceScore * 100).toFixed(0)}%</p>
      <p className="text-sm mt-1">{item.spamDetectionData!.explanation}</p>
    </>
  );

  const renderMatchedSkillsContent = (item: ProcessedResume) => (
     <ul className="list-disc list-inside text-xs">
        {item.relevancyScoreData!.matchedSkills!.map(skill => <li key={skill}>{skill}</li>)}
    </ul>
  );

  const renderRelevancyExplanationContent = (item: ProcessedResume) => (
    <p className="text-xs">{item.relevancyScoreData!.explanation}</p>
  );

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <Button variant="ghost" onClick={() => requestSort("fileName")} className="px-1 py-0 h-auto text-xs hover:bg-transparent">
                  Filename
                  {getSortIcon("fileName")}
                </Button>
              </TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[150px]">
                 <Button variant="ghost" onClick={() => requestSort("relevancyScore")} className="px-1 py-0 h-auto text-xs hover:bg-transparent">
                  Relevancy
                  {getSortIcon("relevancyScore")}
                </Button>
              </TableHead>
              <TableHead className="w-[150px]">
                <Button variant="ghost" onClick={() => requestSort("isSpam")} className="px-1 py-0 h-auto text-xs hover:bg-transparent">
                  Spam Check
                  {getSortIcon("isSpam")}
                </Button>
              </TableHead>
              <TableHead>Matched Skills</TableHead>
              <TableHead>Relevancy Explanation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedResults.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium flex items-center">
                  <FileArchive className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate" title={item.fileName}>{item.fileName}</span>
                </TableCell>
                <TableCell>
                  {item.status === "queued" && <Badge variant="outline">Queued</Badge>}
                  {item.status === "parsing" && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                  {item.status === "analyzing" && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                  {item.status === "completed" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {item.status === "error" && (
                    <Tooltip>
                      <TooltipTrigger>
                        <XCircle className="w-5 h-5 text-destructive" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{item.errorMessage || "Unknown error"}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  {item.relevancyScoreData ? (
                    <div className="flex flex-col space-y-1">
                       <div className="flex items-center">
                        <Gauge className="w-4 h-4 mr-1 text-primary" /> 
                        <span className="text-sm font-semibold">{item.relevancyScoreData.relevancyScore}%</span>
                       </div>
                      <Progress value={item.relevancyScoreData.relevancyScore} className="h-2" />
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {item.spamDetectionData ? (
                    isMobile ? (
                      <Dialog
                        open={activeDialog?.resumeId === item.id && activeDialog?.type === 'spam'}
                        onOpenChange={(isOpen) => isOpen ? openDialog(item.id, 'spam') : closeDialog()}
                      >
                        <DialogTrigger asChild>
                          {item.spamDetectionData.isSpam ? (
                            <Badge variant="destructive" className="cursor-pointer">
                              <ShieldAlert className="w-4 h-4 mr-1" />
                              Spam
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="cursor-pointer border-green-500 text-green-700 bg-green-100">
                              <ShieldCheck className="w-4 h-4 mr-1" />
                              Genuine
                            </Badge>
                          )}
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Spam Check: {item.fileName}</DialogTitle>
                          </DialogHeader>
                          <div className="py-2">
                            {renderSpamCheckContent(item)}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger>
                          {item.spamDetectionData.isSpam ? (
                            <Badge variant="destructive" className="cursor-default">
                              <ShieldAlert className="w-4 h-4 mr-1" />
                              Spam
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="cursor-default border-green-500 text-green-700 bg-green-100">
                              <ShieldCheck className="w-4 h-4 mr-1" />
                              Genuine
                            </Badge>
                          )}
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          {renderSpamCheckContent(item)}
                        </TooltipContent>
                      </Tooltip>
                    )
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {item.relevancyScoreData?.matchedSkills && item.relevancyScoreData.matchedSkills.length > 0 ? (
                     isMobile ? (
                      <Dialog
                        open={activeDialog?.resumeId === item.id && activeDialog?.type === 'skills'}
                        onOpenChange={(isOpen) => isOpen ? openDialog(item.id, 'skills') : closeDialog()}
                      >
                        <DialogTrigger asChild>
                           <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                                <div className="flex items-center cursor-pointer">
                                    <ListChecks className="w-4 h-4 mr-1 text-primary shrink-0" />
                                    <span className="text-sm truncate">
                                        {item.relevancyScoreData.matchedSkills.slice(0,3).join(", ")}
                                        {item.relevancyScoreData.matchedSkills.length > 3 && '...'}
                                    </span>
                                </div>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Matched Skills: {item.fileName}</DialogTitle>
                          </DialogHeader>
                           <div className="py-2 max-h-60 overflow-y-auto">
                            {renderMatchedSkillsContent(item)}
                          </div>
                        </DialogContent>
                      </Dialog>
                     ) : (
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="flex items-center">
                                    <ListChecks className="w-4 h-4 mr-1 text-primary shrink-0" />
                                    <span className="text-sm truncate">
                                        {item.relevancyScoreData.matchedSkills.slice(0,3).join(", ")}
                                        {item.relevancyScoreData.matchedSkills.length > 3 && '...'}
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                {renderMatchedSkillsContent(item)}
                            </TooltipContent>
                        </Tooltip>
                     )
                  ) : (
                    item.relevancyScoreData ? <span className="text-xs text-muted-foreground">None</span> : "-"
                  )}
                </TableCell>
                <TableCell>
                  {item.relevancyScoreData?.explanation ? (
                     isMobile ? (
                       <Dialog
                        open={activeDialog?.resumeId === item.id && activeDialog?.type === 'explanation'}
                        onOpenChange={(isOpen) => isOpen ? openDialog(item.id, 'explanation') : closeDialog()}
                       >
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-auto w-auto p-0 hover:bg-transparent">
                                <MessageSquareText className="w-5 h-5 text-primary cursor-pointer" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Relevancy Explanation: {item.fileName}</DialogTitle>
                          </DialogHeader>
                          <div className="py-2">
                            {renderRelevancyExplanationContent(item)}
                          </div>
                        </DialogContent>
                       </Dialog>
                     ) : (
                        <Tooltip>
                        <TooltipTrigger className="cursor-default">
                            <MessageSquareText className="w-5 h-5 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md">
                            {renderRelevancyExplanationContent(item)}
                        </TooltipContent>
                        </Tooltip>
                     )
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}


    