"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  EXTERNAL_SHOP_URL,
  inventoryForMuseum,
  inventoryForPokemon,
  shopObjectUrl,
} from "./shop/catalog";
import { artworkRights, canDownload } from "./archive-rights";
import {
  canonicalSources,
  canonicalTimeline,
  capsuleMonsterRecords,
} from "./archive/canonical-data.generated";

type PokemonArt = {
  id: string;
  title: string;
  dex: number | null;
  generation: number | null;
  category: "generation" | "alternate" | "design";
  collection: string;
  src: string;
};

type PokemonGroup = {
  key: string;
  dex: number | null;
  title: string;
  generation: number;
  representative: PokemonArt;
  items: PokemonArt[];
};

type SketchSelection = {
  group: PokemonGroup;
  index: number;
};

type PokemonDetails = {
  genus: string;
  description: string;
  types: string[];
  height: number;
  weight: number;
  habitat: string | null;
  legendary: boolean;
  mythical: boolean;
};

type TcgCard = {
  id: string;
  name: string;
  artist?: string;
  rarity?: string;
  number: string;
  set: { name: string; series: string; releaseDate: string };
  images: { small: string; large: string };
};

type SetteiGroup = {
  dex: number;
  name: string;
  links: { label: string; url: string }[];
};

type ReferenceSelection = { group: SetteiGroup; index: number };

type DevelopmentItem = {
  id: string;
  year: number;
  dateLabel?: string;
  title: string;
  kind: string;
  src: string;
  credit: string;
  creator?: string;
  illustrator?: string;
  organization?: string;
  originalObject?: string;
  imageSource?: string;
  provenance?: string;
  rightsStatus?: string;
  verificationStatus?: string;
  era?: string;
  recordId?: string;
  unresolvedQuestions?: string;
  sourceReferences?: readonly string[];
  sourceUrl: string;
  sourceLabel: string;
  description: string;
};

function developmentDate(item: DevelopmentItem) {
  return item.dateLabel || String(item.year);
}

function developmentCreator(item: DevelopmentItem) {
  return item.creator || item.credit;
}

function museumDate(item: DevelopmentItem) {
  const date = developmentDate(item);
  if (/unconfirmed|unverified|unknown/i.test(date)) {
    return item.year <= 1995
      ? "Early development · date under study"
      : "Date under study";
  }
  return date.replace("attribution · ", "");
}

function museumObjectType(item: DevelopmentItem) {
  const subject = `${item.title} ${item.kind} ${item.originalObject || ""}`;
  if (/proposal.*cover|booklet cover/i.test(subject)) return "Proposal cover";
  if (/storyboard/i.test(subject)) return "Storyboard";
  if (/sprite/i.test(subject)) return "Game-development sprite";
  if (/map/i.test(subject)) return "World study";
  if (/planning|document|proposal|pitch/i.test(subject)) return "Planning study";
  if (/carddass|released cards/i.test(subject))
    return "Released card archive";
  if (/book|published/i.test(subject)) return "Published record";
  return "Development drawing";
}

function museumDescription(item: DevelopmentItem) {
  if (item.sourceReferences?.length) return item.description;
  const subject = `${item.title} ${item.kind}`.toLowerCase();
  if (subject.includes("environment") || subject.includes("town"))
    return "A preserved study of the world surrounding the creatures—terrain, paths, and human spaces taking shape before the released games.";
  if (subject.includes("battle"))
    return "A glimpse of the battle system while its visual language was still being worked out.";
  if (subject.includes("sprite"))
    return "A surviving game-development image from a roster that was still changing. Its exact build context remains under study.";
  if (subject.includes("carddass"))
    return "Released Carddass imagery shows how Pokémon’s visual identity moved from the Game Boy into inexpensive, everyday collecting.";
  if (subject.includes("storyboard") || subject.includes("capture"))
    return "A planning image showing how the act of catching a Pokémon was translated into movement, timing, and screen language.";
  return "A surviving glimpse of Pokémon in formation. It is displayed for what it reveals visually while its exact context remains under study.";
}

function museumStatus(status?: string) {
  if (!status) return "Research pending";
  return status.toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

type ArchivePanel = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  details: string[];
  source: string;
};

type MuseumRoom = {
  id: string;
  year: string;
  title: string;
  subtitle: string;
  image: string;
  caption: string;
  body: string;
  highlights: string[];
  source: string;
  sourceUrl: string;
};

type SpriteEra = {
  key: string;
  label: string;
  year: number;
  generation: number;
  medium?: string;
  sprites: Record<string, string>;
};

type SpriteEvolutionManifest = {
  source: {
    title: string;
    curator: string;
    community: string;
    driveUrl: string;
  };
  eras: SpriteEra[];
};

const KANTO_POKEDEX_NAMES = [
  "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard",
  "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree",
  "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot",
  "Rattata", "Raticate", "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu",
  "Raichu", "Sandshrew", "Sandslash", "Nidoran♀", "Nidorina", "Nidoqueen",
  "Nidoran♂", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix",
  "Ninetales", "Jigglypuff", "Wigglytuff", "Zubat", "Golbat", "Oddish",
  "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", "Diglett",
  "Dugtrio", "Meowth", "Persian", "Psyduck", "Golduck", "Mankey", "Primeape",
  "Growlithe", "Arcanine", "Poliwag", "Poliwhirl", "Poliwrath", "Abra",
  "Kadabra", "Alakazam", "Machop", "Machoke", "Machamp", "Bellsprout",
  "Weepinbell", "Victreebel", "Tentacool", "Tentacruel", "Geodude", "Graveler",
  "Golem", "Ponyta", "Rapidash", "Slowpoke", "Slowbro", "Magnemite",
  "Magneton", "Farfetch'd", "Doduo", "Dodrio", "Seel", "Dewgong", "Grimer",
  "Muk", "Shellder", "Cloyster", "Gastly", "Haunter", "Gengar", "Onix",
  "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb", "Electrode", "Exeggcute",
  "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung",
  "Koffing", "Weezing", "Rhyhorn", "Rhydon", "Chansey", "Tangela", "Kangaskhan",
  "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu", "Starmie", "Mr. Mime",
  "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir", "Tauros", "Magikarp",
  "Gyarados", "Lapras", "Ditto", "Eevee", "Vaporeon", "Jolteon", "Flareon",
  "Porygon", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax",
  "Articuno", "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo",
  "Mew",
] as const;

const coreDevelopmentArchive: DevelopmentItem[] = [
  {
    id: "capumon-map",
    year: 1990,
    dateLabel: "1990",
    title: "Capsule Monsters Kanto Layout Map",
    kind: "Pitch document map",
    src: "https://helixchamber.com/wp-content/uploads/2018/09/1990_Capsule_Monsters_00_map_reg.png",
    credit: "Satoshi Tajiri / Ken Sugimori / Game Freak",
    creator: "Satoshi Tajiri — concept and planning",
    illustrator: "Ken Sugimori — pitch-document illustration",
    organization: "Game Freak",
    originalObject: "1990 Capsule Monsters pitch document",
    imageSource: "Helix Chamber enhanced archival scan",
    provenance: "The pitch cover and Kanto layout map are dated 1990; Helix Chamber re-scanned and enhanced publicly revealed source material.",
    rightsStatus: "Unverified / research required",
    verificationStatus: "VERIFIED",
    era: "Capsule Monsters pitch",
    recordId: "PA-EARLY-0001",
    sourceUrl: "https://helixchamber.com/2018/09/10/pack-monsters-world/",
    sourceLabel: "Helix Chamber research archive",
    description:
      "A dated layout map from the Capsule Monsters pitch, showing an early Kanto plan before the final town and route structure.",
  },
  {
    id: "capumon-catalog",
    year: 1990,
    dateLabel: "1990 source material · 2019 reconstruction",
    title: "Capsule Monsters Creature Studies",
    kind: "Research reconstruction",
    src: "https://helixchamber.com/wp-content/uploads/2018/12/CAPUMON_SPRITESHEET2_final.png",
    credit: "Game Freak source material",
    creator: "Game Freak — original game-development material",
    illustrator: "Ken Sugimori — pitch illustrations; individual sprite artists unverified",
    organization: "Game Freak",
    originalObject: "Sprite studies printed in the 1990 Capsule Monsters pitch",
    imageSource: "Helix Chamber archival reconstruction",
    provenance: "Helix Chamber assembled this research image from sprite sheets documented in the dated Capsule Monsters pitch; it is not an original 1990 presentation sheet in this assembled form.",
    rightsStatus: "Unverified / research required",
    verificationStatus: "PROVISIONALLY VERIFIED",
    era: "Capsule Monsters pitch / later reconstruction",
    recordId: "PA-EARLY-0002",
    sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/",
    sourceLabel: "Helix Chamber prototype archive",
    description:
      "A modern research assembly of early creature and sprite evidence associated with the 1990 pitch.",
  },
  {
    id: "capumon-sprites",
    year: 1990,
    dateLabel: "1990",
    title: "Early Creature Sprite Studies",
    kind: "Pitch-document sprite study",
    src: "https://helixchamber.com/wp-content/uploads/2018/08/Capumon_sprites_clean_xsmall_propo-250x300.jpg",
    credit: "Game Freak source material",
    creator: "Game Freak — original game-development material",
    illustrator: "Individual sprite artists unverified",
    organization: "Game Freak",
    originalObject: "Sprite sheets printed in the 1990 Capsule Monsters pitch",
    imageSource: "Helix Chamber re-scan and enhancement",
    provenance: "Helix Chamber identifies these sprite sheets as pages printed in the 1990 pitch; the displayed image is a later digital preservation copy.",
    rightsStatus: "Unverified / research required",
    verificationStatus: "VERIFIED",
    era: "Capsule Monsters pitch",
    recordId: "PA-EARLY-0003",
    sourceUrl: "https://helixchamber.com/2018/08/11/index-list/",
    sourceLabel: "Helix Chamber research archive",
    description:
      "Early sprite studies from the pitch, including creatures that changed substantially or did not survive into the released games.",
  },
  {
    id: "early-kanto-1",
    year: 2019,
    dateLabel: "2019 reconstruction · underlying date unverified",
    title: "Early Kanto Prototype Index",
    kind: "Research reconstruction",
    src: "https://helixchamber.com/wp-content/uploads/2019/02/early_kanto.png",
    credit: "Helix Chamber research presentation",
    creator: "Helix Chamber — research reconstruction",
    illustrator: "Original individual artists unverified",
    organization: "Original assets attributed to Game Freak",
    originalObject: "2019 research plate assembled from early prototype evidence",
    imageSource: "Helix Chamber",
    provenance: "A Helix Chamber research plate, not a single historical Game Freak document. The underlying assets relate to pre-release Red/Green development, but item-level dates remain uncertain.",
    rightsStatus: "Unverified / research required",
    verificationStatus: "PROVISIONALLY VERIFIED",
    era: "Red/Green prototype research",
    recordId: "PA-EARLY-0004",
    sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/",
    sourceLabel: "Helix Chamber prototype archive",
    description:
      "A research index of documented prototype assets and surviving back sprites; it should not be read as a contemporaneous Game Freak plate.",
  },
  {
    id: "early-kanto-2",
    year: 2019,
    dateLabel: "2019 reconstruction · underlying date unverified",
    title: "Early Kanto Prototype Index — Additional Material",
    kind: "Research reconstruction",
    src: "https://helixchamber.com/wp-content/uploads/2019/02/early_kanto_2.png",
    credit: "Helix Chamber research presentation",
    creator: "Helix Chamber — research reconstruction",
    illustrator: "Original individual artists unverified",
    organization: "Original assets attributed to Game Freak",
    originalObject: "2019 research plate assembled from early prototype evidence",
    imageSource: "Helix Chamber",
    provenance: "A second Helix Chamber research plate assembled from prototype evidence; underlying dates and individual credits are not established at item level.",
    rightsStatus: "Unverified / research required",
    verificationStatus: "PROVISIONALLY VERIFIED",
    era: "Red/Green prototype research",
    recordId: "PA-EARLY-0005",
    sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/",
    sourceLabel: "Helix Chamber prototype archive",
    description:
      "An additional research index of cut and revised creature designs from the long Red/Green development period.",
  },
  {
    id: "prototype-periods",
    year: 2019,
    dateLabel: "2019",
    title: "Red & Green development timeline",
    kind: "Research chronology",
    src: "https://helixchamber.com/wp-content/uploads/2019/02/periodization201902.png",
    credit: "Helix Chamber research presentation",
    creator: "Helix Chamber — research chronology",
    illustrator: "Not applicable",
    organization: "Helix Chamber",
    originalObject: "Modern research chronology of early Pokémon development",
    imageSource: "Helix Chamber",
    provenance: "Published by Helix Chamber in 2019 to distinguish proposed periods within the surviving Red/Green evidence; the chronology is an interpretation, not a Game Freak periodization.",
    rightsStatus: "Unverified / research required",
    verificationStatus: "VERIFIED",
    era: "Modern archival research",
    recordId: "PA-EARLY-0006",
    sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/",
    sourceLabel: "Helix Chamber prototype archive",
    description:
      "A visual chronology used to distinguish different periods of the long Red/Green development process.",
  },
  {
    id: "map-comparison",
    year: 2019,
    dateLabel: "2019",
    title: "Early map document comparison",
    kind: "Research comparison",
    src: "https://helixchamber.com/wp-content/uploads/2019/02/MapPageCompare.png",
    credit: "Helix Chamber research presentation",
    creator: "Helix Chamber — research comparison",
    illustrator: "Original individual artists unverified",
    organization: "Underlying material attributed to Game Freak",
    originalObject: "Modern comparison plate using early map documents",
    imageSource: "Helix Chamber",
    provenance: "A modern comparison assembled by Helix Chamber from surviving planning images; it is not a contemporaneous Game Freak document in this layout.",
    rightsStatus: "Unverified / research required",
    verificationStatus: "VERIFIED",
    era: "Modern archival research",
    recordId: "PA-EARLY-0007",
    sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/",
    sourceLabel: "Helix Chamber prototype archive",
    description:
      "A comparison of surviving early planning material used to establish the order of Red/Green development assets.",
  },
  {
    id: "zukan-comparison",
    year: 2019,
    dateLabel: "2019",
    title: "Early monster index comparison",
    kind: "Research comparison",
    src: "https://helixchamber.com/wp-content/uploads/2019/02/ZukanCompare.png",
    credit: "Helix Chamber research presentation",
    creator: "Helix Chamber — research comparison",
    illustrator: "Original individual artists unverified",
    organization: "Underlying material attributed to Game Freak",
    originalObject: "Modern comparison plate using prototype monster-index evidence",
    imageSource: "Helix Chamber",
    provenance: "A modern comparison assembled by Helix Chamber. It preserves evidence about early internal ordering without asserting that the layout itself is historical.",
    rightsStatus: "Unverified / research required",
    verificationStatus: "VERIFIED",
    era: "Modern archival research",
    recordId: "PA-EARLY-0008",
    sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/",
    sourceLabel: "Helix Chamber prototype archive",
    description:
      "A comparison plate connecting prototype monster-index evidence with later documented material.",
  },
];

const canonicalSourceById = new Map(
  canonicalSources.map((source) => [source.source_id, source]),
);

const canonicalCapsuleArchive: DevelopmentItem[] = capsuleMonsterRecords.map(
  (record) => {
    const strongestSource = canonicalSourceById.get(record.sourceReferences[0]);
    return {
      id: record.recordId.toLowerCase(),
      recordId: record.recordId,
      year: Number(record.date.match(/\d{4}/)?.[0] || 1990),
      dateLabel: record.date,
      title: record.title,
      kind: record.objectType,
      src: record.imageSource,
      credit: record.creator,
      creator: record.creator,
      organization: "Game Freak",
      originalObject: record.originalObject,
      imageSource: record.digitalSource,
      provenance: record.provenance,
      rightsStatus: record.rightsStatus,
      verificationStatus: record.verificationStatus,
      unresolvedQuestions: record.unresolvedQuestions,
      era: record.era,
      sourceReferences: record.sourceReferences,
      sourceUrl:
        strongestSource?.url_or_location || record.digitalSource,
      sourceLabel: strongestSource?.title || "Canonical research register",
      description: record.historicalContext,
    };
  },
);

const redditConceptFiles = [
  {
    file: "3BIfe.jpg",
    year: 1990,
    dateLabel: "1990 attribution · scan context unconfirmed",
    title: "Landscape Study",
    kind: "Development-art reproduction",
    creator: "Game Freak",
    illustrator: "Ken Sugimori — probable",
    originalObject: "Capsule Monsters pitch/development material, reproduced in a later publication",
    provenance: "The image is consistent with material reproduced alongside the 1990 pitch, but the community album does not identify the exact page or first publication.",
    verificationStatus: "PROVISIONALLY VERIFIED" as const,
    era: "Capsule Monsters / early development",
  },
  {
    file: "uJZYG.jpg",
    year: 1990,
    dateLabel: "1990 attribution · scan context unconfirmed",
    title: "Planning the World",
    kind: "Development-document reproduction",
    creator: "Game Freak",
    illustrator: "Ken Sugimori — probable for illustrated scene",
    originalObject: "Early Capsule Monsters planning material, reproduced in a later publication",
    provenance: "A photographed book spread combining an environment drawing and planning forms. The underlying material is associated with Capsule Monsters, but exact page-level provenance remains incomplete.",
    verificationStatus: "PROVISIONALLY VERIFIED" as const,
    era: "Capsule Monsters / early development",
  },
  {
    file: "eVFiz.jpg",
    year: 2004,
    dateLabel: "2004 · reproducing earlier material",
    title: "Book Documentation: Capsule Monsters",
    kind: "Published book page",
    creator: "Shōtarō Miyā and Satoshi Tajiri — authors",
    illustrator: "Underlying Capsule Monsters artwork: Ken Sugimori",
    originalObject: "Page from 田尻智 ポケモンを創った男 (Ohta Publishing, 2004)",
    provenance: "The National Diet Library verifies the book's title, authors, publisher, and March 2004 publication. The displayed image is a community photograph of a page reproducing earlier material.",
    verificationStatus: "VERIFIED" as const,
    era: "Published historical documentation",
  },
  {
    file: "mPddl.jpg",
    year: 1994,
    dateLabel: "Early Pocket Monsters development · date unverified",
    title: "Early Creature and Battle Studies",
    kind: "Development-art reproduction",
    creator: "Game Freak development material",
    illustrator: "Individual artist unverified",
    originalObject: "Early creature and battle drawings reproduced in a later publication",
    provenance: "The community photograph supplies no item-level date or credit. The work must not be assigned to 1990 without a documented link to the Capsule Monsters pitch.",
    verificationStatus: "ATTRIBUTION UNVERIFIED" as const,
    era: "Early Pocket Monsters development",
  },
  {
    file: "Cz0dP.jpg",
    year: 1993,
    dateLabel: "c. 1993",
    title: "Pokémon Capture Storyboard — Planning Forms",
    kind: "Development storyboard reproduction",
    creator: "Game Freak",
    illustrator: "Ken Sugimori — probable",
    originalObject: "Early capture-animation storyboard and planning forms",
    provenance: "Helix Chamber dates the related capture storyboard to circa 1993 and describes Sugimori's authorship as probable. This community photograph appears to reproduce that development sequence.",
    verificationStatus: "PROVISIONALLY VERIFIED" as const,
    era: "Early Pocket Monsters development",
  },
  {
    file: "QcPUq.jpg",
    year: 1993,
    dateLabel: "c. 1993",
    title: "Pokémon Capture Storyboard",
    kind: "Development storyboard reproduction",
    creator: "Game Freak",
    illustrator: "Ken Sugimori — probable",
    originalObject: "Storyboard depicting the animation for catching a Pokémon",
    provenance: "Helix Chamber dates the storyboard to circa 1993 and attributes the drawing probably to Ken Sugimori; the typed captions belong to the later book reproduction, not the original sheet.",
    verificationStatus: "PROVISIONALLY VERIFIED" as const,
    era: "Early Pocket Monsters development",
  },
  {
    file: "ZAQnI.jpg",
    year: 1994,
    dateLabel: "Early Pocket Monsters development · date unverified",
    title: "Town and Environment Studies",
    kind: "Development-art reproduction",
    creator: "Game Freak development material",
    illustrator: "Individual artist unverified",
    originalObject: "Early town and environment drawings reproduced in a later publication",
    provenance: "No reliable item-level date was located. The image is retained as early development material without assigning it to the 1990 pitch.",
    verificationStatus: "ATTRIBUTION UNVERIFIED" as const,
    era: "Early Pocket Monsters development",
  },
  {
    file: "ta7Ec.jpg",
    year: 1994,
    dateLabel: "Early Pocket Monsters development · date unverified",
    title: "Shop and Field Scene Studies",
    kind: "Development-art reproduction",
    creator: "Game Freak development material",
    illustrator: "Individual artist unverified",
    originalObject: "Early environment and interaction studies reproduced in a later publication",
    provenance: "The community album does not establish a precise date, original sheet title, or individual artist.",
    verificationStatus: "ATTRIBUTION UNVERIFIED" as const,
    era: "Early Pocket Monsters development",
  },
  {
    file: "7xVCR.jpg",
    year: 1995,
    dateLabel: "Pre-release or release era · date unverified",
    title: "Published Pokémon Promotional Comic",
    kind: "Promotional print reproduction",
    creator: "Publisher and artist unverified",
    illustrator: "Individual artist unverified",
    originalObject: "Printed promotional comic or advertisement",
    provenance: "The image is demonstrably printed promotional material, but its publication title, issue, and date are not supplied by the community album.",
    verificationStatus: "RESEARCH PENDING" as const,
    era: "Early Pocket Monsters publicity",
  },
  {
    file: "rZ8VJ.jpg",
    year: 1995,
    dateLabel: "Early Pocket Monsters era · exact date unknown",
    title: "Pijotto vs. Lizardon",
    kind: "Published illustration reproduction",
    creator: "Game Freak / publication source unverified",
    illustrator: "Ken Sugimori — attributed",
    originalObject: "Printed Pocket Monsters battle illustration",
    provenance: "The printed image carries the Pijotto vs. Lizardon title, but the community copy does not establish its first publication or exact date. It is not labeled as Capsule Monsters material.",
    verificationStatus: "ATTRIBUTION UNVERIFIED" as const,
    era: "Early Pocket Monsters era",
  },
  {
    file: "0eXLv.jpg",
    year: 1995,
    dateLabel: "Early Pocket Monsters era · exact date unknown",
    title: "Trainer and Pokémon Ensemble",
    kind: "Published illustration reproduction",
    creator: "Game Freak",
    illustrator: "Ken Sugimori — attributed",
    originalObject: "Finished Pocket Monsters-era character illustration",
    provenance: "The image shows developed Red, Green, Pikachu, and Charizard designs and therefore postdates the earliest Capsule Monsters material. Its exact publication remains unverified.",
    verificationStatus: "ATTRIBUTION UNVERIFIED" as const,
    era: "Early Pocket Monsters era",
  },
  {
    file: "mr195.jpg",
    year: 1994,
    dateLabel: "Early development · date unverified",
    title: "Prototype Battle Interface Study",
    kind: "Development interface reproduction",
    creator: "Game Freak",
    illustrator: "Individual artist unverified",
    originalObject: "Prototype battle-interface drawing",
    provenance: "The source album provides no reliable date or artist. The image is preserved without the former unsupported 1990 attribution.",
    verificationStatus: "RESEARCH PENDING" as const,
    era: "Early Pocket Monsters development",
  },
  {
    file: "PVlMl.jpg",
    year: 1994,
    dateLabel: "Early development · date unverified",
    title: "Prototype Battle Status Study",
    kind: "Development interface reproduction",
    creator: "Game Freak",
    illustrator: "Individual artist unverified",
    originalObject: "Prototype battle-status drawing",
    provenance: "The source album provides no reliable date or artist. The image is preserved without the former unsupported 1990 attribution.",
    verificationStatus: "RESEARCH PENDING" as const,
    era: "Early Pocket Monsters development",
  },
  {
    file: "LroBZ.jpg",
    year: 1990,
    dateLabel: "1990",
    title: "Capsule Monsters Pitch — Title and Kanto Map",
    kind: "Pitch-document reproduction",
    creator: "Satoshi Tajiri — concept and planning",
    illustrator: "Ken Sugimori — pitch-document illustration",
    originalObject: "1990 Capsule Monsters pitch document",
    provenance: "The displayed photograph shows the Capsule Monsters title and dated Kanto planning material reproduced in a later publication.",
    verificationStatus: "VERIFIED" as const,
    era: "Capsule Monsters pitch",
  },
  {
    file: "8WJLE.jpg",
    year: 2004,
    dateLabel: "2004",
    title: "田尻智 ポケモンを創った男 — Book Cover",
    kind: "Published book",
    creator: "Shōtarō Miyā and Satoshi Tajiri — authors",
    illustrator: "Cover art credit unverified",
    originalObject: "田尻智 ポケモンを創った男, Ohta Publishing, March 2004",
    provenance: "Bibliographic details are verified by the National Diet Library; the displayed image is a community-preserved photograph of the book cover.",
    verificationStatus: "VERIFIED" as const,
    era: "Published historical documentation",
  },
] as const;

const redditPrototypeFiles = [
  "yBqcU.png",
  "LgBLU.png",
  "5v9fA.png",
  "ZUVJ3.png",
  "cvxfT.png",
  "ILMPd.png",
  "2ySLi.png",
  "ScUVE.png",
  "foAmN.png",
  "qeJxV.jpg",
  "bXT63.jpg",
  "OymIn.png",
  "iC9tj.png",
  "cJ8Q3.png",
] as const;
const redditSpriteFiles = [
  "ckCvm.png",
  "VIZ5p.png",
  "oHFn6.png",
  "2xV1F.png",
  "exbEq.png",
  "v0x9S.png",
] as const;
const carddassArchiveFiles = [
  "H5fmv.jpg",
  "gsD2M.jpg",
  "F5o5r.jpg",
  "uvGv5.jpg",
  "KSh4s.jpg",
  "HlIEJ.jpg",
  "spml0.jpg",
  "i82hd.jpg",
  "8oC4o.jpg",
  "yi13Z.jpg",
  "LiYLv.jpg",
  "q7BfC.jpg",
  "ZXovn.jpg",
  "sathh.jpg",
  "WUH15.jpg",
  "RPDkl.jpg",
  "xsyN9.jpg",
] as const;

const prototypeTitles = [
  "Unidentified Aquatic Creature Study",
  "Early Pikachu Color Study",
  "Unidentified Shelled Creature Study",
  "Published Prototype-Art Feature",
  "Unidentified Creature Color Study",
  "Published Development-Art Feature",
  "Unidentified Pink Creature Study",
  "Unidentified Giraffe-Like Creature Study",
  "Unidentified Aquatic Creature Study",
  "Exhibition Display: Early Pokémon Drawings",
  "Latias Development Drawing Photograph",
  "Published Prototype-Art Feature",
  "Development Sketch Photograph",
  "Early Trainer and Pokémon Ensemble",
] as const;

const redditDevelopmentArchive: DevelopmentItem[] = [
  ...redditConceptFiles.map((item, index) => ({
    id: `reddit-concept-${index + 1}`,
    year: item.year,
    dateLabel: item.dateLabel,
    title: item.title,
    kind: item.kind,
    src: `https://i.imgur.com/${item.file}`,
    credit: item.creator,
    creator: item.creator,
    illustrator: item.illustrator,
    organization: item.year === 2004 ? "Ohta Publishing" : "Game Freak",
    originalObject: item.originalObject,
    imageSource:
      "Community-preserved photograph in the Imgur album linked by the Reddit thread",
    provenance: item.provenance,
    rightsStatus: "Unverified / research required",
    verificationStatus: item.verificationStatus,
    era: item.era,
    recordId: `PA-EARLY-${String(index + 9).padStart(4, "0")}`,
    sourceUrl: "https://imgur.com/a/7HzFR",
    sourceLabel: "Imgur album preserved through the linked Reddit thread",
    description: item.provenance,
  })),
  ...redditPrototypeFiles.map((file, index) => ({
    id: `reddit-prototype-${index + 1}`,
    year: index === 10 ? 2002 : 1995,
    dateLabel:
      index === 10
        ? "Early 2000s · exact date unverified"
        : "Development era · date unverified",
    title: prototypeTitles[index],
    kind: "Development artwork — date unverified",
    src: `https://i.imgur.com/${file}`,
    credit:
      "Game Freak development material / exact individual credit unverified",
    creator: "Game Freak development material — attribution unverified",
    illustrator: "Individual artist unverified",
    organization: "Game Freak — attributed",
    originalObject:
      index === 9
        ? "Exhibition photograph of early Pokémon drawings"
        : "Unidentified development artwork; exact publication and object context unverified",
    imageSource:
      "Community-preserved image in the prototype-art Imgur album",
    provenance:
      "The source album supplies no item-level date, original title, or individual artist credit. Pocket Archives retains the image as research material and assigns only an internal record ID—not a historical plate number.",
    rightsStatus: "Unverified / research required",
    verificationStatus: "ATTRIBUTION UNVERIFIED" as const,
    era: index === 10 ? "Early 2000s development" : "Pokémon development",
    recordId: `PA-EARLY-${String(index + 24).padStart(4, "0")}`,
    sourceUrl: "https://imgur.com/a/GlGrp",
    sourceLabel: "Prototype-art Imgur album linked by the Reddit poster",
    description:
      "A community-preserved development image whose exact date, original title, publication context, and individual artist remain unverified.",
  })),
  ...redditSpriteFiles.map((file, index) => ({
    id: `reddit-beta-sprite-${index + 1}`,
    year: 1995,
    dateLabel: "Development era · exact date unverified",
    title: "Unidentified Beta Sprite",
    kind: "Extracted prototype sprite",
    src: `https://i.imgur.com/${file}`,
    credit: "Game Freak prototype data / individual sprite artist unverified",
    creator: "Game Freak prototype data — attributed",
    illustrator: "Individual sprite artist unverified",
    organization: "Game Freak — attributed",
    originalObject: "Prototype sprite data; exact build and extraction context unverified",
    imageSource: "Community-preserved beta-sprite Imgur album",
    provenance:
      "The linked album preserves an extracted beta sprite but does not provide a documented build date, internal name, or individual sprite artist.",
    rightsStatus: "Unverified / research required",
    verificationStatus: "ATTRIBUTION UNVERIFIED" as const,
    era: "Pokémon development",
    recordId: `PA-EARLY-${String(index + 38).padStart(4, "0")}`,
    sourceUrl: "https://imgur.com/a/Go7E0",
    sourceLabel: "Beta-sprite Imgur album linked by the Reddit poster",
    description:
      "A surviving beta sprite from the linked album. The duplicate Kabuto image shared with the prototype-art album has been included only once.",
  })),
  ...carddassArchiveFiles.map((file, index) => ({
    id: `carddass-action-${index + 1}`,
    year: 1997,
    dateLabel: "1997 · Parts 3 and 4",
    title: "Pocket Monsters Carddass Part 3 & 4 — Grouped Cards",
    kind: "Community photograph of released cards",
    src: `https://i.imgur.com/${file}`,
    credit: "Ken Sugimori / Bandai Carddass",
    creator: "Bandai — publisher and manufacturer",
    illustrator: "Ken Sugimori — set-level attribution",
    organization: "Bandai",
    originalObject:
      "Pocket Monsters Carddass Part 3 and Part 4 cards (Bandai, 1997)",
    imageSource: "Community-assembled photograph preserved in an Imgur album",
    provenance:
      "Parts 3 and 4 were released in April and June 1997 and together cover the original 151 Pokémon. This image is a later community grouping of released cards, not a historical production sheet.",
    rightsStatus: "Unverified / research required",
    verificationStatus: "PROVISIONALLY VERIFIED" as const,
    era: "Release-era licensed material",
    recordId: `PA-EARLY-${String(index + 44).padStart(4, "0")}`,
    sourceUrl: "https://imgur.com/a/HOPoK",
    sourceLabel:
      "151-Pokémon action-art Imgur album linked through the Reddit discussion",
    description:
      "A community photograph grouping released 1997 Bandai Carddass cards. It documents licensed Sugimori artwork, but the grouping itself is modern rather than a historical archive sheet.",
  })),
];

const developmentArchive: DevelopmentItem[] = [
  ...canonicalCapsuleArchive,
  ...coreDevelopmentArchive.filter((item) => !item.id.startsWith("capumon")),
  ...redditDevelopmentArchive,
].sort((a, b) => a.year - b.year);

const referenceResources = [
  {
    title: "Pokémon settei directory",
    eyebrow: "402 Pokémon",
    description:
      "The complete PS Art Room index of official production model sheets, expressions, poses, movement cycles, and alternate forms.",
    url: "https://psartroom.weebly.com/setteis.html",
    keywords:
      "pokemon settei model sheets sketches poses expressions walk run cycles",
  },
  {
    title: "General references",
    eyebrow: "Poses & motion",
    description:
      "Human pose tools, animal movement studies, drawing references, and file-format guidance collected for artists.",
    url: "https://psartroom.weebly.com/references.html",
    keywords:
      "references posemaniacs animals bat cat deer dog dragon horse wolf motion",
  },
  {
    title: "Color tools",
    eyebrow: "Palette lab",
    description:
      "A compact collection of palette, contrast, color-scheme, and accessibility tools for building stronger artwork.",
    url: "https://psartroom.weebly.com/color-tools.html",
    keywords: "color palette contrast scheme tools",
  },
  {
    title: "Digital art tutorials",
    eyebrow: "Technique",
    description:
      "Tutorial links covering digital painting, linework, shading, backgrounds, animation, and workflow.",
    url: "https://psartroom.weebly.com/digital-art-tutorials.html",
    keywords:
      "digital art tutorials painting linework shading background animation",
  },
  {
    title: "Traditional art tutorials",
    eyebrow: "Paper & paint",
    description:
      "Traditional drawing and painting lessons gathered by the PS Art Room community.",
    url: "https://psartroom.weebly.com/art-tutorials.html",
    keywords: "traditional art tutorials drawing painting paper",
  },
  {
    title: "Art programs",
    eyebrow: "Creative tools",
    description:
      "A guide to free and paid programs for illustration, animation, pixel art, and image editing.",
    url: "https://psartroom.weebly.com/art-programs.html",
    keywords: "art programs software illustration animation pixel editing",
  },
];

const helixResearchPanels: ArchivePanel[] = [
  {
    id: "helix-evidence",
    eyebrow: "How to read the archive",
    title: "What actually survived?",
    description:
      "The 2019 Helix Chamber analysis worked from a limited package of prototype assets rather than a playable development ROM.",
    details: [
      "Most cut Pokémon survived only as back sprites, so their fronts and exact inspirations cannot always be reconstructed with certainty.",
      "Names, cries, internal index positions, evolution tables, movesets, manga material, and broadcast footage can corroborate an identity—but they do not all come from the same development moment.",
      "Pocket Archives keeps extracted material, documented drawings, research diagrams, and fan interpretation in separate categories.",
    ],
    source: "Paraphrased from Helix Chamber, “What Dreams May Come” (2019).",
  },
  {
    id: "helix-missingno",
    eyebrow: "Prototype evidence",
    title: "The MissingNo. slots",
    description:
      "Some MissingNo. positions appear to be the remains of creatures deleted or overwritten during Red and Green’s long development.",
    details: [
      "The recovered material helped identify many cut creatures, while three slots remained unidentified in the article’s accounting.",
      "Recognizable examples include Gyaoon, the deer-like design, Crocky, a cactus creature, a Zubat pre-evolution, and several unfinished evolutionary families.",
      "A back sprite is evidence of a design’s presence, but not necessarily proof of its final name, type, front view, or relationship to later Pokémon.",
    ],
    source:
      "Helix Chamber prototype-data analysis; identities and relationships remain theories where the source evidence is incomplete.",
  },
  {
    id: "helix-evolutions",
    eyebrow: "Cut family trees",
    title: "Evolution lines changed constantly",
    description:
      "The prototype tables reveal a much less settled set of evolutionary families than the final 151 suggest.",
    details: [
      "Evidence points to Gorochu after Raichu, a distinct final evolution for Wartortle, and a middle evolution between Psyduck and Golduck.",
      "Early pre-evolutions appear for Meowth, Vulpix, Zubat, and other species; Kotora’s line seems to have once contained three stages.",
      "Some families were cut for reasons the files do not state. Balance, redundancy, schedule, and redesign are possibilities—not confirmed explanations.",
    ],
    source:
      "Summary of the evolution tables and sprite discussion documented by Helix Chamber.",
  },
  {
    id: "helix-trainers",
    eyebrow: "People of early Kanto",
    title: "Trainers and NPCs",
    description:
      "The files also preserve an alternate human cast, internally associated with the term “dealers,” plus rougher forms of familiar characters.",
    details: [
      "An early protagonist called Yuuichi, a cartoony Red back sprite, and a rough female Student design show how the player-facing art evolved.",
      "Cut classes include the robot-like Shinjuku Jack, a Firefighter, and a Silph Chief whose planned story role is unknown.",
      "Early Gym figures such as Yujirou and Ichitarou suggest the order and identity of Kanto’s leaders changed substantially.",
    ],
    source:
      "Paraphrased from Helix Chamber’s trainer and overworld-NPC sections.",
  },
  {
    id: "helix-cries",
    eyebrow: "Sound archaeology",
    title: "Cries began with kaiju",
    description:
      "An early cry list suggests that Pokémon’s sound system was deeply shaped by the distinctive monster roars of Japanese kaiju media.",
    details: [
      "Several early cry labels echo Ultraman creatures, while later entries use early Pokémon names such as Gagarth for Rhydon and Wing for Arcanine.",
      "The list’s order differs from the final game and may reflect when sounds were created rather than the final internal Pokédex sequence.",
      "Shared and reassigned cries can help connect deleted slots to surviving species, but they rarely establish an identity on their own.",
    ],
    source: "Summary of Helix Chamber’s alternate cry-list analysis.",
  },
  {
    id: "helix-moves",
    eyebrow: "Rules before release",
    title: "Moves and evolution worked differently",
    description:
      "Multiple prototype tables preserve an oversized and shifting battle system before it was reduced for release.",
    details: [
      "The unfinished learnset data reaches move number 237, compared with 165 moves in the final Generation I games.",
      "Early names include Hydro Jet, Star Freeze, Mega Fire, and concepts later reused under different names.",
      "The surviving table is heavily level-based. Helix Chamber inferred that evolution may once have been mandatory because many species learned nothing after their evolution level.",
    ],
    source:
      "Paraphrased from the move-name, effect, evolution, and moveset tables discussed by Helix Chamber.",
  },
  {
    id: "helix-maps",
    eyebrow: "Building Kanto",
    title: "The map grew from an RPG skeleton",
    description:
      "Prototype maps show Kanto developing from sparse, traditional RPG layouts into the recognizable cities of the final games.",
    details: [
      "Early route numbers were literally placed in terrain as templates, while towns had few distinguishing landmarks.",
      "Later maps used placeholders for major buildings, including crude stand-ins for Silph Co. and the Celadon Department Store.",
      "The article reports donor testimony that Silph Co. once hosted a larger Pokémon League concept before the idea moved to Indigo Plateau; Pocket Archives treats that claim as reported context, not settled proof.",
    ],
    source: "Summary of the map section in Helix Chamber’s 2019 article.",
  },
];

const internalListPanels: ArchivePanel[] = [
  {
    id: "period-1",
    eyebrow: "Period 1 · Earliest designs",
    title: "The original Capumon",
    description:
      "The first cluster centers on kaiju-like creatures, dinosaurian bodies, childhood heroes, and familiar role-playing-game archetypes.",
    details: [
      "Rhydon’s internal ID of 001 reflects its place as the earliest confirmed Pokémon design.",
      "These monsters established the franchise’s initial scale: powerful creatures controlled by people through capsule-like objects.",
      "The early visual vocabulary leaned more toward monsters and kaiju than the balanced ecosystem of the final games.",
    ],
    source: "Helix Chamber’s internal-list periodization · Period 1",
  },
  {
    id: "period-2",
    eyebrow: "Period 2 · Building a battle system",
    title: "Types and real animals",
    description:
      "As additional designers joined, the roster expanded into elemental types and creatures inspired more directly by real-world animals.",
    details: [
      "This period appears to test whether the battle system could support a diverse type ecosystem.",
      "Design batches contain patterns that help researchers estimate where missing creatures may once have appeared.",
      "Pattern recognition is evidence for a hypothesis—not definitive identification of every MissingNo. slot.",
    ],
    source: "Helix Chamber’s internal-list periodization · Period 2",
  },
  {
    id: "period-3",
    eyebrow: "Period 3 · A broader emotional range",
    title: "Cute Pokémon and evolution",
    description:
      "Atsuko Nishida’s arrival coincides with a stronger emphasis on cute designs and a major expansion of evolutionary structure.",
    details: [
      "Two- and three-stage families became a more important organizing idea.",
      "Stone evolutions, split evolution concepts, and additional elemental creatures widened the system.",
      "Pokémon’s identity was shifting from a kaiju roster toward a world with varied personalities and relationships.",
    ],
    source: "Helix Chamber’s internal-list periodization · Period 3",
  },
  {
    id: "period-4",
    eyebrow: "Period 4 · Connecting the roster",
    title: "New evolutionary relatives",
    description:
      "This period added relatives to creatures designed earlier, reshaping isolated monsters into more coherent families.",
    details: [
      "Pre-evolutions, middle stages, and final evolutions could be introduced long after a base design.",
      "Some of these relationships were removed before release; others may have influenced later generations.",
      "Internal order therefore records creative sequence more clearly than the final National Pokédex order.",
    ],
    source: "Helix Chamber’s internal-list periodization · Period 4",
  },
  {
    id: "period-5",
    eyebrow: "Period 5 · Toward the final game",
    title: "The eclectic final wave",
    description:
      "The last broad group is the most varied, combining ordinary two-stage families, stone evolutions, unusual one-offs, and finally the starters.",
    details: [
      "Bulbasaur, Charmander, and Squirtle arrived surprisingly late in the internal sequence.",
      "Late additions helped balance types and shape the opening experience players would actually encounter.",
      "The roster was still being edited until close to debugging, leaving 39 unused slots among the 190 internal positions.",
    ],
    source: "Helix Chamber’s internal-list periodization · Period 5",
  },
];

const museumReadingSequence = [...internalListPanels, ...helixResearchPanels];

const museumRooms: MuseumRoom[] = [
  {
    id: "roots",
    year: "1965–1989",
    title: "Before the monsters",
    subtitle: "Tajiri, Sugimori, and Game Freak",
    image: "/art/0658.webp",
    caption: "Rhydon · one of the earliest confirmed Pokémon designs",
    body: "Pokémon began with Satoshi Tajiri’s fascination with collecting living things and the culture of Japanese arcades. His handmade Game Freak strategy zine brought him together with illustrator Ken Sugimori; by 1989, Game Freak had become a development studio.",
    highlights: [
      "Tajiri explored fields and ponds in a still-rural Machida.",
      "Game Freak began as a self-published arcade fanzine, usually dated to 1983.",
      "The franchise grew from a team and a working culture—not a single isolated flash of inspiration.",
    ],
    source: "TIME · The History and Origins of Pokémon",
    sourceUrl: "https://time.com/6796536/history-origins-pokemon/",
  },
  {
    id: "capsule-monsters",
    year: "1990–1995",
    title: "Six years in development",
    subtitle: "Capsule Monsters and the link cable",
    image:
      "https://helixchamber.com/wp-content/uploads/2018/09/1990_Capsule_Monsters_00_map_reg.png",
    caption: "Capsule Monsters world study",
    body: "The first pitch was called Capsule Monsters. Tajiri imagined the Game Boy link cable as a way to transfer creatures between players. Trading came before much of the role-playing framework; Shigeru Miyamoto’s support and the paired-version idea turned social exchange into the game’s foundation.",
    highlights: [
      "Childhood collecting inspired discovery; the link cable inspired exchange.",
      "Ken Sugimori’s drawings made an abstract system feel like a lived-in world.",
      "Game Freak endured financial and technical strain during the unusually long production.",
    ],
    source: "Nintendo creator interviews · Capsule Monsters research archive",
    sourceUrl: "https://iwataasks.nintendo.com/interviews/ds/pokemon/0/0/",
  },
  {
    id: "red-green",
    year: "1996",
    title: "The breakthrough",
    subtitle: "Red, Green, and the mystery of Mew",
    image: "/art/0697.webp",
    caption: "Mew · the secret that helped Pokémon spread by word of mouth",
    body: "Pocket Monsters Red and Green launched in Japan on February 27, 1996. The first wave was not instant global mania. Mew—quietly left inside the game—became the catalyst when CoroCoro offered it to only 20 readers and tens of thousands applied.",
    highlights: [
      "Scarcity made Mew feel like a playground secret rather than ordinary content.",
      "Rumors and trading kept the games alive after release.",
      "Pokémon’s earliest success came from players explaining the mystery to one another.",
    ],
    source: "Nintendo · Iwata Asks: The Mythical Pokémon Mew",
    sourceUrl: "https://iwataasks.nintendo.com/interviews/ds/pokemon/0/0/",
  },
  {
    id: "media-mix",
    year: "1996–1997",
    title: "A world beyond the cartridge",
    subtitle: "Cards, animation, and a mascot",
    image: "/shop/cards/carddass-pikachu.jpg",
    caption:
      "Pikachu Carddass · physical collecting meets character storytelling",
    body: "The Trading Card Game arrived in Japan in October 1996 and the television anime in April 1997. Cards made collecting tangible; the anime made individual Pokémon emotionally legible. Pikachu’s partnership with Ash transformed one creature into a global symbol.",
    highlights: [
      "Japan’s order was games, then cards, then television.",
      "Each medium added something the Game Boy could not communicate alone.",
      "The 1997 flashing-light broadcast incident led to a hiatus and stricter animation safety practices.",
    ],
    source: "The Pokémon Company · Official history",
    sourceUrl: "https://corporate.pokemon.co.jp/en/aboutus/history/",
  },
  {
    id: "global-pokemania",
    year: "1998–2000",
    title: "Pokémania goes global",
    subtitle: "An anime-first international strategy",
    image: "/art/0571.webp",
    caption: "Pikachu · the emotional doorway to the international launch",
    body: "The American rollout deliberately reversed Japan’s sequence: television arrived before the games, followed by the cards. Children met the characters first, then entered the interactive worlds. Europe and other regions followed, each through its own mix of dubbing, imports, cards, toys, and official releases.",
    highlights: [
      "Red and Blue reached the United States in September 1998.",
      "The US Base Set followed in January 1999; Europe received the games later that year.",
      "Localization reshaped names, jokes, dialogue, cultural references, and sometimes images.",
    ],
    source: "The Pokémon Company · International business history",
    sourceUrl: "https://corporate.pokemon.co.jp/en/business/international",
  },
  {
    id: "lasting-system",
    year: "1999–2009",
    title: "More than a fad",
    subtitle: "Generations, regions, and institutions",
    image: "/shop/cards/squirtle-base.png",
    caption:
      "Base Set Squirtle · the game, card, and animation worlds reinforce one another",
    body: "Gold and Silver proved that Pokémon could renew itself without abandoning its ritual. New regions, breeding, time, online features, remakes, tournaments, and an increasingly organized company structure turned a craze into a durable cultural system.",
    highlights: [
      "Johto, Hoenn, and Sinnoh translated different parts of Japan into fantasy regions.",
      "Pokémon USA opened in 2001, London followed in 2003, and Pokémon Korea in 2006.",
      "Video-game and card competition converged at the World Championships in 2009.",
    ],
    source: "The Pokémon Company · Corporate history",
    sourceUrl: "https://corporate.pokemon.co.jp/en/aboutus/history/",
  },
  {
    id: "worldwide-design",
    year: "2010–2015",
    title: "Worldwide by design",
    subtitle: "Unova, 3D, and simultaneous discovery",
    image: "/art/1235.webp",
    caption: "Zekrom · Generation V moved the regional lens beyond Japan",
    body: "Black and White used New York as the basis for Unova and initially asked players to encounter only unfamiliar Pokémon. X and Y then moved the main series into modeled 3D and became the first core games released around the world at the same time.",
    highlights: [
      "The regions became a global cultural canvas rather than a map of Japan alone.",
      "Worldwide launch timing changed how news, strategy, fan art, and discovery spread.",
      "Pokémon kept the same collecting grammar while changing its geography and visual language.",
    ],
    source: "Nintendo developer interviews · The Pokémon Company history",
    sourceUrl:
      "https://iwataasks.nintendo.com/interviews/ds/pokemon-black-white/0/1/",
  },
  {
    id: "pokemon-go",
    year: "2016",
    title: "The world becomes the map",
    subtitle: "Pokémon GO and the second Pokémania",
    image: "/art/1425.webp",
    caption:
      "Rowlet · Generation VII arrived during Pokémon’s mobile breakthrough",
    body: "Pokémon GO returned the franchise to its earliest promise: walk outside, search for creatures, collect them, and meet other people doing the same thing. It reached $100 million in revenue in roughly 20 days and briefly transformed public parks and streets into shared game spaces.",
    highlights: [
      "The physical world became Pokémon’s newest interface.",
      "Researchers measured short-term increases in outdoor movement, though lasting health effects were mixed.",
      "Sun and Moon used Hawaii and regional forms to make adaptation part of Pokémon design.",
    ],
    source: "Pokémon GO launch record · Guinness World Records",
    sourceUrl:
      "https://www.guinnessworldrecords.com/news/2016/8/pokemon-go-catches-five-new-world-records-439327",
  },
  {
    id: "platform-ecosystem",
    year: "2017–2023",
    title: "From series to ecosystem",
    subtitle: "Switch, HOME, open worlds, and new heroes",
    image: "/art/1723.webp",
    caption: "Sprigatito · a new generation for games and animation",
    body: "The Switch era dissolved the boundary between handheld and console Pokémon. Let’s Go connected with mobile play; HOME preserved collections across games; Legends: Arceus reworked capture and exploration; and Scarlet and Violet made the core journey fully open-world.",
    highlights: [
      "Pokémon became a network of games and services rather than one isolated release at a time.",
      "Dedicated operations expanded across Asia, including India, Singapore, Shanghai, and Taiwan.",
      "In 2023 Liko and Roy inherited the anime from Ash and Pikachu after more than 25 years.",
    ],
    source: "The Pokémon Company · Official history and localization records",
    sourceUrl: "https://corporate.pokemon.co.jp/en/topics/detail/t-42/",
  },
  {
    id: "living-archive",
    year: "2024–2026",
    title: "A living archive",
    subtitle: "Digital cards, physical collecting, and thirty years",
    image: "/shop/binders/mew/ancient-mew.png",
    caption:
      "Ancient Mew · collecting continually turns Pokémon’s past into its present",
    body: "Pokémon’s current era connects physical collecting, TCG Pocket, competitive games, location-based play, animation, live destinations, and historical nostalgia. The past is no longer only remembered—it is continually rescanned, reissued, rediscovered, and reorganized.",
    highlights: [
      "TCG Pocket brought card opening and collecting into a mobile-first format in 2024.",
      "Legends: Z-A followed in 2025; PokéPark KANTO and Pokémon Champions arrived in 2026.",
      "At thirty, Pokémon operates as cultural infrastructure as much as a sequence of products.",
    ],
    source: "Pokémon 30 · Official anniversary record",
    sourceUrl: "https://30.pokemon.com/en-us",
  },
  {
    id: "the-ritual",
    year: "1996–present",
    title: "The ritual that endured",
    subtitle: "Discover, collect, exchange, belong",
    image: "/art/0547.webp",
    caption: "Bulbasaur · one creature, many generations of memory",
    body: "Pokémon survives because it keeps changing the doorway while protecting the same human ritual. The link cable, cards, television, worldwide launches, Pokémon GO, and persistent apps all answer the same desire: find something, care about it, and share that discovery with someone else.",
    highlights: [
      "The franchise was built collaboratively, not according to a perfect master plan.",
      "Every successful new medium preserved collection and social exchange.",
      "The archive is part of that history: fans have become active custodians of design memory.",
    ],
    source: "Pocket Archives synthesis · primary and scholarly sources",
    sourceUrl: "https://corporate.pokemon.co.jp/en/aboutus/figures/",
  },
];

const PAGE_SIZE = 72;
const secureReferenceHosts = new Set([
  "psartroom.weebly.com",
  "i.imgur.com",
  "31.media.tumblr.com",
  "37.media.tumblr.com",
  "38.media.tumblr.com",
  "33.media.tumblr.com",
  "25.media.tumblr.com",
  "24.media.tumblr.com",
  "i288.photobucket.com",
  "i19.photobucket.com",
  "i6.photobucket.com",
  "i5.photobucket.com",
  "i68.photobucket.com",
  "img.photobucket.com",
  "smg.photobucket.com",
  "rubberslug.s3.amazonaws.com",
  "ic.pics.livejournal.com",
  "www.pokewiki.de",
  "thesunnyclearing.weebly.com",
  "caffwin.weebly.com",
  "spiritofmetal.weebly.com",
  "lilycove.weebly.com",
  "olivine.weebly.com",
  "pikapalace.weebly.com",
  "bulbapedia.bulbagarden.net",
  "sketchfab.com",
  "www.google.com",
]);
const generationRoman = [
  "",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
];
const generationRegions = [
  "Special collections",
  "Kanto",
  "Johto",
  "Hoenn",
  "Sinnoh",
  "Unova",
  "Kalos",
  "Alola",
  "Galar & Hisui",
  "Paldea",
];
const dexGenerationEnds = [151, 251, 386, 493, 649, 721, 809, 905, 1025];

function generationFor(item: PokemonArt) {
  if (item.generation) return item.generation;
  if (!item.dex) return 0;
  const index = dexGenerationEnds.findIndex((end) => item.dex! <= end);
  return index < 0 ? 9 : index + 1;
}

function groupKey(item: PokemonArt) {
  return item.dex ? `dex-${item.dex}` : `special-${item.title.toLowerCase()}`;
}

function titleCase(value: string) {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function referenceDestination(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" && secureReferenceHosts.has(url.hostname))
      url.protocol = "https:";
    return url.toString();
  } catch {
    return value;
  }
}

function referenceProvenance(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const archived =
      host === "web.archive.org" || value.includes("web.archive.org/web/");
    const labels: Record<string, string> = {
      "psartroom.weebly.com": "PS Art Room mirror",
      "settei.net": "Settei.net scan archive",
      "i.imgur.com": "Imgur community mirror",
      "imgur.com": "Imgur community mirror",
      "rubberslug.s3.amazonaws.com": "Rubberslug collector archive",
      "rubberslug.com": "Rubberslug collector archive",
      "bulbapedia.bulbagarden.net": "Bulbapedia archive",
      "archives.bulbagarden.net": "Bulbagarden Archives",
      "web.archive.org": "Internet Archive preserved copy",
    };
    const label =
      labels[host] ||
      (host.includes("tumblr.com")
        ? "Tumblr community mirror"
        : host.includes("photobucket.com")
          ? "Photobucket community mirror"
          : host.includes("weebly.com")
            ? "Community reference archive"
            : host);
    return { label, host, archived };
  } catch {
    return {
      label: "Source recorded by PS Art Room",
      host: "Unknown host",
      archived: false,
    };
  }
}

export function ArchiveExperience() {
  const [art, setArt] = useState<PokemonArt[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("dex");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<PokemonArt | null>(null);
  const [details, setDetails] = useState<PokemonDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [variantView, setVariantView] = useState<
    "forms" | "artwork" | "design" | "cards"
  >("forms");
  const [cards, setCards] = useState<TcgCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TcgCard | null>(null);
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");
  const [view, setView] = useState<"references" | "museum" | "favorites">(
    "references",
  );
  const [archiveSection, setArchiveSection] = useState<
    "history" | "alpha" | "sketches" | "references"
  >("history");
  const [setteiDirectory, setSetteiDirectory] = useState<SetteiGroup[]>([]);
  const [selectedReference, setSelectedReference] =
    useState<ReferenceSelection | null>(null);
  const [selectedSketch, setSelectedSketch] =
    useState<SketchSelection | null>(null);
  const [selectedDevelopment, setSelectedDevelopment] =
    useState<DevelopmentItem | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<ArchivePanel | null>(null);
  const [tourRoom, setTourRoom] = useState<number | null>(null);
  const [museumWing, setMuseumWing] = useState<
    "lobby" | "periods" | "research"
  >("lobby");
  const [referenceImageError, setReferenceImageError] = useState(false);
  const [spriteEvolution, setSpriteEvolution] =
    useState<SpriteEvolutionManifest | null>(null);
  const [spriteDex, setSpriteDex] = useState(1);
  const [archiveMenuOpen, setArchiveMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const museumTextRef = useRef<HTMLElement>(null);
  const museumTouchStart = useRef<{ x: number; y: number } | null>(null);
  const overlayHistoryArmed = useRef(false);

  const hasOpenOverlay = Boolean(
    selected ||
      selectedReference ||
      selectedSketch ||
      selectedDevelopment ||
      selectedPanel ||
      tourRoom !== null,
  );

  useEffect(() => {
    if (hasOpenOverlay && !overlayHistoryArmed.current) {
      const currentState =
        window.history.state && typeof window.history.state === "object"
          ? window.history.state
          : {};
      window.history.pushState(
        { ...currentState, pocketArchivesOverlay: true },
        "",
        window.location.href,
      );
      overlayHistoryArmed.current = true;
      return;
    }

    if (!hasOpenOverlay && overlayHistoryArmed.current) {
      overlayHistoryArmed.current = false;
      if (window.history.state?.pocketArchivesOverlay) window.history.back();
    }
  }, [hasOpenOverlay]);

  useEffect(() => {
    const closeOverlayOnBack = () => {
      if (!overlayHistoryArmed.current) return;
      overlayHistoryArmed.current = false;
      setSelected(null);
      setSelectedReference(null);
      setSelectedSketch(null);
      setSelectedDevelopment(null);
      setSelectedPanel(null);
      setTourRoom(null);
    };
    window.addEventListener("popstate", closeOverlayOnBack);
    return () => window.removeEventListener("popstate", closeOverlayOnBack);
  }, []);

  useEffect(() => {
    if (window.location.hostname === "shop.pocketarchives.com") {
      window.location.replace(EXTERNAL_SHOP_URL);
    }
  }, []);

  useEffect(() => {
    fetch("/data/pokemon.json")
      .then((response) => response.json())
      .then(setArt);
    fetch("/data/settei-links.json")
      .then((response) => response.json())
      .then(setSetteiDirectory);
    fetch("/data/sprite-evolution.json")
      .then((response) => response.json())
      .then(setSpriteEvolution);
    const saved = localStorage.getItem("pocket-archive-favorite-species");
    if (saved) setFavorites(new Set(JSON.parse(saved)));
    const savedDisplay = localStorage.getItem("pocket-archive-display");
    if (savedDisplay === "list") setDisplayMode("list");
  }, []);

  useEffect(() => {
    const syncPageFromHash = () => {
      const retiredGalleryLink =
        window.location.hash === "#collection" ||
        window.location.hash === "#pokedex" ||
        window.location.hash.startsWith("#gen-");
      if (
        window.location.hash === "#references" ||
        window.location.hash === "#archive" ||
        retiredGalleryLink
      ) {
        setView("references");
        setFilter("all");
        requestAnimationFrame(() =>
          document.querySelector("#collection")?.scrollIntoView(),
        );
      } else if (window.location.hash === "#museum") {
        setView("references");
        setArchiveSection("history");
        setFilter("all");
        requestAnimationFrame(() =>
          document.querySelector("#collection")?.scrollIntoView(),
        );
      } else if (window.location.hash === "#favorites") {
        setView("favorites");
        setFilter("all");
        requestAnimationFrame(() =>
          document.querySelector("#collection")?.scrollIntoView(),
        );
      }
    };
    syncPageFromHash();
    window.addEventListener("hashchange", syncPageFromHash);
    window.addEventListener("popstate", syncPageFromHash);
    return () => {
      window.removeEventListener("hashchange", syncPageFromHash);
      window.removeEventListener("popstate", syncPageFromHash);
    };
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, PokemonArt[]>();
    art.forEach((item) => {
      const key = groupKey(item);
      map.set(key, [...(map.get(key) || []), item]);
    });
    return [...map.entries()].map(([key, items]) => {
      const ordered = [...items].sort((a, b) => {
        const aCore =
          a.category === "generation" && a.collection.startsWith("Generation")
            ? 0
            : 1;
        const bCore =
          b.category === "generation" && b.collection.startsWith("Generation")
            ? 0
            : 1;
        return (
          aCore - bCore ||
          a.title.length - b.title.length ||
          a.title.localeCompare(b.title)
        );
      });
      const representative = ordered[0];
      return {
        key,
        dex: representative.dex,
        title: representative.title,
        generation: generationFor(representative),
        representative,
        items: ordered,
      };
    });
  }, [art]);

  const groupMap = useMemo(
    () => new Map(groups.map((group) => [group.key, group])),
    [groups],
  );
  const selectedGroup = selected
    ? groupMap.get(groupKey(selected)) || null
    : null;
  const selectedSketchSheets =
    selectedSketch?.group.items.filter((item) => item.category === "design") ||
    [];
  const selectedSketchSheet = selectedSketch
    ? selectedSketchSheets[selectedSketch.index]
    : null;
  const selectedRights = selected ? artworkRights(selected) : null;
  const selectedShopItems = selectedGroup?.dex
    ? inventoryForPokemon(selectedGroup.dex).filter(
        (item) => item.availabilityStatus === "available",
      )
    : [];
  const selectedForms =
    selectedGroup?.items.filter((item) => item.category === "generation") || [];
  const selectedArtwork =
    selectedGroup?.items.filter((item) => item.category === "alternate") || [];
  const selectedDesign =
    selectedGroup?.items.filter((item) => item.category === "design") || [];
  const shownVariants =
    variantView === "forms"
      ? selectedForms
      : variantView === "design"
        ? selectedDesign
        : selectedArtwork;

  useEffect(() => {
    if (!selectedGroup) return;
    setVariantView(
      selected?.category === "design"
        ? "design"
        : selected?.category === "alternate"
          ? "artwork"
          : selectedGroup.items.some((item) => item.category === "generation")
            ? "forms"
            : "artwork",
    );
    setCards([]);
    setSelectedCard(null);
    setCardsError(false);
  }, [selectedGroup?.key]);

  useEffect(() => {
    const match = window.location.hash.match(/^#pokemon-(\d+)$/);
    if (!match || !art.length) return;
    const pokemon = art.find((item) => item.dex === Number(match[1]));
    if (!pokemon) return;
    setView("references");
    setFilter("all");
    setSelected(pokemon);
    requestAnimationFrame(() =>
      document.querySelector("#collection")?.scrollIntoView(),
    );
  }, [art]);

  useEffect(() => {
    if (
      variantView !== "cards" ||
      !selectedGroup?.dex ||
      cards.length ||
      cardsLoading
    )
      return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      q: `nationalPokedexNumbers:${selectedGroup.dex}`,
      pageSize: "250",
      orderBy: "-set.releaseDate,number",
      select: "id,name,artist,rarity,number,set,images",
    });
    setCardsLoading(true);
    setCardsError(false);
    fetch(`https://api.pokemontcg.io/v2/cards?${params}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Card lookup failed");
        return response.json();
      })
      .then((payload) => {
        setCards(payload.data || []);
        setSelectedCard(payload.data?.[0] || null);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setCardsError(true);
      })
      .finally(() => setCardsLoading(false));
    return () => controller.abort();
  }, [variantView, selectedGroup?.dex, cards.length]);

  useEffect(() => {
    if (!selectedGroup?.dex) {
      setDetails(null);
      return;
    }
    const controller = new AbortController();
    setDetailsLoading(true);
    setDetails(null);
    Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${selectedGroup.dex}`, {
        signal: controller.signal,
      }).then((response) => response.json()),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${selectedGroup.dex}`, {
        signal: controller.signal,
      }).then((response) => response.json()),
    ])
      .then(([pokemon, species]) => {
        const englishDescriptions = species.flavor_text_entries.filter(
          (entry: { language: { name: string } }) =>
            entry.language.name === "en",
        );
        const description =
          englishDescriptions
            .at(-1)
            ?.flavor_text.replace(/[\n\f]/g, " ")
            .replace(/\s+/g, " ") || "No Pokédex entry available.";
        const genus =
          species.genera.find(
            (entry: { language: { name: string } }) =>
              entry.language.name === "en",
          )?.genus || "Pokémon";
        setDetails({
          genus,
          description,
          types: pokemon.types.map(
            (entry: { type: { name: string } }) => entry.type.name,
          ),
          height: pokemon.height / 10,
          weight: pokemon.weight / 10,
          habitat: species.habitat?.name || null,
          legendary: species.is_legendary,
          mythical: species.is_mythical,
        });
      })
      .catch((error) => {
        if (error.name !== "AbortError") setDetails(null);
      })
      .finally(() => setDetailsLoading(false));
    return () => controller.abort();
  }, [selectedGroup?.dex]);

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = groups.filter((group) => {
      const filterMatch =
        filter === "all" ||
        (filter === "alternate" &&
          group.items.some((item) => item.category === "alternate")) ||
        (filter.startsWith("gen-") &&
          group.generation === Number(filter.slice(4)));
      const haystack =
        `${group.title} ${group.dex ?? ""} ${group.items.map((item) => `${item.title} ${item.collection}`).join(" ")}`.toLowerCase();
      return filterMatch && (!needle || haystack.includes(needle));
    });
    return [...result].sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "collection")
        return (
          a.representative.collection.localeCompare(
            b.representative.collection,
          ) || a.title.localeCompare(b.title)
        );
      return (
        (a.dex ?? 9999) - (b.dex ?? 9999) || a.title.localeCompare(b.title)
      );
    });
  }, [groups, query, filter, sort]);

  const favoriteResults = useMemo(
    () => filteredGroups.filter((group) => favorites.has(group.key)),
    [filteredGroups, favorites],
  );
  const designResults = useMemo(
    () =>
      filteredGroups.filter((group) =>
        group.items.some((item) => item.category === "design"),
      ),
    [filteredGroups],
  );
  const referenceResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return setteiDirectory.filter(
      (group) =>
        !needle ||
        `${group.name} ${group.dex} ${group.links.map((link) => link.label).join(" ")}`
          .toLowerCase()
          .includes(needle),
    );
  }, [query, setteiDirectory]);
  const referenceItems = useMemo(
    () =>
      referenceResults.flatMap((group) =>
        group.links.map((link, index) => ({ group, link, index })),
      ),
    [referenceResults],
  );
  const developmentResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return developmentArchive.filter(
      (item) =>
        !needle ||
        `${developmentDate(item)} ${item.title} ${item.kind} ${developmentCreator(item)} ${item.illustrator || ""} ${item.organization || ""} ${item.originalObject || ""} ${item.imageSource || ""} ${item.provenance || ""} ${item.verificationStatus || ""} ${item.sourceLabel} ${item.description} alpha beta prototype capsule monsters capumon reddit imgur carddass early art`
          .toLowerCase()
          .includes(needle),
    );
  }, [query]);
  const resourceResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return referenceResources.filter(
      (resource) =>
        !needle ||
        `${resource.title} ${resource.eyebrow} ${resource.description} ${resource.keywords}`
          .toLowerCase()
          .includes(needle),
    );
  }, [query]);
  const activeGroups = view === "favorites" ? favoriteResults : filteredGroups;
  const original151 = useMemo(
    () =>
      Array.from({ length: 151 }, (_, index) => {
        const dex = index + 1;
        return {
          dex,
          name: KANTO_POKEDEX_NAMES[index],
        };
      }),
    [],
  );
  const selectedSpritePokemon = original151[spriteDex - 1];
  const selectedPanelPosition = selectedPanel
    ? museumReadingSequence.findIndex((panel) => panel.id === selectedPanel.id)
    : -1;

  useEffect(() => {
    if (tourRoom === null) return;
    museumTextRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [tourRoom]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && archiveMenuOpen) {
        setArchiveMenuOpen(false);
        return;
      }
      if (tourRoom !== null) {
        if (event.key === "Escape") setTourRoom(null);
        if (event.key === "ArrowRight" && tourRoom < museumRooms.length - 1)
          setTourRoom(tourRoom + 1);
        if (event.key === "ArrowLeft" && tourRoom > 0)
          setTourRoom(tourRoom - 1);
        return;
      }
      if (selectedPanel) {
        if (event.key === "Escape") setSelectedPanel(null);
        if (event.key === "ArrowRight") moveMuseumPanel(1);
        if (event.key === "ArrowLeft") moveMuseumPanel(-1);
        return;
      }
      if (selectedDevelopment) {
        if (event.key === "Escape") setSelectedDevelopment(null);
        if (event.key === "ArrowRight" || event.key === "ArrowLeft")
          moveDevelopment(event.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (selectedSketch) {
        if (event.key === "Escape") setSelectedSketch(null);
        if (event.key === "ArrowRight" || event.key === "ArrowLeft")
          moveSketch(event.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (selectedReference) {
        if (event.key === "Escape") setSelectedReference(null);
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          const current = referenceItems.findIndex(
            (item) =>
              item.group.dex === selectedReference.group.dex &&
              item.index === selectedReference.index,
          );
          if (current >= 0 && referenceItems.length) {
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const next =
              referenceItems[
                (current + direction + referenceItems.length) %
                  referenceItems.length
              ];
            setSelectedReference({ group: next.group, index: next.index });
          }
        }
        return;
      }
      if (!selected || !selectedGroup) return;
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const current = activeGroups.findIndex(
          (group) => group.key === selectedGroup.key,
        );
        if (current >= 0 && activeGroups.length)
          setSelected(
            activeGroups[
              (current + direction + activeGroups.length) % activeGroups.length
            ].representative,
          );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const featured = useMemo(
    () =>
      ["Bulbasaur RG", "Gengar RG", "Charizard RG", "Pikachu RG", "Eevee RG"]
        .map((title) =>
          art.find(
            (item) =>
              item.title === title && item.collection === "Red and Green",
          ),
        )
        .filter(Boolean) as PokemonArt[],
    [art],
  );
  const counts = useMemo(
    () => ({
      references: setteiDirectory.reduce(
        (total, group) => total + group.links.length,
        0,
      ),
    }),
    [setteiDirectory],
  );
  useEffect(() => setVisible(PAGE_SIZE), [query, filter, sort, view]);

  function toggleFavorite(key: string) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem(
        "pocket-archive-favorite-species",
        JSON.stringify([...next]),
      );
      return next;
    });
  }

  function changeDisplay(mode: "grid" | "list") {
    setDisplayMode(mode);
    localStorage.setItem("pocket-archive-display", mode);
  }

  function openReferences() {
    setView("references");
    setFilter("all");
    window.history.pushState(null, "", "#archive");
  }

  function openArchiveSection(
    section: "history" | "alpha" | "sketches" | "references",
  ) {
    setArchiveSection(section);
    setVisible(PAGE_SIZE);
    requestAnimationFrame(() =>
      document
        .querySelector("#archive-browser")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  function openArchiveDestination(
    section: "history" | "alpha" | "sketches" | "references",
    targetId: string,
  ) {
    setView("references");
    setArchiveSection(section);
    setFilter("all");
    setQuery("");
    setArchiveMenuOpen(false);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document
          .getElementById(targetId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      ),
    );
  }

  function openMuseum() {
    setView("museum");
    setFilter("all");
    setMuseumWing("lobby");
    window.history.pushState(null, "", "#museum");
  }

  function openFavorites() {
    setView("favorites");
    setFilter("all");
    window.history.pushState(null, "", "#favorites");
    requestAnimationFrame(() =>
      document
        .querySelector("#collection")
        ?.scrollIntoView({ behavior: "smooth" }),
    );
  }

  function openTopLevelPage(page: "archive" | "museum") {
    if (page === "archive") openReferences();
    else openMuseum();
    requestAnimationFrame(() =>
      document
        .querySelector("#collection")
        ?.scrollIntoView({ behavior: "smooth" }),
    );
  }

  function openReference(group: SetteiGroup, index: number) {
    setReferenceImageError(false);
    setSelectedReference({ group, index });
  }

  function moveReference(direction: number) {
    if (!selectedReference || !referenceItems.length) return;
    const current = referenceItems.findIndex(
      (item) =>
        item.group.dex === selectedReference.group.dex &&
        item.index === selectedReference.index,
    );
    if (current < 0) return;
    const next =
      referenceItems[
        (current + direction + referenceItems.length) % referenceItems.length
      ];
    setReferenceImageError(false);
    setSelectedReference({ group: next.group, index: next.index });
  }

  function moveSketch(direction: number) {
    if (!selectedSketch) return;
    const sheets = selectedSketch.group.items.filter(
      (item) => item.category === "design",
    );
    if (!sheets.length) return;
    setSelectedSketch({
      group: selectedSketch.group,
      index: (selectedSketch.index + direction + sheets.length) % sheets.length,
    });
  }

  function moveDevelopment(direction: number) {
    if (!selectedDevelopment || !developmentResults.length) return;
    const current = developmentResults.findIndex(
      (item) => item.id === selectedDevelopment.id,
    );
    if (current < 0) return;
    setSelectedDevelopment(
      developmentResults[
        (current + direction + developmentResults.length) %
          developmentResults.length
      ],
    );
  }

  function moveMuseumPanel(direction: number) {
    if (!selectedPanel) return;
    const current = museumReadingSequence.findIndex(
      (panel) => panel.id === selectedPanel.id,
    );
    const next = current + direction;
    if (next >= 0 && next < museumReadingSequence.length)
      setSelectedPanel(museumReadingSequence[next]);
  }

  function moveMuseumTour(direction: number) {
    setTourRoom((room) =>
      room === null
        ? 0
        : Math.min(museumRooms.length - 1, Math.max(0, room + direction)),
    );
  }

  function renderGroupCard(group: PokemonGroup) {
    return (
      <article className="art-card" key={group.key}>
        <button
          className="image-button"
          onClick={() => setSelected(group.representative)}
          aria-label={`Open archive record for ${group.title}`}
        >
          <span className="dex-number">
            {group.dex ? `#${String(group.dex).padStart(4, "0")}` : "ALT"}
          </span>
          <img
            src={group.representative.src}
            alt={group.title}
            loading="lazy"
          />
          {group.items.length > 1 && (
            <span className="forms-count">{group.items.length} images</span>
          )}
        </button>
        <div className="card-info">
          <div>
            <h3>{group.title}</h3>
            <p>
              {group.dex
                ? `Gen ${generationRoman[group.generation]} · ${generationRegions[group.generation]}`
                : group.representative.collection}
            </p>
          </div>
          <button
            className={`heart ${favorites.has(group.key) ? "saved" : ""}`}
            onClick={() => toggleFavorite(group.key)}
            aria-label={`${favorites.has(group.key) ? "Remove" : "Add"} ${group.title} ${favorites.has(group.key) ? "from" : "to"} favorites`}
          >
            ♥
          </button>
        </div>
      </article>
    );
  }

  function renderNameRow(group: PokemonGroup) {
    const formCount = group.items.filter(
      (item) => item.category === "generation",
    ).length;
    const artworkCount = group.items.filter(
      (item) => item.category === "alternate",
    ).length;
    const designCount = group.items.filter(
      (item) => item.category === "design",
    ).length;
    return (
      <article className="name-row" key={group.key}>
        <button
          className="name-row-main"
          onClick={() => setSelected(group.representative)}
          aria-label={`Open archive record for ${group.title}`}
        >
          <span className="name-dex">
            {group.dex ? `#${String(group.dex).padStart(4, "0")}` : "ALT"}
          </span>
          <strong>{group.title}</strong>
          <span className="name-region">
            {group.dex
              ? `Gen ${generationRoman[group.generation]} · ${generationRegions[group.generation]}`
              : group.representative.collection}
          </span>
          <span className="name-counts">
            {formCount > 1 ? `${formCount} forms` : "Standard form"}
            {artworkCount
              ? ` · ${artworkCount} alternate ${artworkCount === 1 ? "artwork" : "artworks"}`
              : ""}
            {designCount
              ? ` · ${designCount} ${designCount === 1 ? "design sheet" : "design sheets"}`
              : ""}
          </span>
          <span className="name-arrow" aria-hidden="true">
            ›
          </span>
        </button>
        <button
          className={`heart name-heart ${favorites.has(group.key) ? "saved" : ""}`}
          onClick={() => toggleFavorite(group.key)}
          aria-label={`${favorites.has(group.key) ? "Remove" : "Add"} ${group.title} ${favorites.has(group.key) ? "from" : "to"} favorites`}
        >
          ♥
        </button>
      </article>
    );
  }

  function renderDesignCard(group: PokemonGroup) {
    const sheets = group.items.filter((item) => item.category === "design");
    const cover = sheets[0];
    return (
      <article className="art-card design-card" key={`design-${group.key}`}>
        <button
          className="image-button"
          onClick={() => setSelectedSketch({ group, index: 0 })}
          aria-label={`Open sketches and design for ${group.title}`}
        >
          <span className="dex-number">
            {group.dex ? `#${String(group.dex).padStart(4, "0")}` : "REF"}
          </span>
          <img
            src={cover.src}
            alt={`${group.title} character design reference`}
            loading="lazy"
          />
          <span className="forms-count">
            {sheets.length} {sheets.length === 1 ? "sheet" : "sheets"}
          </span>
        </button>
        <div className="card-info">
          <div>
            <h3>{group.title}</h3>
            <p>{cover.collection}</p>
          </div>
          <button
            className={`heart ${favorites.has(group.key) ? "saved" : ""}`}
            onClick={() => toggleFavorite(group.key)}
            aria-label={`${favorites.has(group.key) ? "Remove" : "Add"} ${group.title} ${favorites.has(group.key) ? "from" : "to"} favorites`}
          >
            ♥
          </button>
        </div>
      </article>
    );
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Pocket Archives home">
          <span className="brand-mark">
            <img src="/pocket-archives-logo.png" alt="" />
          </span>
          <span>
            POCKET
            <br />
            ARCHIVES
            <small>Collections · cards · culture</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <button
            className={view === "references" ? "active" : ""}
            onClick={() => openTopLevelPage("archive")}
          >
            Archives
          </button>
          <a href={EXTERNAL_SHOP_URL}>Shop ↗</a>
        </nav>
        <button className="favorites-link" onClick={openFavorites}>
          <span>♥</span> Favorites <b>{favorites.size}</b>
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> Pokémon design history, preserved
          </p>
          <h1>
            The art behind
            <br />
            <em>the phenomenon.</em>
          </h1>
          <p className="hero-intro">
            An independent visual archive tracing Pokémon from early concepts
            and production drawings to one of the world’s most recognizable
            design languages.
          </p>
          <button
            className="explore-button"
            onClick={() => openTopLevelPage("archive")}
          >
            Enter the archive <span>↓</span>
          </button>
        </div>
        <div
          className="hero-gallery"
          aria-label="Vintage Ken Sugimori Pokémon artwork"
        >
          {featured.map((item, index) => (
            <figure
              key={item.id}
              className={`feature-card feature-${index + 1}`}
            >
              <span className="feature-number">
                {String(item.dex).padStart(4, "0")}
              </span>
              <img
                src={item.src}
                alt={`${item.title.replace(" RG", "")} · vintage Ken Sugimori Red and Green artwork`}
              />
            </figure>
          ))}
          {!featured.length && (
            <div className="hero-loader">
              Cataloguing
              <br />
              the archive…
            </div>
          )}
        </div>
        <div className="hero-stats">
          <span>
            <b>{art.length ? art.length.toLocaleString() : "—"}</b> archived
            images
          </span>
          <span>
            <b>{groups.filter((group) => group.dex).length || "—"}</b> species
            indexed
          </span>
          <span>
            <b>{counts.references || "—"}</b> reference sheets
          </span>
        </div>
      </section>

      <section className="collection" id="collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <span />{" "}
              {view === "favorites" ? "Your collection" : "Explore the collection"}
            </p>
            <h2>{view === "favorites" ? "Saved for later." : "The archive."}</h2>
          </div>
          <p>
            {view === "favorites"
              ? "Every archive record you have favorited on this device, gathered in one place."
              : "Move through the history, then explore the surviving concepts, character studies, and production material."}
          </p>
        </div>
        <div className="view-tabs" role="tablist" aria-label="Collection views">
          <button
            role="tab"
            aria-selected={view === "references"}
            className={view === "references" ? "active" : ""}
            onClick={openReferences}
          >
            <span>01</span> Archives
          </button>
          <a
            className="shop-view-tab"
            href={EXTERNAL_SHOP_URL}
          >
            <span>02</span> Shop ↗
          </a>
        </div>

        {view === "references" && archiveSection === "history" ? (
          <div className="archive-orientation">
            <span>Start here</span>
            <p>
              Follow the timeline, then move into the surviving drawings and
              working production material.
            </p>
          </div>
        ) : (
          <div className="filter-panel">
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  view === "references"
                    ? "Search Pokémon, prototype, pose, or sheet…"
                    : "Search saved archive records…"
                }
                aria-label={
                  view === "references"
                    ? "Search the archives"
                    : "Search saved archive records"
                }
              />
              <kbd>/</kbd>
            </label>
            <p className="favorites-note">
              {view === "references"
                ? "Open any image to inspect it without leaving the archive."
                : "Your saved archive records live here on this device."}
            </p>
          </div>
        )}

        {!(view === "references" && archiveSection === "history") && (
          <div className="results-bar">
            <p>
              {view === "references" ? (
                <>
                  <b>
                    {archiveSection === "alpha"
                      ? developmentResults.length.toLocaleString()
                      : archiveSection === "sketches"
                        ? designResults.length.toLocaleString()
                        : referenceItems.length.toLocaleString()}
                  </b>{" "}
                  {archiveSection === "alpha"
                    ? "early-design records"
                    : archiveSection === "sketches"
                      ? "character sketch groups"
                      : "production sheets"}
                </>
              ) : (
                <>
                  <b>{activeGroups.length.toLocaleString()}</b> saved records
                </>
              )}
            </p>
            <div className="results-controls">
              {view === "favorites" && (
                <div
                  className="display-toggle"
                  role="group"
                  aria-label="Display style"
                >
                  <button
                    className={displayMode === "grid" ? "active" : ""}
                    onClick={() => changeDisplay("grid")}
                    aria-pressed={displayMode === "grid"}
                  >
                    <span>▦</span> Grid
                  </button>
                  <button
                    className={displayMode === "list" ? "active" : ""}
                    onClick={() => changeDisplay("list")}
                    aria-pressed={displayMode === "list"}
                  >
                    <span>☰</span> Names
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === "references" ? (
          <div className="reference-library" id="archive-browser">
            <nav className="archive-index" aria-label="Archive sections">
              <button
                className={archiveSection === "history" ? "active" : ""}
                onClick={() => openArchiveSection("history")}
              >
                <small>01</small>
                <b>History</b>
                <span>Guided timeline</span>
              </button>
              <button
                className={archiveSection === "alpha" ? "active" : ""}
                onClick={() => openArchiveSection("alpha")}
              >
                <small>02</small>
                <b>Early designs</b>
                <span>Concept archive</span>
              </button>
              <button
                className={archiveSection === "sketches" ? "active" : ""}
                onClick={() => openArchiveSection("sketches")}
              >
                <small>03</small>
                <b>Character sketches</b>
                <span>Drawing studies</span>
              </button>
              <button
                className={archiveSection === "references" ? "active" : ""}
                onClick={() => openArchiveSection("references")}
              >
                <small>04</small>
                <b>Production sheets</b>
                <span>Animation reference</span>
              </button>
            </nav>
            {archiveSection === "history" && (
              <section
                className="archive-history"
                id="archive-history-overview"
              >
                <button
                  className="museum-launch"
                  onClick={() => setTourRoom(0)}
                >
                  <span>
                    <small>Guided chronological exhibition</small>
                    <b>The history of Pokémon</b>
                    <em>
                      {museumRooms.length} chapters · Japan to the world ·
                      approximately 10 minutes
                    </em>
                  </span>
                  <strong>
                    Begin <i>→</i>
                  </strong>
                </button>
                <div className="archive-history-heading">
                  <span>1965–present</span>
                  <h3>A world built over time.</h3>
                  <p>
                    Move through the major moments in order. Each chapter
                    connects the historical story to the surviving artwork and
                    evidence.
                  </p>
                </div>
                <div className="archive-timeline" id="archive-timeline">
                  {museumRooms.map((room, index) => (
                    <button key={room.id} onClick={() => setTourRoom(index)}>
                      <span className="archive-timeline-year">{room.year}</span>
                      <span className="archive-timeline-image">
                        <img src={room.image} alt="" loading="lazy" />
                      </span>
                      <span className="archive-timeline-copy">
                        <small>
                          Chapter {String(index + 1).padStart(2, "0")}
                        </small>
                        <b>{room.title}</b>
                        <p>{room.subtitle}</p>
                        <em>Read chapter →</em>
                      </span>
                    </button>
                  ))}
                </div>
                <details className="canonical-timeline-register">
                  <summary>
                    <span>
                      <small>Canonical research register</small>
                      <b>Documented chronology</b>
                    </span>
                    <em>{canonicalTimeline.length} dated entries</em>
                  </summary>
                  <div>
                    {canonicalTimeline.map((entry) => (
                      <article key={entry.id}>
                        <time>{entry.date}</time>
                        <p>{entry.event.replaceAll("*", "")}</p>
                        <span>{entry.confidence}</span>
                        <details>
                          <summary>Evidence</summary>
                          <p>{entry.evidence.replaceAll("*", "")}</p>
                        </details>
                      </article>
                    ))}
                  </div>
                </details>
                <div
                  className="archive-research-strip"
                  id="archive-design-periods"
                >
                  <div>
                    <small>Closer study</small>
                    <h3>How the first roster evolved</h3>
                    <p>
                      Five concise design periods explain the shift from early
                      kaiju-like creatures to a more connected world of types,
                      families, and personalities.
                    </p>
                  </div>
                  <div>
                    {internalListPanels.map((panel, index) => (
                      <button
                        key={panel.id}
                        onClick={() => setSelectedPanel(panel)}
                      >
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <b>{panel.title}</b>
                      </button>
                    ))}
                  </div>
                </div>
                {spriteEvolution && (
                  <section
                    className="sprite-evolution"
                    id="sprite-evolution"
                    aria-labelledby="sprite-evolution-title"
                  >
                    <header>
                      <div>
                        <span>1996–2000 · Interactive collection</span>
                        <h3 id="sprite-evolution-title">
                          The original 151
                          <br />
                          through the Game Boy years.
                        </h3>
                      </div>
                      <p>
                        Choose any of the original 151 and follow its front
                        battle sprite from the first Japanese Red and Green
                        designs through Blue, the international Red and Blue,
                        Yellow, Gold, Silver, and Crystal.
                      </p>
                    </header>
                    <div className="sprite-picker">
                      <button
                        onClick={() =>
                          setSpriteDex((dex) => (dex === 1 ? 151 : dex - 1))
                        }
                        aria-label="Previous Pokémon"
                      >
                        ←
                      </button>
                      <label>
                        <span>Choose a Pokémon</span>
                        <select
                          value={spriteDex}
                          onChange={(event) =>
                            setSpriteDex(Number(event.target.value))
                          }
                        >
                          {original151.map((pokemon) => (
                            <option value={pokemon.dex} key={pokemon.dex}>
                              #{String(pokemon.dex).padStart(3, "0")} ·{" "}
                              {pokemon.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        onClick={() =>
                          setSpriteDex((dex) => (dex === 151 ? 1 : dex + 1))
                        }
                        aria-label="Next Pokémon"
                      >
                        →
                      </button>
                    </div>
                    <div className="sprite-subject">
                      <span>#{String(spriteDex).padStart(3, "0")}</span>
                      <strong>{selectedSpritePokemon?.name}</strong>
                      <small>Six releases · original front sprites</small>
                    </div>
                    <div className="sprite-era-grid">
                      {spriteEvolution.eras.map((era) => (
                        <figure
                          key={era.key}
                          className={era.medium === "3D render" ? "render" : ""}
                        >
                          <div>
                            <img
                              src={`/sprites/${era.key}/${String(spriteDex).padStart(4, "0")}.png`}
                              alt={`${selectedSpritePokemon?.name} in ${era.label}`}
                              loading="lazy"
                            />
                          </div>
                          <figcaption>
                            <span>
                              Gen {era.generation} · {era.year}
                            </span>
                            <b>{era.label}</b>
                            {era.medium && <small>{era.medium}</small>}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                    <footer>
                      <p>
                        <b>Collection record.</b> Game sprites preserved by
                        veekun. Japanese Red and Green use the earliest front
                        sprites; the revised Japanese Blue set was used for the
                        international Red and Blue releases. Yellow and each
                        Generation II game are shown separately so design
                        changes are not collapsed into a generic generation.
                      </p>
                      <span>906 locally preserved views</span>
                    </footer>
                  </section>
                )}
              </section>
            )}
            {archiveSection === "alpha" &&
              (!!developmentResults.length ? (
                <section className="development-archive" id="early-designs">
                  <div className="timeline-heading">
                    <span>1990–2019 · Historical material and modern research</span>
                    <h3>Alpha &amp; beta archive</h3>
                    <p>
                      Original concepts, extracted prototype assets, release-era
                      Carddass illustrations, and research plates are labeled
                      separately.
                    </p>
                  </div>
                  <div className="thread-source-note">
                    <p>
                      <b>Digital preservation source.</b> This room combines
                      the canonical 21-record Capsule Monsters register with
                      later prototype research plates and community-preserved
                      images. Original objects, digital sources, verification,
                      and rights are kept separate.
                    </p>
                    <span>Oldest to newest</span>
                  </div>
                  <div className="development-grid">
                    {developmentResults.map((item) => (
                      <article className="development-card" key={item.id}>
                        <button
                          onClick={() => setSelectedDevelopment(item)}
                          aria-label={`Open ${item.title}`}
                        >
                          <span className="development-image">
                            <img
                              src={item.src}
                              alt={item.title}
                              loading="lazy"
                            />
                          </span>
                          <span className="development-card-copy">
                            <small>
                              {museumDate(item)} · {museumObjectType(item)}
                            </small>
                            <strong>{item.title}</strong>
                            <em>{developmentCreator(item)}</em>
                          </span>
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              ) : (
                <div className="empty-state">
                  <span>?</span>
                  <h3>No early material found</h3>
                  <p>Try a broader search.</p>
                  <button onClick={() => setQuery("")}>Clear search</button>
                </div>
              ))}
            {archiveSection === "sketches" &&
              (!!designResults.length ? (
                <section className="archive-sketches" id="character-sketches">
                  <div className="reference-heading">
                    <span>1996–present · Pokédex order</span>
                    <h3>Character sketches</h3>
                    <p>{designResults.length} Pokémon</p>
                  </div>
                  <div className="art-grid">
                    {designResults.map(renderDesignCard)}
                  </div>
                </section>
              ) : (
                <div className="empty-state">
                  <span>?</span>
                  <h3>No character sketches found</h3>
                  <p>Try another Pokémon name.</p>
                  <button onClick={() => setQuery("")}>Clear search</button>
                </div>
              ))}
            {archiveSection === "references" && (
              <section className="production-room" id="production-sheets">
                <div className="archive-provenance">
                  <div>
                    <span>Production room</span>
                    <h3>What are these sheets?</h3>
                  </div>
                  <div>
                    <p>
                      <b>Settei</b> are working reference drawings used to keep
                      characters, poses, expressions, and proportions consistent
                      in animation.
                    </p>
                    <p>
                      Each popup keeps only the sheet title and its source
                      record.
                    </p>
                    <p className="provenance-record">
                      PS Art Room index · OLM production references
                    </p>
                  </div>
                </div>
                <div className="reference-heading">
                  <span>1997–present · Pokédex order</span>
                  <h3>Production references</h3>
                  <p>{referenceItems.length} sheets</p>
                </div>
                {setteiDirectory.length === 0 ? (
                  <div className="loading-grid">
                    Indexing the reference room…
                  </div>
                ) : referenceItems.length === 0 ? (
                  <div className="empty-state">
                    <span>?</span>
                    <h3>No reference sheets found</h3>
                    <p>Try another Pokémon, pose, or expression.</p>
                    <button onClick={() => setQuery("")}>Clear search</button>
                  </div>
                ) : (
                  <div className="settei-gallery">
                    {referenceItems
                      .slice(0, visible)
                      .map(({ group, link, index }) => {
                        const archived = link.url.includes(
                          "web.archive.org/web/",
                        );
                        return (
                          <article
                            className="sheet-card"
                            key={`${group.dex}-${link.url}-${index}`}
                          >
                            <button
                              onClick={() => openReference(group, index)}
                              aria-label={`Open ${group.name} ${link.label} in the reference viewer`}
                            >
                              <span className="sheet-image">
                                <img
                                  src={referenceDestination(link.url)}
                                  alt={`${group.name} ${link.label}`}
                                  loading="lazy"
                                />
                              </span>
                              <span className="sheet-card-copy">
                                <small>
                                  #{String(group.dex).padStart(4, "0")}
                                  {archived
                                    ? " · Preserved copy"
                                    : " · Production art"}
                                </small>
                                <strong>{group.name}</strong>
                                <em>
                                  {link.label === "Model sheet" && index > 0
                                    ? `Model sheet ${index + 1}`
                                    : titleCase(link.label)}
                                </em>
                              </span>
                            </button>
                          </article>
                        );
                      })}
                  </div>
                )}
              </section>
            )}
          </div>
        ) : view === "museum" ? (
          <div className="museum-page">
            {museumWing === "lobby" && (
              <>
                <button
                  className="museum-launch"
                  onClick={() => setTourRoom(0)}
                >
                  <span>
                    <small>
                      Recommended first visit · Guided chronological exhibition
                    </small>
                    <b>The full history of Pokémon</b>
                    <em>
                      {museumRooms.length} rooms · Japan to the world ·
                      approximately 10 minutes
                    </em>
                  </span>
                  <strong>
                    Start tour <i>→</i>
                  </strong>
                </button>
                <div className="museum-room-intro">
                  <span>After the main exhibition</span>
                  <h3>Step into the study rooms.</h3>
                  <p>
                    The tour tells the full story. These two smaller galleries
                    let you inspect how the first roster was designed and how
                    incomplete historical evidence is interpreted.
                  </p>
                </div>
                <div className="museum-room-choices">
                  <button
                    className="museum-room-choice periods"
                    onClick={() => setMuseumWing("periods")}
                  >
                    <small>Study room 02 · Internal archaeology</small>
                    <strong>Design Lab</strong>
                    <p>
                      See how the original 190 internal slots developed across
                      five broad design periods.
                    </p>
                    <span>Enter room →</span>
                  </button>
                  <button
                    className="museum-room-choice research"
                    onClick={() => setMuseumWing("research")}
                  >
                    <small>Study room 03 · Source criticism</small>
                    <strong>Evidence Desk</strong>
                    <p>
                      Learn what actually survives—and where a confident claim
                      becomes an informed theory.
                    </p>
                    <span>Enter room →</span>
                  </button>
                </div>
              </>
            )}
            {museumWing === "periods" && (
              <section className="internal-list-wing museum-focused-wing">
                <button
                  className="museum-wing-back"
                  onClick={() => setMuseumWing("lobby")}
                >
                  ← Museum lobby
                </button>
                <div className="museum-wing-heading">
                  <span>Study room 02 · Internal archaeology</span>
                  <h3>Design Lab</h3>
                  <p>
                    Read from Period 1 through Period 5. This is Helix Chamber’s
                    research framework for the original Red &amp; Green
                    roster—not a confirmed production timeline.
                  </p>
                </div>
                <div className="museum-stat-strip">
                  <div>
                    <b>190</b>
                    <span>internal slots</span>
                  </div>
                  <div>
                    <b>151</b>
                    <span>released Pokémon</span>
                  </div>
                  <div>
                    <b>39</b>
                    <span>unused slots</span>
                  </div>
                  <div>
                    <b>5</b>
                    <span>design periods</span>
                  </div>
                </div>
                <div className="internal-period-grid">
                  {internalListPanels.map((panel, index) => (
                    <button
                      key={panel.id}
                      onClick={() => setSelectedPanel(panel)}
                    >
                      <small>Period {String(index + 1).padStart(2, "0")}</small>
                      <b>{panel.title}</b>
                      <p>{panel.description}</p>
                      <span>Read period →</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {museumWing === "research" && (
              <section className="museum-research-wing museum-focused-wing">
                <button
                  className="museum-wing-back"
                  onClick={() => setMuseumWing("lobby")}
                >
                  ← Museum lobby
                </button>
                <div className="museum-wing-heading">
                  <span>Study room 03 · Source criticism</span>
                  <h3>Evidence Desk</h3>
                  <p>
                    Start with note 01, or choose a question. These concise
                    explanations separate surviving files, documented facts,
                    community preservation, and informed interpretation.
                  </p>
                </div>
                <div
                  className="research-square-grid"
                  aria-label="Local prototype research explanations"
                >
                  {helixResearchPanels.map((panel, index) => (
                    <button
                      key={panel.id}
                      onClick={() => setSelectedPanel(panel)}
                    >
                      <small>
                        {String(index + 1).padStart(2, "0")} · Evidence note
                      </small>
                      <b>{panel.title}</b>
                      <span>Read note →</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : art.length === 0 ? (
          <div className="loading-grid">Opening the archive…</div>
        ) : activeGroups.length === 0 ? (
          <div className="empty-state">
            <span>{view === "favorites" ? "♥" : "?"}</span>
            <h3>
              {view === "favorites" ? "No favorites yet" : "No matches found"}
            </h3>
            <p>
              {view === "favorites"
                ? "Tap the heart on any Pokémon to build your collection."
                : "Try another name, number, or generation."}
            </p>
            {view !== "favorites" && (
              <button
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={displayMode === "grid" ? "art-grid" : "name-list"}>
            {(displayMode === "grid"
              ? activeGroups.slice(0, visible)
              : activeGroups
            ).map(displayMode === "grid" ? renderGroupCard : renderNameRow)}
          </div>
        )}
        {view === "references" &&
          archiveSection === "references" &&
          visible < referenceItems.length && (
            <button
              className="load-more"
              onClick={() => setVisible((value) => value + PAGE_SIZE)}
            >
              Load more{" "}
              <span>
                {Math.min(PAGE_SIZE, referenceItems.length - visible)}
              </span>
            </button>
          )}
        {displayMode === "grid" &&
          view === "favorites" &&
          visible < activeGroups.length && (
            <button
              className="load-more"
              onClick={() => setVisible((value) => value + PAGE_SIZE)}
            >
              Load more{" "}
              <span>{Math.min(PAGE_SIZE, activeGroups.length - visible)}</span>
            </button>
          )}
      </section>

      {view === "references" && (
        <>
          {archiveMenuOpen && (
            <button
              className="archive-menu-backdrop"
              onClick={() => setArchiveMenuOpen(false)}
              aria-label="Close archive menu"
            />
          )}
          {archiveMenuOpen && (
            <aside
              className="archive-float-menu"
              aria-label="Archive navigation"
            >
              <header>
                <span>Archive map</span>
                <button
                  onClick={() => setArchiveMenuOpen(false)}
                  aria-label="Close archive menu"
                >
                  ×
                </button>
              </header>
              <nav>
                <small>History</small>
                <button
                  onClick={() =>
                    openArchiveDestination(
                      "history",
                      "archive-history-overview",
                    )
                  }
                >
                  <span>01</span>
                  <b>History overview</b>
                </button>
                <button
                  onClick={() =>
                    openArchiveDestination("history", "archive-timeline")
                  }
                >
                  <span>02</span>
                  <b>Full timeline</b>
                </button>
                <button
                  onClick={() =>
                    openArchiveDestination("history", "archive-design-periods")
                  }
                >
                  <span>03</span>
                  <b>Design periods</b>
                </button>
                <button
                  onClick={() =>
                    openArchiveDestination("history", "sprite-evolution")
                  }
                >
                  <span>04</span>
                  <b>Sprite evolution</b>
                </button>
                <small>Collections</small>
                <button
                  onClick={() =>
                    openArchiveDestination("alpha", "early-designs")
                  }
                >
                  <span>05</span>
                  <b>Early designs</b>
                </button>
                <button
                  onClick={() =>
                    openArchiveDestination("sketches", "character-sketches")
                  }
                >
                  <span>06</span>
                  <b>Character sketches</b>
                </button>
                <button
                  onClick={() =>
                    openArchiveDestination("references", "production-sheets")
                  }
                >
                  <span>07</span>
                  <b>Production sheets</b>
                </button>
              </nav>
            </aside>
          )}
          <button
            className={`archive-menu-trigger ${archiveMenuOpen ? "open" : ""}`}
            onClick={() => setArchiveMenuOpen((open) => !open)}
            aria-label={
              archiveMenuOpen ? "Close archive menu" : "Open archive menu"
            }
            aria-expanded={archiveMenuOpen}
          >
            <i>
              <span />
              <span />
              <span />
            </i>
            <b>{archiveMenuOpen ? "Close" : "Explore"}</b>
          </button>
        </>
      )}

      <section className="about" id="about">
        <p className="eyebrow">
          <span /> About the archive
        </p>
        <div className="about-grid">
          <h2>
            A visual history,
            <br />
            one creature at a time.
          </h2>
          <div>
            <p>
              Pocket Archives is an independent research archive preserving the working history behind Pokémon:
              early concepts, prototype creatures, character studies, production
              references, and the research that helps place them in context.
              Artwork and species records remain connected where they clarify a
              design’s development, while every surviving source is identified
              as carefully as the evidence allows.
            </p>
            <p className="source-records">
              Source records · PS Art Room · PokéAPI · Pokémon TCG API ·
              Nintendo creator interviews · Helix Chamber
            </p>
            <p className="fine-print">
              Pocket Archives LLC is an independent archival and collecting
              project and is not affiliated with Nintendo, Game Freak,
              Creatures Inc., or The Pokémon Company. Pokémon and related marks
              belong to their respective owners. Source records remain credited
              to their original curators and hosts.
            </p>
          </div>
        </div>
      </section>
      <footer>
        <div className="brand footer-brand">
          <span className="brand-mark">
            <img src="/pocket-archives-logo.png" alt="" />
          </span>
          <span>
            POCKET
            <br />
            ARCHIVES
          </span>
        </div>
        <p>Research · preservation · collecting</p>
      </footer>

      {selected && selectedGroup && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedGroup.title} archive record`}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelected(null);
          }}
        >
          <button
            className="modal-close"
            onClick={() => setSelected(null)}
            aria-label="Close archive record"
          >
            ×
          </button>
          <div
            className={`modal-art ${selectedGroup.dex || selectedGroup.items.length > 1 ? "has-forms" : ""}`}
          >
            <span className="modal-index">
              {variantView === "cards" && selectedCard
                ? `${selectedCard.set.name} · #${selectedCard.number}`
                : selectedGroup.dex
                  ? `#${String(selectedGroup.dex).padStart(4, "0")}`
                  : "SPECIAL ART"}
            </span>
            {variantView === "cards" && selectedCard ? (
              <img
                className="tcg-card-main"
                src={selectedCard.images.large}
                alt={`${selectedCard.name} card from ${selectedCard.set.name}`}
              />
            ) : (
              <img src={selected.src} alt={selected.title} />
            )}
            {(selectedGroup.dex || selectedGroup.items.length > 1) && (
              <div
                className="form-strip"
                aria-label={`${selectedGroup.title} images`}
              >
                <div
                  className="variant-tabs"
                  role="tablist"
                  aria-label="Image type"
                >
                  <button
                    role="tab"
                    aria-selected={variantView === "forms"}
                    className={variantView === "forms" ? "active" : ""}
                    disabled={!selectedForms.length}
                    onClick={() => {
                      setVariantView("forms");
                      if (selectedForms.length) setSelected(selectedForms[0]);
                    }}
                  >
                    Forms <b>{selectedForms.length}</b>
                  </button>
                  <button
                    role="tab"
                    aria-selected={variantView === "artwork"}
                    className={variantView === "artwork" ? "active" : ""}
                    disabled={!selectedArtwork.length}
                    onClick={() => {
                      setVariantView("artwork");
                      if (selectedArtwork.length)
                        setSelected(selectedArtwork[0]);
                    }}
                  >
                    Alternate artwork <b>{selectedArtwork.length}</b>
                  </button>
                  <button
                    role="tab"
                    aria-selected={variantView === "design"}
                    className={variantView === "design" ? "active" : ""}
                    disabled={!selectedDesign.length}
                    onClick={() => {
                      setVariantView("design");
                      if (selectedDesign.length) setSelected(selectedDesign[0]);
                    }}
                  >
                    Sketches & design <b>{selectedDesign.length}</b>
                  </button>
                  <button
                    role="tab"
                    aria-selected={variantView === "cards"}
                    className={variantView === "cards" ? "active" : ""}
                    disabled={!selectedGroup.dex}
                    onClick={() => setVariantView("cards")}
                  >
                    Cards <b>{cardsLoading ? "…" : cards.length || ""}</b>
                  </button>
                </div>
                {variantView === "cards" ? (
                  cardsLoading ? (
                    <p className="card-strip-message">Finding cards…</p>
                  ) : cardsError ? (
                    <p className="card-strip-message">
                      Card gallery unavailable right now.
                    </p>
                  ) : (
                    cards.map((card) => (
                      <button
                        key={card.id}
                        className={`variant-thumb card-thumb ${selectedCard?.id === card.id ? "active" : ""}`}
                        onClick={() => setSelectedCard(card)}
                        aria-label={`Show ${card.name}, ${card.set.name} number ${card.number}`}
                      >
                        <img src={card.images.small} alt="" loading="lazy" />
                        <span>
                          {card.set.name} · {card.number}
                        </span>
                      </button>
                    ))
                  )
                ) : (
                  shownVariants.map((item) => (
                    <button
                      key={item.id}
                      className={`variant-thumb ${selected.id === item.id ? "active" : ""}`}
                      onClick={() => setSelected(item)}
                      aria-label={`Show ${item.title}, ${item.collection}`}
                    >
                      <img src={item.src} alt="" loading="lazy" />
                      <span>{item.title}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="modal-details">
            <p className="eyebrow">
              <span />{" "}
              {selectedGroup.dex
                ? `Generation ${generationRoman[selectedGroup.generation]} · ${generationRegions[selectedGroup.generation]}`
                : selected.collection}
            </p>
            <h2>{selectedGroup.title}</h2>
            {detailsLoading ? (
              <p className="details-loading">Reading species record…</p>
            ) : details ? (
              <>
                <p className="pokemon-genus">
                  {details.legendary
                    ? "Legendary · "
                    : details.mythical
                      ? "Mythical · "
                      : ""}
                  {details.genus}
                </p>
                <p className="dex-description">{details.description}</p>
                <div className="type-row">
                  {details.types.map((type) => (
                    <span className={`type type-${type}`} key={type}>
                      {titleCase(type)}
                    </span>
                  ))}
                </div>
                <dl className="pokemon-facts">
                  <div>
                    <dt>Height</dt>
                    <dd>{details.height} m</dd>
                  </div>
                  <div>
                    <dt>Weight</dt>
                    <dd>{details.weight} kg</dd>
                  </div>
                  <div>
                    <dt>Habitat</dt>
                    <dd>
                      {details.habitat ? titleCase(details.habitat) : "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt>Artwork</dt>
                    <dd>{selectedGroup.items.length} in archive</dd>
                  </div>
                </dl>
              </>
            ) : selectedGroup.dex ? (
              <p className="dex-description">
                Species information is temporarily unavailable.
              </p>
            ) : (
              <p className="dex-description">
                This unnumbered artwork belongs to the {selected.collection}{" "}
                collection.
              </p>
            )}
            {variantView === "cards" && selectedCard ? (
              <div className="source-credit card-credit">
                <span>Trading card</span>
                <b>
                  {selectedCard.set.name} · #{selectedCard.number}
                </b>
                <p>
                  {selectedCard.rarity || "Rarity not listed"} · Illustrated by{" "}
                  {selectedCard.artist || "artist not listed"}
                </p>
              </div>
            ) : (
              <div className="source-credit compact-credit">
                <span>Collection</span>
                <b>{selected.collection}</b>
              </div>
            )}
            {selectedRights && variantView !== "cards" && (
              <div className="source-credit rights-credit">
                <span>Rights &amp; provenance</span>
                <b>{selectedRights.originalSource}</b>
                <p>
                  {selectedRights.digitalSource} · {selectedRights.rightsStatus}{" "}
                  · {selectedRights.usageBasis}
                </p>
              </div>
            )}
            {!!selectedShopItems.length && (
              <section className="contextual-shop-module">
                <span>Available from Pocket Archives</span>
                {selectedShopItems.map((item) => (
                  <a href={shopObjectUrl(item.slug)} key={item.id}>
                    <div>
                      <b>{item.title}</b>
                      <small>{item.artist || item.category}</small>
                    </div>
                    <strong>View object ↗</strong>
                  </a>
                ))}
              </section>
            )}
            <div className="modal-actions">
              <button onClick={() => toggleFavorite(selectedGroup.key)}>
                {favorites.has(selectedGroup.key)
                  ? "♥ In favorites"
                  : "♡ Add to favorites"}
              </button>
              {selectedRights &&
                canDownload(selectedRights) &&
                variantView !== "cards" && (
                  <a href={selected.src} download>
                    Download art ↓
                  </a>
                )}
            </div>
            <p className="key-hint">Use ← → for next Pokémon · Esc to close</p>
          </div>
        </div>
      )}

      {selectedReference && (
        <div
          className="reference-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedReference.group.name} reference sheet`}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target)
              setSelectedReference(null);
          }}
        >
          <button
            className="reference-viewer-close"
            onClick={() => setSelectedReference(null)}
            aria-label="Close reference viewer"
          >
            ×
          </button>
          <div className="reference-viewer-stage">
            <span className="reference-viewer-index">
              #{String(selectedReference.group.dex).padStart(4, "0")} ·{" "}
              {selectedReference.index + 1} of{" "}
              {selectedReference.group.links.length}
            </span>
            {referenceImageError ? (
              <div className="reference-image-error">
                <b>Preview unavailable</b>
                <p>
                  This preserved sheet could not be loaded by its original host.
                </p>
              </div>
            ) : (
              <img
                src={referenceDestination(
                  selectedReference.group.links[selectedReference.index].url,
                )}
                alt={`${selectedReference.group.name} ${selectedReference.group.links[selectedReference.index].label}`}
                onError={() => setReferenceImageError(true)}
              />
            )}
            <button
              className="reference-step previous"
              onClick={() => moveReference(-1)}
              aria-label="Previous reference sheet"
            >
              ←
            </button>
            <button
              className="reference-step next"
              onClick={() => moveReference(1)}
              aria-label="Next reference sheet"
            >
              →
            </button>
          </div>
          <aside className="reference-viewer-details">
            <p className="eyebrow">
              <span /> Production reference
            </p>
            <h2>{selectedReference.group.name}</h2>
            <p className="reference-viewer-label">
              {titleCase(
                selectedReference.group.links[selectedReference.index].label,
              )}
            </p>
            <div className="reference-source">
              <span>Provenance</span>
              <b>Original material · Anime production reference</b>
              <p>
                Digital preservation source ·{" "}
                {
                  referenceProvenance(
                    selectedReference.group.links[selectedReference.index].url,
                  ).label
                }
                {referenceProvenance(
                  selectedReference.group.links[selectedReference.index].url,
                ).archived
                  ? " · preserved copy"
                  : ` · ${referenceProvenance(selectedReference.group.links[selectedReference.index].url).host}`}
                <br />
                Creator · not identified · Rights · respective rights holder ·
                Displayed for archival and research context
              </p>
            </div>
            <p className="key-hint">Use ← → for another sheet · Esc to close</p>
          </aside>
        </div>
      )}

      {selectedSketch && selectedSketchSheet && (
        <div
          className="reference-viewer sketch-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedSketch.group.title} character sketch`}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedSketch(null);
          }}
        >
          <button
            className="reference-viewer-close"
            onClick={() => setSelectedSketch(null)}
            aria-label="Close character sketch viewer"
          >
            ×
          </button>
          <div className="reference-viewer-stage sketch-viewer-stage">
            <span className="reference-viewer-index">
              {selectedSketch.group.dex
                ? `#${String(selectedSketch.group.dex).padStart(4, "0")}`
                : "ARCHIVE"}{" "}
              · {selectedSketch.index + 1} of {selectedSketchSheets.length}
            </span>
            <img
              src={selectedSketchSheet.src}
              alt={`${selectedSketch.group.title} ${selectedSketchSheet.title}`}
            />
            {selectedSketchSheets.length > 1 && (
              <>
                <button
                  className="reference-step previous"
                  onClick={() => moveSketch(-1)}
                  aria-label="Previous character sketch"
                >
                  ←
                </button>
                <button
                  className="reference-step next"
                  onClick={() => moveSketch(1)}
                  aria-label="Next character sketch"
                >
                  →
                </button>
              </>
            )}
          </div>
          <aside className="reference-viewer-details">
            <p className="eyebrow">
              <span /> Character sketch
            </p>
            <h2>{selectedSketch.group.title}</h2>
            <p className="reference-viewer-label">
              {selectedSketchSheet.title}
            </p>
            <p className="reference-viewer-description">
              A preserved character-design or animation-reference drawing from
              the {selectedSketchSheet.collection} collection.
            </p>
            <div className="reference-source">
              <span>Archive record</span>
              <b>{selectedSketchSheet.collection}</b>
              <p>
                {artworkRights(selectedSketchSheet).originalSource} ·{" "}
                {artworkRights(selectedSketchSheet).rightsStatus} · Displayed
                for archival and research context
              </p>
            </div>
            <p className="key-hint">
              {selectedSketchSheets.length > 1
                ? "Use ← → for another sketch · Esc to close"
                : "Esc to close"}
            </p>
          </aside>
        </div>
      )}

      {selectedDevelopment && (
        <div
          className="reference-viewer development-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedDevelopment.title} archive record`}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target)
              setSelectedDevelopment(null);
          }}
        >
          <button
            className="reference-viewer-close"
            onClick={() => setSelectedDevelopment(null)}
            aria-label="Close early development viewer"
          >
            ×
          </button>
          <div className="reference-viewer-stage development-stage">
            <span className="reference-viewer-index">
              {museumObjectType(selectedDevelopment)} ·{" "}
              {developmentResults.findIndex(
                (item) => item.id === selectedDevelopment.id,
              ) + 1}{" "}
              of {developmentResults.length}
            </span>
            <img
              src={selectedDevelopment.src}
              alt={selectedDevelopment.title}
            />
            <button
              className="reference-step previous"
              onClick={() => moveDevelopment(-1)}
              aria-label="Previous early development record"
            >
              ←
            </button>
            <button
              className="reference-step next"
              onClick={() => moveDevelopment(1)}
              aria-label="Next early development record"
            >
              →
            </button>
          </div>
          <aside className="reference-viewer-details">
            <p className="eyebrow">
              <span /> {selectedDevelopment.era || "Early development"}
            </p>
            <h2>{selectedDevelopment.title}</h2>
            <p className="reference-viewer-label">
              {museumDate(selectedDevelopment)} · {museumObjectType(selectedDevelopment)}
            </p>
            <p className="reference-viewer-description">
              {museumDescription(selectedDevelopment)}
            </p>
            <details className="provenance-verification">
              <summary>
                <span>Catalog record</span>
                <b>{museumStatus(selectedDevelopment.verificationStatus)}</b>
              </summary>
              <div>
                <p>
                  <strong>Original object</strong>
                  {selectedDevelopment.originalObject || selectedDevelopment.kind}
                </p>
                <p>
                  <strong>Creator / attribution</strong>
                  {developmentCreator(selectedDevelopment)}
                </p>
                <p>
                  <strong>Illustrator</strong>
                  {selectedDevelopment.illustrator || "Not identified"}
                </p>
                <p>
                  <strong>Organization</strong>
                  {selectedDevelopment.organization || "Not identified"}
                </p>
                <p>
                  <strong>Image source</strong>
                  {selectedDevelopment.imageSource || selectedDevelopment.sourceLabel}
                </p>
                <p>
                  <strong>Provenance</strong>
                  {selectedDevelopment.provenance || selectedDevelopment.description}
                </p>
                <p>
                  <strong>Rights status</strong>
                  {selectedDevelopment.rightsStatus || "Unverified / research required"}
                </p>
                <p>
                  <strong>Pocket Archives record</strong>
                  {selectedDevelopment.recordId || selectedDevelopment.id}
                </p>
                {selectedDevelopment.unresolvedQuestions && (
                  <p>
                    <strong>Unresolved</strong>
                    {selectedDevelopment.unresolvedQuestions}
                  </p>
                )}
              </div>
            </details>
            {!!selectedDevelopment.sourceReferences?.length && (
              <details className="provenance-verification source-register">
                <summary>
                  <span>Sources</span>
                  <b>{selectedDevelopment.sourceReferences.length}</b>
                </summary>
                <div>
                  {selectedDevelopment.sourceReferences.map((sourceId) => {
                    const source = canonicalSourceById.get(sourceId);
                    return source ? (
                      <p key={sourceId}>
                        <strong>{sourceId}</strong>
                        <a
                          href={source.url_or_location}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {source.title} ↗
                        </a>
                        <small>
                          {source.source_class} · {source.status}
                        </small>
                      </p>
                    ) : null;
                  })}
                </div>
              </details>
            )}
            <p className="key-hint">
              Use ← → for another record · Esc to close
            </p>
          </aside>
        </div>
      )}

      {tourRoom !== null && (
        <div
          className="museum-tour"
          role="dialog"
          aria-modal="true"
          aria-label={`Museum tour room ${tourRoom + 1}: ${museumRooms[tourRoom].title}`}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            museumTouchStart.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={(event) => {
            const start = museumTouchStart.current;
            museumTouchStart.current = null;
            if (!start) return;
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - start.x;
            const deltaY = touch.clientY - start.y;
            if (
              Math.abs(deltaX) > 55 &&
              Math.abs(deltaX) > Math.abs(deltaY) * 1.25
            )
              moveMuseumTour(deltaX < 0 ? 1 : -1);
          }}
        >
          <header>
            <div className="museum-wordmark">
              <span className="brand-mark">
                <img src="/pocket-archives-logo.png" alt="" />
              </span>
              <b>POCKET ARCHIVES</b>
              <small>HISTORY MUSEUM</small>
            </div>
            <div className="museum-progress-label">
              Room {String(tourRoom + 1).padStart(2, "0")} /{" "}
              {String(museumRooms.length).padStart(2, "0")}
            </div>
            <button
              onClick={() => setTourRoom(null)}
              aria-label="Exit museum tour"
            >
              ×
            </button>
          </header>
          <div
            className="museum-art museum-room-enter"
            key={`art-${museumRooms[tourRoom].id}`}
          >
            <span>{museumRooms[tourRoom].year}</span>
            <img
              src={museumRooms[tourRoom].image}
              alt={museumRooms[tourRoom].caption}
            />
            <small>{museumRooms[tourRoom].caption}</small>
          </div>
          <article
            className="museum-wall-text museum-room-enter"
            ref={museumTextRef}
            key={`text-${museumRooms[tourRoom].id}`}
          >
            <p className="eyebrow">
              <span /> {museumRooms[tourRoom].subtitle}
            </p>
            <h2>{museumRooms[tourRoom].title}</h2>
            <p className="museum-body">{museumRooms[tourRoom].body}</p>
            <ul>
              {museumRooms[tourRoom].highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
            <details className="museum-evidence">
              <summary>Evidence &amp; source</summary>
              <p>{museumRooms[tourRoom].source}</p>
              <a
                href={museumRooms[tourRoom].sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open source record ↗
              </a>
            </details>
            {inventoryForMuseum(museumRooms[tourRoom].id)
              .filter((item) => item.availabilityStatus === "available")
              .map((item) => (
                <a
                  className="museum-related-piece"
                  href={shopObjectUrl(item.slug)}
                  key={item.id}
                >
                  <span>Related piece in the shop</span>
                  <b>{item.title}</b>
                  <small>View piece ↗</small>
                </a>
              ))}
          </article>
          <nav className="museum-controls" aria-label="Museum tour navigation">
            <button
              disabled={tourRoom === 0}
              onClick={() =>
                setTourRoom((room) =>
                  room === null ? 0 : Math.max(0, room - 1),
                )
              }
            >
              ← Previous
            </button>
            <div className="museum-room-map" aria-label="Tour rooms">
              {museumRooms.map((room, index) => (
                <button
                  key={room.id}
                  className={index === tourRoom ? "active" : ""}
                  onClick={() => setTourRoom(index)}
                  aria-label={`Go to room ${index + 1}: ${room.title}`}
                  aria-current={index === tourRoom ? "step" : undefined}
                >
                  <span />
                </button>
              ))}
            </div>
            <button
              onClick={() =>
                tourRoom === museumRooms.length - 1
                  ? setTourRoom(null)
                  : setTourRoom(tourRoom + 1)
              }
            >
              {tourRoom === museumRooms.length - 1
                ? "Finish tour"
                : "Next room →"}
            </button>
          </nav>
        </div>
      )}

      {selectedPanel && (
        <div
          className="reference-viewer local-info-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={selectedPanel.title}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedPanel(null);
          }}
        >
          <button
            className="reference-viewer-close"
            onClick={() => setSelectedPanel(null)}
            aria-label="Close explanation"
          >
            ×
          </button>
          <div className="local-info-stage">
            <span>
              {selectedPanel.id.startsWith("period-")
                ? "Design period"
                : "Research note"}
            </span>
            <b>{String(selectedPanelPosition + 1).padStart(2, "0")}</b>
            <small>
              POCKET ARCHIVES
              <br />
              DESIGN MUSEUM
            </small>
          </div>
          <aside className="reference-viewer-details local-info-details">
            <p className="eyebrow">
              <span /> {selectedPanel.eyebrow}
            </p>
            <h2>{selectedPanel.title}</h2>
            <p className="reference-viewer-description">
              {selectedPanel.description}
            </p>
            <ol className="local-info-list">
              {selectedPanel.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ol>
            <div className="reference-source">
              <span>Source record</span>
              <b>{selectedPanel.source}</b>
              <p>
                This is a concise Pocket Archives summary, not a verbatim
                reproduction.
              </p>
            </div>
            <nav
              className="local-info-controls"
              aria-label="Move through museum reading rooms"
            >
              <button
                disabled={selectedPanelPosition <= 0}
                onClick={() => moveMuseumPanel(-1)}
              >
                ← Previous room
              </button>
              <span>
                {String(selectedPanelPosition + 1).padStart(2, "0")} /{" "}
                {String(museumReadingSequence.length).padStart(2, "0")}
              </span>
              <button
                disabled={
                  selectedPanelPosition >= museumReadingSequence.length - 1
                }
                onClick={() => moveMuseumPanel(1)}
              >
                Next room →
              </button>
            </nav>
            <p className="key-hint">
              Use ← → to walk through the exhibition · Esc to close
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}

function LandingPage() {
  const ebayPreviewListings = [
    {
      title: "Hypno",
      details: "Bandai Carddass File No.097 · 1997 · NM",
      price: "$12.99",
      image: "/shop/inventory/batch-01/pa-0014-front.jpg",
      href: "https://www.ebay.com/itm/Pokemon-Hypno-File-No-097-Carddass-Bandai-Japanese-1997-NM-/158192969141",
    },
    {
      title: "Slowbro",
      details: "Bandai Carddass File No.080 · 1997 · NM",
      price: "$15.99",
      image: "/shop/inventory/batch-01/pa-0015-front.jpg",
      href: "https://www.ebay.com/itm/Pokemon-Slowbro-File-No-080-Carddass-Bandai-Japanese-1997-NM-/158192971036",
    },
    {
      title: "Kangaskhan",
      details: "Jungle 21/64 · 1999 · MP",
      price: "$3.49",
      image: "/shop/inventory/batch-04/pa-0034-front.jpg",
      href: "https://www.ebay.com/itm/Pokemon-Kangaskhan-21-64-Jungle-1999-WOTC-Non-Holo-MP-/158195564640",
    },
    {
      title: "Magby",
      details: "Neo Genesis 23/111 · 2000 · MP",
      price: "$3.49",
      image: "/shop/inventory/batch-04/pa-0033-front.jpg",
      href: "https://www.ebay.com/itm/Pokemon-Magby-23-111-Neo-Genesis-2000-WOTC-Unlimited-MP-/158195564641",
    },
  ];

  return (
    <main className="landing-page">
      <header className="landing-header">
        <a className="brand" href="/" aria-label="Pocket Archives home">
          <span className="brand-mark">
            <img src="/pocket-archives-logo.png" alt="" />
          </span>
          <span>
            POCKET
            <br />
            ARCHIVES
            <small>Cards, art, and collecting history</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/shop">Curated shop</a>
          <a className="landing-shop-link" href={EXTERNAL_SHOP_URL}>
            Cards on eBay <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">
            <span /> Independent collectibles shop
          </p>
          <h1>
            Vintage cards.
            <br />
            <em>New finds.</em>
          </h1>
          <p>
            Singles on eBay. Collections and rare finds here.
          </p>
          <div className="landing-actions">
            <a className="landing-primary" href={EXTERNAL_SHOP_URL}>
              Browse cards on eBay <span>↗</span>
            </a>
            <a className="landing-secondary" href="/shop">
              Visit the curated shop →
            </a>
          </div>
        </div>

        <div className="landing-art landing-editorial-collage" aria-label="Selected artwork across collecting history">
          <div className="landing-art-link">
            <figure className="landing-art-piece landing-art-sugimori">
              <img
                src="/hero/pokemon-rgb-sugimori-watercolor.jpg"
                alt="Early Pokémon watercolor artwork featuring Red, Blue, Pikachu, and Charizard"
              />
              <figcaption>
                <span>Red, Green &amp; Blue era</span>
                <b>Early Pokémon watercolor · Ken Sugimori</b>
              </figcaption>
            </figure>
          </div>
          <div className="landing-art-link">
            <figure className="landing-art-piece landing-art-magic">
              <img
                src="/hero/mtg-shivan-dragon-alpha.jpg"
                alt="Shivan Dragon artwork by Melissa A. Benson"
              />
              <figcaption>
                <span>1993 · Magic: The Gathering</span>
                <b>Shivan Dragon · Melissa A. Benson</b>
              </figcaption>
            </figure>
          </div>
          <div className="landing-art-link">
            <figure className="landing-art-piece landing-art-yugioh">
              <img
                src="/hero/yugioh-duel-art-kazuki-takahashi.jpg"
                alt="Yu-Gi-Oh color illustration of Yugi by series creator Kazuki Takahashi"
              />
              <figcaption>
                <span>1996 onward · Yu-Gi-Oh!</span>
                <b>Creator illustration · Kazuki Takahashi</b>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="landing-shop-callout">
        <div className="landing-shop-callout-head">
          <div>
            <small>Individual cards</small>
            <h2>Singles are on eBay.</h2>
          </div>
          <a href={EXTERNAL_SHOP_URL}>View all on eBay ↗</a>
        </div>
        <div className="landing-ebay-preview" aria-label="Selected eBay listings">
          {ebayPreviewListings.map((listing) => (
            <a href={listing.href} key={listing.href}>
              <span className="landing-ebay-image">
                <img src={listing.image} alt={`${listing.title} card`} loading="lazy" />
                <small>View on eBay ↗</small>
              </span>
              <span className="landing-ebay-details">
                <b>{listing.title}</b>
                <em>{listing.details}</em>
                <strong>{listing.price}</strong>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="landing-archive-preview" aria-labelledby="landing-archive-title">
        <div className="landing-archive-lead">
          <p className="eyebrow">
            <span /> The website shop
          </p>
          <h2 id="landing-archive-title">Collected with purpose.</h2>
          <a href="/shop">Enter the curated shop →</a>
        </div>
        <div className="landing-archive-cards">
          <a href="/shop#collections">
            <img
              src="/hero/pokemon-rgb-sugimori-watercolor.jpg"
              alt="Early Pokémon watercolor artwork by Ken Sugimori"
              loading="lazy"
            />
            <span>
              <small>Grouped with purpose</small>
              <b>Curated collections</b>
              <em>Artists, characters, eras.</em>
            </span>
          </a>
          <a href="/shop#gallery">
            <img
              src="/hero/mtg-shivan-dragon-alpha.jpg"
              alt="Shivan Dragon artwork by Melissa A. Benson"
              loading="lazy"
            />
            <span>
              <small>Paper culture</small>
              <b>Ephemera &amp; print</b>
              <em>Postcards, inserts, magazines.</em>
            </span>
          </a>
          <a href="/shop#gallery">
            <img
              src="/hero/sorcery-melissa-benson.jpg"
              alt="Traditional fantasy artwork presented by Sorcery"
              loading="lazy"
            />
            <span>
              <small>Chosen individually</small>
              <b>Vintage highlights</b>
              <em>Older pieces worth a closer look.</em>
            </span>
          </a>
        </div>
      </section>

      <footer className="landing-footer">
        <div>
          <b>Pocket Archives LLC</b>
          <span>Independent collectibles shop</span>
        </div>
        <p>
          Pocket Archives is an independent business. All product names,
          characters, and trademarks belong to their respective owners.
        </p>
      </footer>
    </main>
  );
}

export default function Home() {
  return <LandingPage />;
}
