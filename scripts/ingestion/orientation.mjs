import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
const execFileAsync = promisify(execFile);

export async function analyzeOrientation(imagePath, { root = process.cwd() } = {}) {
  const detector = resolve(root, "scripts/ocr-card-landmark-orientation.swift");
  try {
    const { stdout } = await execFileAsync("swift", [detector, resolve(imagePath)], { maxBuffer: 16 * 1024 * 1024 });
    const result = JSON.parse(stdout.trim().split(/\r?\n/).at(-1));
    const scores = {
      0: Number(result.uprightScore ?? 0),
      180: Number(result.invertedScore ?? 0),
      90: Number(result.counterclockwiseScore ?? 0),
      270: Number(result.clockwiseScore ?? 0),
    };
    const parsedRawRotation = Number(result.correctionRotation);
    const rawRotation = Number.isFinite(parsedRawRotation) ? parsedRawRotation : 0;
    const exifRotation = exifOrientationRotation(result.exifOrientation);
    const rotation = (rawRotation - exifRotation + 360) % 360;
    const axisScores = [0, 180].includes(rawRotation) ? [scores[0], scores[180]] : [scores[90], scores[270]];
    const margin = Math.abs(axisScores[0] - axisScores[1]);
    return {
      rotation,
      confidence: result.decision === "UNCERTAIN" ? "low" : margin >= 6 ? "high" : "medium",
      margin,
      scores,
      decision: result.decision,
      rawRotation,
      exifOrientation: Number(result.exifOrientation ?? 1),
      exifRotation,
      evidence: result.landmarks ?? [],
    };
  } catch (error) {
    return { rotation: 0, confidence: "low", margin: 0, scores: {}, evidence: [], error: error instanceof Error ? error.message : String(error) };
  }
}

export async function normalizeOrientation(imagePath, analysis, outputPath) {
  if (analysis?.confidence !== "high") {
    throw new Error(`Cannot normalize uncertain orientation for ${imagePath}.`);
  }
  const source = resolve(imagePath);
  const target = resolve(outputPath);
  await mkdir(dirname(target), { recursive: true });
  await execFileAsync("sips", ["-s", "format", "png", "--rotate", String(analysis.rotation), source, "--out", target], {
    maxBuffer: 16 * 1024 * 1024,
  });
  return {
    path: target,
    sourcePath: source,
    sourceRotation: Number(analysis.rotation),
    confidence: analysis.confidence,
    rotation: 0,
    normalized: true,
  };
}

function exifOrientationRotation(value) {
  return ({ 1: 0, 3: 180, 6: 90, 8: 270 })[Number(value)] ?? 0;
}
