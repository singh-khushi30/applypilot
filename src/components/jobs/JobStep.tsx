"use client";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { JobSource } from "@/types/domain";

type JobStepProps = {
  source: JobSource;
  url: string;
  description: string;
  company: string;
  title: string;
  error: string | null;
  onSourceChange: (source: JobSource) => void;
  onUrlChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onTitleChange: (value: string) => void;
};

export function JobStep({
  source,
  url,
  description,
  company,
  title,
  error,
  onSourceChange,
  onUrlChange,
  onDescriptionChange,
  onCompanyChange,
  onTitleChange,
}: JobStepProps) {
  return (
    <div className="space-y-6">
      <Tabs
        value={source}
        onValueChange={(value) => onSourceChange(value as JobSource)}
      >
        <TabsList className="h-10 rounded-full bg-secondary p-1">
          <TabsTrigger value="url" className="rounded-full px-4">
            Job URL
          </TabsTrigger>
          <TabsTrigger value="description" className="rounded-full px-4">
            Paste description
          </TabsTrigger>
        </TabsList>
        <TabsContent value="url" className="mt-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Job URL</span>
            <Input
              value={url}
              onChange={(event) => onUrlChange(event.target.value)}
              inputMode="url"
              placeholder="https://company.com/jobs/software-engineer"
              className="h-12 rounded-2xl bg-card px-4 text-base"
              aria-invalid={Boolean(error && source === "url")}
            />
            <span className="mt-3 block text-sm text-muted-foreground">
              Job URL extraction isn’t available yet. Paste the job description to run this
              analysis.
            </span>
          </label>
        </TabsContent>
        <TabsContent value="description" className="mt-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Job description</span>
            <Textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Paste the role description"
              className="min-h-48 rounded-2xl bg-card px-4 py-3 text-base"
              aria-invalid={Boolean(error && source === "description")}
            />
          </label>
        </TabsContent>
      </Tabs>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium">
            Company <span className="font-normal text-muted-foreground">optional</span>
          </span>
          <Input
            value={company}
            onChange={(event) => onCompanyChange(event.target.value)}
            placeholder="Linear"
            className="h-11 rounded-2xl bg-card px-4"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">
            Role title <span className="font-normal text-muted-foreground">optional</span>
          </span>
          <Input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Software Engineer"
            className="h-11 rounded-2xl bg-card px-4"
          />
        </label>
      </div>
    </div>
  );
}
