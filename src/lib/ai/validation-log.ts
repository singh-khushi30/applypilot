const SAFE_CODE = /^[a-z0-9_]+$/i;

export type ValidationIssueMeta = {
  path: string;
  code: string;
};

type IssueLike = {
  path?: PropertyKey[];
  code?: string;
};

export function validationIssueMetadata(error: { issues?: IssueLike[] }): ValidationIssueMeta[] {
  const issues = Array.isArray(error.issues) ? error.issues : [];
  return issues.slice(0, 20).map((issue) => {
    const path = Array.isArray(issue.path) ? issue.path.map((part) => String(part)).join(".") : "";
    const code = typeof issue.code === "string" && SAFE_CODE.test(issue.code) ? issue.code : "invalid";
    return { path, code };
  });
}

export function logValidationFailure(attempt: number, issues: ValidationIssueMeta[]) {
  console.error(
    JSON.stringify({
      event: "analysis_validation_failure",
      attempt,
      issues,
    }),
  );
}
