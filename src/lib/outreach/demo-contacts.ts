import { classifyContact } from "@/lib/outreach/relevance";
import type { Contact } from "@/types/domain";

const EXAMPLES = [
  {
    id: "demo-alex-example",
    name: "Alex Example",
    title: "Engineering Manager",
    context: "Fictional example. ApplyPilot did not look this person up.",
  },
  {
    id: "demo-jordan-sample",
    name: "Jordan Sample",
    title: "Technical Recruiter",
    context: "Fictional example. ApplyPilot did not look this person up.",
  },
  {
    id: "demo-riley-placeholder",
    name: "Riley Placeholder",
    title: "Software Engineer",
    context: "Fictional example. ApplyPilot did not look this person up.",
  },
] as const;

/** Example people for the current role. Names are placeholders, not discovered profiles. */
export function demoContacts(job: { title: string; company: string }): Contact[] {
  return EXAMPLES.map((person) => {
    const relevance = classifyContact({
      jobTitle: job.title,
      jobCompany: job.company,
      personTitle: person.title,
      personCompany: job.company,
    });
    return {
      id: person.id,
      source: "demo",
      name: person.name,
      title: person.title,
      company: job.company,
      context: person.context,
      profileUrl: null,
      ...relevance,
    };
  });
}
