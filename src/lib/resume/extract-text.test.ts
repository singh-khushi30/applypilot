import { ResumeExtractionError } from "@/lib/ai/errors";
import { extractResumeText } from "@/lib/resume/extract-text";
import { describe, expect, it } from "vitest";

// Builds a one-page PDF with a valid xref table. An empty `lines` list
// produces a page with no text, like a scanned resume.
function buildPdf(lines: string[]) {
  const stream = lines.length
    ? `BT /F1 12 Tf 72 720 Td 14 TL ${lines.map((line) => `(${line}) Tj T*`).join(" ")} ET`
    : "";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(body);
}

describe("extractResumeText", () => {
  it("reads text from a text-based PDF", async () => {
    const text = await extractResumeText(
      buildPdf([
        "Jordan Example Software Engineer",
        "Built TypeScript services and React interfaces for a payments product",
      ]),
    );
    expect(text).toContain("TypeScript services");
  });

  it("rejects a PDF without readable text", async () => {
    await expect(extractResumeText(buildPdf([]))).rejects.toBeInstanceOf(ResumeExtractionError);
  });

  it("rejects bytes that are not a PDF", async () => {
    await expect(
      extractResumeText(new TextEncoder().encode("%PDF-1.4 broken")),
    ).rejects.toThrow(/text-based PDF/);
  });
});
