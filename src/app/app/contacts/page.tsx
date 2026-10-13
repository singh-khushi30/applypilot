import { PrimaryLink } from "@/components/landing/links";

export const metadata = {
  title: "Contacts · ApplyPilot",
};

export default function ContactsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">Contacts</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        Relevant people will appear here after ApplyPilot researches a company.
      </p>
      <div className="mt-8">
        <PrimaryLink href="/app/new">Analyze a job</PrimaryLink>
      </div>
    </div>
  );
}
