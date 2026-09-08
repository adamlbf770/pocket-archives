import { execFile } from "node:child_process";
import { copyFile, mkdir } from "node:fs/promises";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
const execFileAsync = promisify(execFile);

export async function analyzeOrientation(imagePath, { root = process.cwd() } = {}) {
  const detector = resolve(root, "scripts/detect-card-orientation.swift");
  try {
    const { stdout } = await execFileAsync(detector, [resolve(imagePath)], { maxBuffer: 16 * 1024 * 1024 });
    const result = JSON.parse(stdout.trim().split(/\r?\n/).at(-1));
    const [best, runnerUp] = result.candidates;
    const margin = Number(best?.score ?? 0) - Number(runnerUp?.score ?? 0);
    return {
      rotation: best?.rotation ?? 0,
      confidence: best?.score > 80 && margin >= 45 ? "high" : margin >= 18 ? "medium" : "low",
      margin,
      candidates: result.candidates.map(({ rotation, score }) => ({ rotation, score })),
      evidence: best?.lines?.slice(0, 12) ?? [],
    };
  } catch (error) {
    return { rotation: 0, confidence: "low", margin: 0, candidates: [], evidence: [], error: error instanceof Error ? error.message : String(error) };
  }
}

export async function normalizeOrientation(imagePath, analysis, outputPath) {
  if (analysis?.confidence !== "high") {
    throw new Error(`Cannot normalize uncertain orientation for ${imagePath}.`);
  }
  const source = resolve(imagePath);
  const target = resolve(outputPath);
  await mkdir(dirname(target), { recursive: true });
  if (Number(analysis.rotation) === 0) {
    await copyFile(source, target);
  } else {
    await execFileAsync("sips", ["--rotate", String(analysis.rotation), source, "--out", target], {
      maxBuffer: 16 * 1024 * 1024,
    });
  }
  return {
    path: target,
    sourcePath: source,
    sourceRotation: Number(analysis.rotation),
    confidence: analysis.confidence,
    rotation: 0,
    normalized: true,
  };
}
