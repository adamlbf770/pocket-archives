export type RightsStatus = "display-only" | "download-allowed" | "thumbnail-only" | "restricted" | "unknown";

export type ArchiveProvenance = {
  originalSource: string;
  digitalSource: string;
  creator: string;
  studio: string;
  publication: string;
  approximateDate: string;
  sourceURL: string | null;
  archiveSource: string;
  rightsHolder: string;
  rightsStatus: RightsStatus;
  usageBasis: string;
  copyrightNotice: string;
  researchNotes: string;
  provenanceNotes: string;
  confidenceLevel: "high" | "medium" | "low" | "under-research";
  sourceVerified: boolean;
  rightsVerified: boolean;
};

export function artworkRights(record: { collection: string; category: string }): ArchiveProvenance {
  return {
    originalSource: `Official Pokémon artwork · ${record.collection}`,
    digitalSource: "Supplied Pocket Archives image collection",
    creator: "Individual illustrator not identified in this file",
    studio: "Game Freak / The Pokémon Company",
    publication: record.collection,
    approximateDate: "See collection label",
    sourceURL: null,
    archiveSource: "Pocket Archives supplied collection",
    rightsHolder: "Respective Pokémon rights holders",
    rightsStatus: "display-only",
    usageBasis: "Archival, historical, and research context",
    copyrightNotice: "Copyright remains with the respective rights holder.",
    researchNotes: "Artist attribution is not inferred from collection naming alone.",
    provenanceNotes: "Original publication details remain under review.",
    confidenceLevel: "under-research",
    sourceVerified: false,
    rightsVerified: false,
  };
}

export function canDownload(record: ArchiveProvenance) {
  return record.rightsStatus === "download-allowed" && record.rightsVerified;
}
