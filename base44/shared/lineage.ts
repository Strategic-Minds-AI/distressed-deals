/**
 * Artifact lineage helpers — deterministic IDs, hashes, dependency refs.
 * Every generated artifact records: artifact_id, project_id, run_id, generator_id/version,
 * source_step, filename, media_type, size, SHA-256, dependencies, validation_state, timestamps.
 */
import { createHash } from "crypto";

export function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function makeArtifactId(projectId: string, runId: string, step: string, filename: string): string {
  return sha256(`${projectId}:${runId}:${step}:${filename}`).slice(0, 24);
}

export function makeRunId(projectId: string, generatorId: string, inputHash: string): string {
  return sha256(`${projectId}:${generatorId}:${inputHash}:${Date.now()}:${Math.random()}`).slice(0, 24);
}

export function makeInputHash(input: any): string {
  return sha256(JSON.stringify(sortKeys(input)));
}

function sortKeys(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  return Object.keys(obj).sort().reduce((acc: any, k) => { acc[k] = sortKeys(obj[k]); return acc; }, {});
}

export interface ArtifactRef {
  artifact_id: string;
  project_id: string;
  run_id: string;
  generator_id: string;
  generator_version: string;
  source_step: string;
  filename: string;
  media_type: string;
  size_bytes: number;
  sha256: string;
  dependencies: string[];
  validation_state: string;
  frozen: boolean;
}

export function buildArtifactRef(params: {
  project_id: string;
  run_id: string;
  generator_id: string;
  generator_version: string;
  source_step: string;
  filename: string;
  media_type: string;
  content: string;
  dependencies?: string[];
}): ArtifactRef {
  const { project_id, run_id, generator_id, generator_version, source_step, filename, media_type, content, dependencies = [] } = params;
  return {
    artifact_id: makeArtifactId(project_id, run_id, source_step, filename),
    project_id,
    run_id,
    generator_id,
    generator_version,
    source_step,
    filename,
    media_type,
    size_bytes: Buffer.byteLength(content, "utf8"),
    sha256: sha256(content),
    dependencies,
    validation_state: "not_validated",
    frozen: false,
  };
}