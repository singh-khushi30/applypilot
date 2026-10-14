import { classifyContact } from "@/lib/outreach/relevance";
import { describe, expect, it } from "vitest";

const job = { jobTitle: "Senior Frontend Engineer", jobCompany: "Northwind Labs" };

describe("classifyContact", () => {
  it("treats an engineering manager at the target company as a likely hiring manager", () => {
    const result = classifyContact({
      ...job,
      personTitle: "Engineering Manager",
      personCompany: "Northwind Labs, Inc.",
    });
    expect(result.relevance).toBe("hiring_manager");
    expect(result.relevanceReason).toMatch(/likely relevant/i);
    expect(result.relevanceReason.toLowerCase()).not.toMatch(/owns|definitely/);
  });

  it("classifies recruiting titles without claiming they own the opening", () => {
    const result = classifyContact({
      ...job,
      personTitle: "Technical Recruiter",
      personCompany: "Northwind Labs",
    });
    expect(result.relevance).toBe("recruiter");
    expect(result.relevanceReason).toMatch(/not confirmed to own/i);
  });

  it("classifies an engineer at the same company as a possible teammate", () => {
    const result = classifyContact({
      ...job,
      personTitle: "Software Engineer",
      personCompany: "Northwind Labs",
    });
    expect(result.relevance).toBe("potential_teammate");
  });

  it("classifies engineering leadership elsewhere as an engineering leader", () => {
    const result = classifyContact({
      ...job,
      personTitle: "Director of Engineering",
      personCompany: "Other Co",
    });
    expect(result.relevance).toBe("engineering_leader");
    expect(result.relevanceReason).toMatch(/not confirmed/i);
  });

  it("marks an unrelated title as low relevance", () => {
    const result = classifyContact({
      ...job,
      personTitle: "Payroll Specialist",
      personCompany: "Northwind Labs",
    });
    expect(result.relevance).toBe("low_relevance");
  });
});
