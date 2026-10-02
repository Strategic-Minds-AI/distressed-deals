/**
 * Validation framework — validators return PASS / FAIL / BLOCKED with evidence.
 * Implementers do not certify themselves; independent validation re-fetches state.
 */

export type ValidationResult = "PASS" | "FAIL" | "BLOCKED";

export interface ValidatorOutput {
  validator_id: string;
  result: ValidationResult;
  evidence: string;
  timestamp: string;
}

export interface Validator {
  id: string;
  run: (input: any) => { result: ValidationResult; evidence: string };
}

export function makeValidator(id: string, fn: (input: any) => { result: ValidationResult; evidence: string }): Validator {
  return { id, run: fn };
}

export function runValidator(validator: Validator, input: any): ValidatorOutput {
  const out = validator.run(input);
  return {
    validator_id: validator.id,
    result: out.result,
    evidence: out.evidence,
    timestamp: new Date().toISOString(),
  };
}

export function aggregateValidation(results: ValidatorOutput[]): { overall: ValidationResult; receipts: ValidatorOutput[]; passed: number; failed: number; blocked: number } {
  const blocked = results.filter((r) => r.result === "BLOCKED").length;
  const failed = results.filter((r) => r.result === "FAIL").length;
  const passed = results.filter((r) => r.result === "PASS").length;
  let overall: ValidationResult = "PASS";
  if (blocked > 0) overall = "BLOCKED";
  else if (failed > 0) overall = "FAIL";
  return { overall, receipts: results, passed, failed, blocked };
}

// Standard schema validator — checks an object against required fields
export function validateSchema(obj: any, requiredFields: string[]): { result: ValidationResult; evidence: string } {
  const missing = requiredFields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === "");
  if (missing.length > 0) return { result: "FAIL", evidence: `Missing required fields: ${missing.join(", ")}` };
  return { result: "PASS", evidence: `All ${requiredFields.length} required fields present` };
}

// Standard completeness validator — no TODO/FIXME/stubs
export function validateNoStubs(content: string): { result: ValidationResult; evidence: string } {
  const stubs = ["TODO", "FIXME", "NotImplemented", "not implemented", "throw new Error(\"not implemented\")", "fake success"];
  const found = stubs.filter((s) => content.includes(s));
  if (found.length > 0) return { result: "FAIL", evidence: `Stub markers found: ${found.join(", ")}` };
  return { result: "PASS", evidence: "No stub markers detected" };
}