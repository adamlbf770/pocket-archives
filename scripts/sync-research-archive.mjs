import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const research = resolve(root, "research");
const output = resolve(root, "app/archive/canonical-data.generated.ts");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === '"' && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(field);
      field = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [headers, ...records] = rows;
  return records.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

function parseTimeline(markdown) {
  const section = markdown.match(/## Master timeline\n\n([\s\S]*?)\n\n## /)?.[1] ?? "";
  return section
    .split("\n")
    .filter((line) => line.startsWith("|") && !/^\|[- |]+\|$/.test(line))
    .slice(1)
    .map((line, index) => {
      const [date, event, evidence, confidence] = line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim());
      return { id: `PA-TL-${String(index + 1).padStart(3, "0")}`, date, event, evidence, confidence };
    });
}

const [dossier, sourceCsv, capsuleCsv, imageCsv, acquisitionCsv, cgcCsv] =
  await Promise.all([
    readFile(resolve(research, "pokemon-history-dossier.md"), "utf8"),
    readFile(resolve(research, "source-ledger.csv"), "utf8"),
    readFile(resolve(research, "capsule-monsters-artifact-register.csv"), "utf8"),
    readFile(resolve(research, "image-provenance-register.csv"), "utf8"),
    readFile(resolve(research, "acquisition-roadmap-100.csv"), "utf8"),
    readFile(resolve(research, "cgc-impacted-certificates.csv"), "utf8"),
  ]);

const sources = parseCsv(sourceCsv);
const images = parseCsv(imageCsv);
const imageByUrl = new Map(images.map((image) => [image.current_digital_source, image]));

const capsuleRecords = parseCsv(capsuleCsv).map((record) => {
  const image = imageByUrl.get(record.current_image_source);
  return {
    recordId: record.artifact_id,
    title: record.title_or_description,
    date: record.approximate_date,
    objectType: "Capsule Monsters development artifact",
    era: "Capsule Monsters",
    creator: record.creator_or_originator,
    originalObject: record.historical_object,
    imageSource: record.current_image_source,
    digitalSource: image?.current_digital_source || record.current_image_source,
    provenance: record.publication_or_disclosure_history,
    rightsStatus: image?.rights_status || record.rights_or_display_note,
    verificationStatus: record.confidence,
    historicalContext: record.what_it_tells_us,
    unresolvedQuestions: image?.verification_note || "No separate unresolved-question note recorded.",
    sourceReferences: record.artifact_id === "PA-CM-001" ? ["PA-SRC-0001", "PA-SRC-0002"] : ["PA-SRC-0002"],
    acquisitionStatus: "Not recorded",
  };
});

const acquisitionTargets = parseCsv(acquisitionCsv).map((record) => ({
  ...record,
  planning_status: "Wanted",
  ownership_status: "Not recorded",
  sourcing_status: "Not started",
  notes: "",
}));

const cgcCertificates = parseCsv(cgcCsv).map((record) => ({
  ...record,
  tracked_object: "",
  pocket_archives_status: "Not tracked",
}));

const banner = `// This file is generated from /research. Do not edit by hand.\n// Run: npm run sync:research\n\n`;
const moduleText = `${banner}export const canonicalTimeline = ${JSON.stringify(parseTimeline(dossier), null, 2)} as const;\n\nexport const canonicalSources = ${JSON.stringify(sources, null, 2)} as const;\n\nexport const capsuleMonsterRecords = ${JSON.stringify(capsuleRecords, null, 2)} as const;\n\nexport const acquisitionTargets = ${JSON.stringify(acquisitionTargets, null, 2)} as const;\n\nexport const cgcCertificates = ${JSON.stringify(cgcCertificates, null, 2)} as const;\n`;

await mkdir(resolve(root, "app/archive"), { recursive: true });
await writeFile(output, moduleText, "utf8");
console.log(`Synced ${capsuleRecords.length} Capsule Monsters records, ${sources.length} sources, ${acquisitionTargets.length} acquisition targets, ${cgcCertificates.length} CGC certificates, and ${parseTimeline(dossier).length} timeline events.`);
