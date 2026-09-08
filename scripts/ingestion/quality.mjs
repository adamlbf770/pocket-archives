import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);

async function dimensions(path) {
  const { stdout } = await execFileAsync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", path]);
  return {
    width: Number(stdout.match(/pixelWidth:\s*(\d+)/)?.[1] ?? 0),
    height: Number(stdout.match(/pixelHeight:\s*(\d+)/)?.[1] ?? 0),
  };
}

export async function inspectScan(path, { minBytes = 35_000, minShortEdge = 500 } = {}) {
  const reasons = [];
  try {
    const info = await stat(path);
    const data = await readFile(path);
    const size = await dimensions(path);
    if (info.size < minBytes) reasons.push("IMAGE_TOO_SMALL");
    if (Math.min(size.width, size.height) < minShortEdge) reasons.push("RESOLUTION_TOO_LOW");
    if (!size.width || !size.height) reasons.push("DIMENSIONS_UNREADABLE");
    const ratio = Math.max(size.width, size.height) / Math.max(1, Math.min(size.width, size.height));
    if (ratio < 1.15 || ratio > 1.75) reasons.push("CROP_OR_GEOMETRY_SUSPECT");
    return { path, bytes: info.size, ...size, ratio, hash: createHash("sha256").update(data).digest("hex"), rescanRequired: reasons.some((reason) => reason !== "CROP_OR_GEOMETRY_SUSPECT"), reasons };
  } catch (error) {
    return { path, bytes: 0, width: 0, height: 0, ratio: 0, hash: null, rescanRequired: true, reasons: ["IMAGE_UNREADABLE"], error: error instanceof Error ? error.message : String(error) };
  }
}

export async function inspectPair(frontPath, backPath) {
  const [front, back] = await Promise.all([inspectScan(frontPath), inspectScan(backPath)]);
  const reasons = [...front.reasons.map((reason) => `FRONT_${reason}`), ...back.reasons.map((reason) => `BACK_${reason}`)];
  if (front.hash && front.hash === back.hash) reasons.push("FRONT_BACK_DUPLICATE");
  return { front, back, rescanRequired: front.rescanRequired || back.rescanRequired || reasons.includes("FRONT_BACK_DUPLICATE"), reasons };
}
