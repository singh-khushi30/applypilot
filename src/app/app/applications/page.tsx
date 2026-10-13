import { ApplicationBoard } from "@/components/applications/ApplicationBoard";

export const metadata = {
  title: "Applications · ApplyPilot",
};

export default function ApplicationsPage() {
  return (
    <div>
      <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">Applications</h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
        A sample pipeline. Nothing here has been submitted.
      </p>
      <div className="mt-8">
        <ApplicationBoard />
      </div>
    </div>
  );
}
