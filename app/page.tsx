"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PokemonArt = {
  id: string; title: string; dex: number | null; generation: number | null;
  category: "generation" | "alternate" | "design"; collection: string; src: string;
};

type PokemonGroup = {
  key: string; dex: number | null; title: string; generation: number;
  representative: PokemonArt; items: PokemonArt[];
};

type PokemonDetails = {
  genus: string; description: string; types: string[]; height: number;
  weight: number; habitat: string | null; legendary: boolean; mythical: boolean;
};

type TcgCard = {
  id: string; name: string; artist?: string; rarity?: string; number: string;
  set: { name: string; series: string; releaseDate: string };
  images: { small: string; large: string };
};

type SetteiGroup = {
  dex: number; name: string; links: { label: string; url: string }[];
};

type ReferenceSelection = { group: SetteiGroup; index: number };

type DevelopmentItem = {
  id: string; year: number; title: string; kind: string; src: string;
  credit: string; sourceUrl: string; sourceLabel: string; description: string;
};

type ArchivePanel = {
  id: string; eyebrow: string; title: string; description: string;
  details: string[]; source: string;
};

type MuseumRoom = {
  year: string; title: string; subtitle: string; image: string; caption: string;
  body: string; highlights: string[]; source: string;
};

const coreDevelopmentArchive: DevelopmentItem[] = [
  { id: "capumon-map", year: 1990, title: "Capsule Monsters world study", kind: "Original concept document", src: "https://helixchamber.com/wp-content/uploads/2018/09/1990_Capsule_Monsters_00_map_reg.png", credit: "Satoshi Tajiri & Ken Sugimori / Game Freak", sourceUrl: "https://helixchamber.com/2018/09/10/pack-monsters-world/", sourceLabel: "Helix Chamber research archive", description: "An early map and world-building study from the Capsule Monsters pitch period, before the Pokémon name was finalized." },
  { id: "capumon-catalog", year: 1990, title: "Capsule Monsters creature catalog", kind: "Prototype sprite compilation", src: "https://helixchamber.com/wp-content/uploads/2018/12/CAPUMON_SPRITESHEET2_final.png", credit: "Game Freak source assets / Helix Chamber assembly", sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/", sourceLabel: "Helix Chamber prototype archive", description: "A research plate assembling early creature assets associated with the Capsule Monsters and early Red/Green development period." },
  { id: "capumon-sprites", year: 1990, title: "Early Capumon sprite plate", kind: "Prototype sprite compilation", src: "https://helixchamber.com/wp-content/uploads/2018/08/Capumon_sprites_clean_xsmall_propo-250x300.jpg", credit: "Game Freak source assets / Helix Chamber assembly", sourceUrl: "https://helixchamber.com/2018/08/11/index-list/", sourceLabel: "Helix Chamber research archive", description: "A proportional overview of early monster sprites, including designs that changed substantially or were removed before release." },
  { id: "early-kanto-1", year: 1995, title: "Early Kanto prototype index I", kind: "Extracted prototype assets", src: "https://helixchamber.com/wp-content/uploads/2019/02/early_kanto.png", credit: "Game Freak prototype data / Helix Chamber documentation", sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/", sourceLabel: "Helix Chamber prototype archive", description: "Documented early Red/Green assets and surviving back sprites. These are game-development artifacts, not finished Sugimori illustrations." },
  { id: "early-kanto-2", year: 1995, title: "Early Kanto prototype index II", kind: "Extracted prototype assets", src: "https://helixchamber.com/wp-content/uploads/2019/02/early_kanto_2.png", credit: "Game Freak prototype data / Helix Chamber documentation", sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/", sourceLabel: "Helix Chamber prototype archive", description: "The second documented plate of early Kanto-era prototype material, including cut and revised creature designs." },
  { id: "prototype-periods", year: 1995, title: "Red & Green development timeline", kind: "Research chronology", src: "https://helixchamber.com/wp-content/uploads/2019/02/periodization201902.png", credit: "Helix Chamber research presentation", sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/", sourceLabel: "Helix Chamber prototype archive", description: "A visual chronology used to distinguish different periods of the long Red/Green development process." },
  { id: "map-comparison", year: 1995, title: "Early map document comparison", kind: "Development-document comparison", src: "https://helixchamber.com/wp-content/uploads/2019/02/MapPageCompare.png", credit: "Game Freak source material / Helix Chamber comparison", sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/", sourceLabel: "Helix Chamber prototype archive", description: "A comparison of surviving early planning material used to establish the order of Red/Green development assets." },
  { id: "zukan-comparison", year: 1995, title: "Early monster index comparison", kind: "Development-document comparison", src: "https://helixchamber.com/wp-content/uploads/2019/02/ZukanCompare.png", credit: "Game Freak source material / Helix Chamber comparison", sourceUrl: "https://helixchamber.com/2019/02/16/what-dreams-may-come/", sourceLabel: "Helix Chamber prototype archive", description: "A comparison plate connecting prototype monster-index evidence with later documented material." },
];

const redditConceptFiles = [
  ["3BIfe.jpg", "Capsule Monsters forest concept"], ["uJZYG.jpg", "Capsule Monsters planning spread"], ["eVFiz.jpg", "A Man Who Created Pokémon source-book view"], ["mPddl.jpg", "Early creature studies"], ["Cz0dP.jpg", "Capsule Monsters planning forms"], ["QcPUq.jpg", "Early capture and item concept"], ["ZAQnI.jpg", "Early town and environment studies"], ["ta7Ec.jpg", "Early shop and field scenes"], ["7xVCR.jpg", "Early game comic advertisement"], ["rZ8VJ.jpg", "Early promotional battle poster"], ["0eXLv.jpg", "Early trainer ensemble illustration"], ["mr195.jpg", "Prototype battle mockup I"], ["PVlMl.jpg", "Prototype battle mockup II"], ["LroBZ.jpg", "Capsule Monsters title and map page"], ["8WJLE.jpg", "A Man Who Created Pokémon cover"],
] as const;

const redditPrototypeFiles = ["yBqcU.png", "LgBLU.png", "5v9fA.png", "ZUVJ3.png", "cvxfT.png", "ILMPd.png", "2ySLi.png", "ScUVE.png", "foAmN.png", "qeJxV.jpg", "bXT63.jpg", "OymIn.png", "iC9tj.png", "cJ8Q3.png"] as const;
const redditSpriteFiles = ["ckCvm.png", "VIZ5p.png", "oHFn6.png", "2xV1F.png", "exbEq.png", "v0x9S.png"] as const;
const carddassArchiveFiles = ["H5fmv.jpg", "gsD2M.jpg", "F5o5r.jpg", "uvGv5.jpg", "KSh4s.jpg", "HlIEJ.jpg", "spml0.jpg", "i82hd.jpg", "8oC4o.jpg", "yi13Z.jpg", "LiYLv.jpg", "q7BfC.jpg", "ZXovn.jpg", "sathh.jpg", "WUH15.jpg", "RPDkl.jpg", "xsyN9.jpg"] as const;

const redditDevelopmentArchive: DevelopmentItem[] = [
  ...redditConceptFiles.map(([file, title], index) => ({ id: `reddit-concept-${index + 1}`, year: 1990, title, kind: index === 2 || index === 14 ? "Source-book documentation of 1990 material" : "Early concept archive scan", src: `https://i.imgur.com/${file}`, credit: "Satoshi Tajiri & Ken Sugimori / Game Freak source material", sourceUrl: "https://imgur.com/a/7HzFR", sourceLabel: "Imgur album preserved through the linked Reddit thread", description: index === 2 || index === 14 ? "Documentation from the 2004 book Satoshi Tajiri: A Man Who Created Pokémon, one of the sources through which the 1990 development images circulated." : "A scan or photograph of early Pokémon development material collected in the Reddit thread’s primary Imgur album. The gallery preserves the source order and does not treat later photography as a new original artwork." })),
  ...redditPrototypeFiles.map((file, index) => ({ id: `reddit-prototype-${index + 1}`, year: 1997, title: `Prototype artwork plate ${String(index + 1).padStart(2, "0")}`, kind: "Community-preserved prototype image", src: `https://i.imgur.com/${file}`, credit: "Game Freak development material / exact individual credit unverified", sourceUrl: "https://imgur.com/a/GlGrp", sourceLabel: "Prototype-art Imgur album linked by the Reddit poster", description: "An early or prototype Pokémon image preserved in the linked album. Because the album does not provide item-level dates or credits, Pocket Archives labels it as community-preserved rather than assigning an unsupported artist attribution." })),
  ...redditSpriteFiles.map((file, index) => ({ id: `reddit-beta-sprite-${index + 1}`, year: 1997, title: `Beta sprite specimen ${String(index + 1).padStart(2, "0")}`, kind: "Extracted beta sprite", src: `https://i.imgur.com/${file}`, credit: "Game Freak prototype data / individual sprite artist unverified", sourceUrl: "https://imgur.com/a/Go7E0", sourceLabel: "Beta-sprite Imgur album linked by the Reddit poster", description: "A surviving beta sprite from the linked album. The duplicate Kabuto image shared with the prototype-art album has been included only once." })),
  ...carddassArchiveFiles.map((file, index) => ({ id: `carddass-action-${index + 1}`, year: 1997, title: `Carddass action archive sheet ${String(index + 1).padStart(2, "0")}`, kind: "Carddass Part 3 & 4 illustration sheet", src: `https://i.imgur.com/${file}`, credit: "Ken Sugimori / Bandai Carddass", sourceUrl: "https://imgur.com/a/HOPoK", sourceLabel: "151-Pokémon action-art Imgur album linked through the Reddit discussion", description: "A preserved sheet of the 1997 Bandai Carddass Part 3 & 4 illustrations, which depict the original 151 Pokémon performing signature moves. These are release-era licensed illustrations, not beta designs." })),
];

const developmentArchive: DevelopmentItem[] = [...coreDevelopmentArchive, ...redditDevelopmentArchive].sort((a, b) => a.year - b.year);

const referenceResources = [
  { title: "Pokémon settei directory", eyebrow: "402 Pokémon", description: "The complete PS Art Room index of official production model sheets, expressions, poses, movement cycles, and alternate forms.", url: "https://psartroom.weebly.com/setteis.html", keywords: "pokemon settei model sheets sketches poses expressions walk run cycles" },
  { title: "General references", eyebrow: "Poses & motion", description: "Human pose tools, animal movement studies, drawing references, and file-format guidance collected for artists.", url: "https://psartroom.weebly.com/references.html", keywords: "references posemaniacs animals bat cat deer dog dragon horse wolf motion" },
  { title: "Color tools", eyebrow: "Palette lab", description: "A compact collection of palette, contrast, color-scheme, and accessibility tools for building stronger artwork.", url: "https://psartroom.weebly.com/color-tools.html", keywords: "color palette contrast scheme tools" },
  { title: "Digital art tutorials", eyebrow: "Technique", description: "Tutorial links covering digital painting, linework, shading, backgrounds, animation, and workflow.", url: "https://psartroom.weebly.com/digital-art-tutorials.html", keywords: "digital art tutorials painting linework shading background animation" },
  { title: "Traditional art tutorials", eyebrow: "Paper & paint", description: "Traditional drawing and painting lessons gathered by the PS Art Room community.", url: "https://psartroom.weebly.com/art-tutorials.html", keywords: "traditional art tutorials drawing painting paper" },
  { title: "Art programs", eyebrow: "Creative tools", description: "A guide to free and paid programs for illustration, animation, pixel art, and image editing.", url: "https://psartroom.weebly.com/art-programs.html", keywords: "art programs software illustration animation pixel editing" },
];

const helixResearchPanels: ArchivePanel[] = [
  { id: "helix-evidence", eyebrow: "How to read the archive", title: "What actually survived?", description: "The 2019 Helix Chamber analysis worked from a limited package of prototype assets rather than a playable development ROM.", details: ["Most cut Pokémon survived only as back sprites, so their fronts and exact inspirations cannot always be reconstructed with certainty.", "Names, cries, internal index positions, evolution tables, movesets, manga material, and broadcast footage can corroborate an identity—but they do not all come from the same development moment.", "Pocket Archives keeps extracted material, documented drawings, research diagrams, and fan interpretation in separate categories."], source: "Paraphrased from Helix Chamber, “What Dreams May Come” (2019)." },
  { id: "helix-missingno", eyebrow: "Prototype evidence", title: "The MissingNo. slots", description: "Some MissingNo. positions appear to be the remains of creatures deleted or overwritten during Red and Green’s long development.", details: ["The recovered material helped identify many cut creatures, while three slots remained unidentified in the article’s accounting.", "Recognizable examples include Gyaoon, the deer-like design, Crocky, a cactus creature, a Zubat pre-evolution, and several unfinished evolutionary families.", "A back sprite is evidence of a design’s presence, but not necessarily proof of its final name, type, front view, or relationship to later Pokémon."], source: "Helix Chamber prototype-data analysis; identities and relationships remain theories where the source evidence is incomplete." },
  { id: "helix-evolutions", eyebrow: "Cut family trees", title: "Evolution lines changed constantly", description: "The prototype tables reveal a much less settled set of evolutionary families than the final 151 suggest.", details: ["Evidence points to Gorochu after Raichu, a distinct final evolution for Wartortle, and a middle evolution between Psyduck and Golduck.", "Early pre-evolutions appear for Meowth, Vulpix, Zubat, and other species; Kotora’s line seems to have once contained three stages.", "Some families were cut for reasons the files do not state. Balance, redundancy, schedule, and redesign are possibilities—not confirmed explanations."], source: "Summary of the evolution tables and sprite discussion documented by Helix Chamber." },
  { id: "helix-trainers", eyebrow: "People of early Kanto", title: "Trainers and NPCs", description: "The files also preserve an alternate human cast, internally associated with the term “dealers,” plus rougher forms of familiar characters.", details: ["An early protagonist called Yuuichi, a cartoony Red back sprite, and a rough female Student design show how the player-facing art evolved.", "Cut classes include the robot-like Shinjuku Jack, a Firefighter, and a Silph Chief whose planned story role is unknown.", "Early Gym figures such as Yujirou and Ichitarou suggest the order and identity of Kanto’s leaders changed substantially."], source: "Paraphrased from Helix Chamber’s trainer and overworld-NPC sections." },
  { id: "helix-cries", eyebrow: "Sound archaeology", title: "Cries began with kaiju", description: "An early cry list suggests that Pokémon’s sound system was deeply shaped by the distinctive monster roars of Japanese kaiju media.", details: ["Several early cry labels echo Ultraman creatures, while later entries use early Pokémon names such as Gagarth for Rhydon and Wing for Arcanine.", "The list’s order differs from the final game and may reflect when sounds were created rather than the final internal Pokédex sequence.", "Shared and reassigned cries can help connect deleted slots to surviving species, but they rarely establish an identity on their own."], source: "Summary of Helix Chamber’s alternate cry-list analysis." },
  { id: "helix-moves", eyebrow: "Rules before release", title: "Moves and evolution worked differently", description: "Multiple prototype tables preserve an oversized and shifting battle system before it was reduced for release.", details: ["The unfinished learnset data reaches move number 237, compared with 165 moves in the final Generation I games.", "Early names include Hydro Jet, Star Freeze, Mega Fire, and concepts later reused under different names.", "The surviving table is heavily level-based. Helix Chamber inferred that evolution may once have been mandatory because many species learned nothing after their evolution level."], source: "Paraphrased from the move-name, effect, evolution, and moveset tables discussed by Helix Chamber." },
  { id: "helix-maps", eyebrow: "Building Kanto", title: "The map grew from an RPG skeleton", description: "Prototype maps show Kanto developing from sparse, traditional RPG layouts into the recognizable cities of the final games.", details: ["Early route numbers were literally placed in terrain as templates, while towns had few distinguishing landmarks.", "Later maps used placeholders for major buildings, including crude stand-ins for Silph Co. and the Celadon Department Store.", "The article reports donor testimony that Silph Co. once hosted a larger Pokémon League concept before the idea moved to Indigo Plateau; Pocket Archives treats that claim as reported context, not settled proof."], source: "Summary of the map section in Helix Chamber’s 2019 article." },
];

const internalListPanels: ArchivePanel[] = [
  { id: "period-1", eyebrow: "Period 1 · Earliest designs", title: "The original Capumon", description: "The first cluster centers on kaiju-like creatures, dinosaurian bodies, childhood heroes, and familiar role-playing-game archetypes.", details: ["Rhydon’s internal ID of 001 reflects its place as the earliest confirmed Pokémon design.", "These monsters established the franchise’s initial scale: powerful creatures controlled by people through capsule-like objects.", "The early visual vocabulary leaned more toward monsters and kaiju than the balanced ecosystem of the final games."], source: "Helix Chamber’s internal-list periodization · Period 1" },
  { id: "period-2", eyebrow: "Period 2 · Building a battle system", title: "Types and real animals", description: "As additional designers joined, the roster expanded into elemental types and creatures inspired more directly by real-world animals.", details: ["This period appears to test whether the battle system could support a diverse type ecosystem.", "Design batches contain patterns that help researchers estimate where missing creatures may once have appeared.", "Pattern recognition is evidence for a hypothesis—not definitive identification of every MissingNo. slot."], source: "Helix Chamber’s internal-list periodization · Period 2" },
  { id: "period-3", eyebrow: "Period 3 · A broader emotional range", title: "Cute Pokémon and evolution", description: "Atsuko Nishida’s arrival coincides with a stronger emphasis on cute designs and a major expansion of evolutionary structure.", details: ["Two- and three-stage families became a more important organizing idea.", "Stone evolutions, split evolution concepts, and additional elemental creatures widened the system.", "Pokémon’s identity was shifting from a kaiju roster toward a world with varied personalities and relationships."], source: "Helix Chamber’s internal-list periodization · Period 3" },
  { id: "period-4", eyebrow: "Period 4 · Connecting the roster", title: "New evolutionary relatives", description: "This period added relatives to creatures designed earlier, reshaping isolated monsters into more coherent families.", details: ["Pre-evolutions, middle stages, and final evolutions could be introduced long after a base design.", "Some of these relationships were removed before release; others may have influenced later generations.", "Internal order therefore records creative sequence more clearly than the final National Pokédex order."], source: "Helix Chamber’s internal-list periodization · Period 4" },
  { id: "period-5", eyebrow: "Period 5 · Toward the final game", title: "The eclectic final wave", description: "The last broad group is the most varied, combining ordinary two-stage families, stone evolutions, unusual one-offs, and finally the starters.", details: ["Bulbasaur, Charmander, and Squirtle arrived surprisingly late in the internal sequence.", "Late additions helped balance types and shape the opening experience players would actually encounter.", "The roster was still being edited until close to debugging, leaving 39 unused slots among the 190 internal positions."], source: "Helix Chamber’s internal-list periodization · Period 5" },
];

const museumRooms: MuseumRoom[] = [
  { year: "1990", title: "Before Pokémon", subtitle: "The Capsule Monsters pitch", image: "https://helixchamber.com/wp-content/uploads/2018/09/1990_Capsule_Monsters_00_map_reg.png", caption: "Capsule Monsters world study", body: "Satoshi Tajiri’s creature-collecting idea began as Capsule Monsters. Ken Sugimori’s drawings helped turn an abstract game pitch into a believable world of trainers, creatures, capsules, shops, routes, and battles.", highlights: ["The concept drew on Tajiri’s childhood interest in collecting insects.", "The capsule idea made fantastic creatures feel portable, tradable, and personal.", "Several early creatures and world concepts remained recognizable years later."], source: "Game Freak development material · Capsule Monsters research archives" },
  { year: "1990", title: "Inventing a world", subtitle: "Maps, shops, and everyday life", image: "https://i.imgur.com/ZAQnI.jpg", caption: "Early town and environment studies", body: "The earliest drawings were not only monster designs. They explored what it would mean to live alongside them: traveling between towns, purchasing supplies, meeting other trainers, and navigating a world built around human–creature relationships.", highlights: ["Early Kanto had the visual grammar of a traditional Japanese role-playing game.", "Environmental sketches established scale before the Game Boy maps were finalized.", "The social world of Pokémon was present from the beginning."], source: "Early development scans preserved through the 2011 Reddit/Imgur collection" },
  { year: "1990–1995", title: "Drawing the creatures", subtitle: "Kaiju, animals, and readable silhouettes", image: "https://helixchamber.com/wp-content/uploads/2018/12/CAPUMON_SPRITESHEET2_final.png", caption: "Research assembly of early creature assets", body: "The design language mixed animals, folklore, toys, and Japanese kaiju. Strong silhouettes mattered because every idea ultimately had to survive as a tiny monochrome Game Boy sprite.", highlights: ["Rhydon and other early designs carry especially strong kaiju influence.", "Front art, back sprites, cries, and names evolved at different moments.", "A familiar final Pokémon may hide several abandoned design stages."], source: "Game Freak source assets · Helix Chamber research presentation" },
  { year: "1995", title: "The creatures that vanished", subtitle: "Prototype data and MissingNo.", image: "https://helixchamber.com/wp-content/uploads/2019/02/early_kanto.png", caption: "Early Kanto prototype index", body: "Deleted slots, surviving back sprites, cries, names, and evolution tables reveal a much larger and less stable roster. MissingNo. is not one secret Pokémon; some of its data positions are scars left by designs that were removed or overwritten.", highlights: ["Many recovered creatures survive only as back sprites.", "Gorochu, a Wartortle evolution, and a Psyduck middle evolution appear in prototype evidence.", "Uncertain reconstructions must remain separate from raw surviving assets."], source: "Helix Chamber’s 2019 analysis of Red and Green prototype data" },
  { year: "1996", title: "A public visual identity", subtitle: "The Red & Green watercolors", image: "/art/0348.webp", caption: "Bulbasaur · Pokémon Red and Green artwork", body: "When Pokémon reached the public, Sugimori’s watercolor artwork gave the limited sprites texture, attitude, anatomy, and color. This release-era visual language became one of the franchise’s defining looks.", highlights: ["The artwork expanded what the Game Boy screen could communicate.", "Loose ink and watercolor made the creatures feel organic rather than mechanically perfect.", "The complete Red & Green set already lives in each Pokémon’s alternate-art gallery."], source: "Ken Sugimori · Pokémon Red and Green release artwork" },
  { year: "1997", title: "Pokémon in motion", subtitle: "Carddass Part 3 & 4", image: "https://i.imgur.com/H5fmv.jpg", caption: "Carddass action-illustration archive sheet", body: "Bandai’s Carddass Part 3 & 4 commissioned a new action illustration for every original Pokémon. Signature moves, opponents, and dramatic poses transformed static character designs into personalities caught mid-story.", highlights: ["All 151 Pokémon were shown using characteristic moves.", "The images predate much of the globally familiar anime-era visual language.", "These are licensed release artwork—not beta designs."], source: "Ken Sugimori · Bandai Carddass Part 3 & 4" },
  { year: "1997", title: "A second generation takes shape", subtitle: "Space World and revised families", image: "https://i.imgur.com/ScUVE.png", caption: "Community-preserved prototype artwork", body: "The 1997 Space World material shows that Johto’s roster was once dramatically different. Some creatures disappeared, some evolved into familiar designs, and some ideas resurfaced generations later in altered forms.", highlights: ["Prototype evidence records design direction, not a single finished canon.", "Family trees, colors, names, and silhouettes all remained negotiable.", "Each beta image is labeled cautiously when its exact date or artist is undocumented."], source: "Community-preserved prototype material · Space World research records" },
  { year: "1997–present", title: "Keeping a world consistent", subtitle: "Settei and production design", image: "/art/0005.webp", caption: "Metagross animation reference sheet", body: "As Pokémon expanded into animation and thousands of episodes, production sheets became the quiet infrastructure of consistency. They explain proportions, expressions, motion, poses, and details that finished promotional artwork cannot show.", highlights: ["Settei are working documents made for production teams.", "A sheet’s individual artist is often not identified in the surviving file.", "Pocket Archives separates production reference, character artwork, forms, and historical prototypes."], source: "Anime production references · supplied archive and PS Art Room index" },
];

const PAGE_SIZE = 72;
const secureReferenceHosts = new Set(["psartroom.weebly.com", "i.imgur.com", "31.media.tumblr.com", "37.media.tumblr.com", "38.media.tumblr.com", "33.media.tumblr.com", "25.media.tumblr.com", "24.media.tumblr.com", "i288.photobucket.com", "i19.photobucket.com", "i6.photobucket.com", "i5.photobucket.com", "i68.photobucket.com", "img.photobucket.com", "smg.photobucket.com", "rubberslug.s3.amazonaws.com", "ic.pics.livejournal.com", "www.pokewiki.de", "thesunnyclearing.weebly.com", "caffwin.weebly.com", "spiritofmetal.weebly.com", "lilycove.weebly.com", "olivine.weebly.com", "pikapalace.weebly.com", "bulbapedia.bulbagarden.net", "sketchfab.com", "www.google.com"]);
const generationRoman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
const generationRegions = ["Special collections", "Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos", "Alola", "Galar & Hisui", "Paldea"];
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
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function referenceDestination(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" && secureReferenceHosts.has(url.hostname)) url.protocol = "https:";
    return url.toString();
  } catch {
    return value;
  }
}

function referenceProvenance(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const archived = host === "web.archive.org" || value.includes("web.archive.org/web/");
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
    const label = labels[host] || (host.includes("tumblr.com") ? "Tumblr community mirror" : host.includes("photobucket.com") ? "Photobucket community mirror" : host.includes("weebly.com") ? "Community reference archive" : host);
    return { label, host, archived };
  } catch {
    return { label: "Source recorded by PS Art Room", host: "Unknown host", archived: false };
  }
}

export default function Home() {
  const [art, setArt] = useState<PokemonArt[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("dex");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<PokemonArt | null>(null);
  const [details, setDetails] = useState<PokemonDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [variantView, setVariantView] = useState<"forms" | "artwork" | "design" | "cards">("forms");
  const [cards, setCards] = useState<TcgCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TcgCard | null>(null);
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");
  const [view, setView] = useState<"gallery" | "references" | "museum" | "favorites">("references");
  const [archiveSection, setArchiveSection] = useState<"alpha" | "sketches" | "references" | "resources">("alpha");
  const [setteiDirectory, setSetteiDirectory] = useState<SetteiGroup[]>([]);
  const [selectedReference, setSelectedReference] = useState<ReferenceSelection | null>(null);
  const [selectedDevelopment, setSelectedDevelopment] = useState<DevelopmentItem | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<ArchivePanel | null>(null);
  const [tourRoom, setTourRoom] = useState<number | null>(null);
  const [referenceImageError, setReferenceImageError] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/data/pokemon.json").then((response) => response.json()).then(setArt);
    fetch("/data/settei-links.json").then((response) => response.json()).then(setSetteiDirectory);
    const saved = localStorage.getItem("pocket-archive-favorite-species");
    if (saved) setFavorites(new Set(JSON.parse(saved)));
    const savedDisplay = localStorage.getItem("pocket-archive-display");
    if (savedDisplay === "list") setDisplayMode("list");
  }, []);

  useEffect(() => {
    const syncPageFromHash = () => {
      const generationMatch = window.location.hash.match(/^#gen-([1-9])$/);
      if (generationMatch) {
        setView("gallery");
        setFilter(`gen-${generationMatch[1]}`);
        requestAnimationFrame(() => document.querySelector("#collection")?.scrollIntoView());
      } else if (window.location.hash === "#references" || window.location.hash === "#archive") {
        setView("references");
        setFilter("all");
        requestAnimationFrame(() => document.querySelector("#collection")?.scrollIntoView());
      } else if (window.location.hash === "#museum") {
        setView("museum");
        setFilter("all");
        requestAnimationFrame(() => document.querySelector("#collection")?.scrollIntoView());
      } else if (window.location.hash === "#favorites") {
        setView("favorites");
        setFilter("all");
        requestAnimationFrame(() => document.querySelector("#collection")?.scrollIntoView());
      } else if (window.location.hash === "#collection" || window.location.hash === "#pokedex") {
        setView("gallery");
        setFilter("all");
      }
    };
    syncPageFromHash();
    window.addEventListener("hashchange", syncPageFromHash);
    window.addEventListener("popstate", syncPageFromHash);
    return () => { window.removeEventListener("hashchange", syncPageFromHash); window.removeEventListener("popstate", syncPageFromHash); };
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, PokemonArt[]>();
    art.forEach((item) => {
      const key = groupKey(item);
      map.set(key, [...(map.get(key) || []), item]);
    });
    return [...map.entries()].map(([key, items]) => {
      const ordered = [...items].sort((a, b) => {
        const aCore = a.category === "generation" && a.collection.startsWith("Generation") ? 0 : 1;
        const bCore = b.category === "generation" && b.collection.startsWith("Generation") ? 0 : 1;
        return aCore - bCore || a.title.length - b.title.length || a.title.localeCompare(b.title);
      });
      const representative = ordered[0];
      return { key, dex: representative.dex, title: representative.title, generation: generationFor(representative), representative, items: ordered };
    });
  }, [art]);

  const groupMap = useMemo(() => new Map(groups.map((group) => [group.key, group])), [groups]);
  const selectedGroup = selected ? groupMap.get(groupKey(selected)) || null : null;
  const selectedForms = selectedGroup?.items.filter((item) => item.category === "generation") || [];
  const selectedArtwork = selectedGroup?.items.filter((item) => item.category === "alternate") || [];
  const selectedDesign = selectedGroup?.items.filter((item) => item.category === "design") || [];
  const shownVariants = variantView === "forms" ? selectedForms : variantView === "design" ? selectedDesign : selectedArtwork;

  useEffect(() => {
    if (!selectedGroup) return;
    setVariantView(selected?.category === "design" ? "design" : selected?.category === "alternate" ? "artwork" : selectedGroup.items.some((item) => item.category === "generation") ? "forms" : "artwork");
    setCards([]);
    setSelectedCard(null);
    setCardsError(false);
  }, [selectedGroup?.key]);

  useEffect(() => {
    if (variantView !== "cards" || !selectedGroup?.dex || cards.length || cardsLoading) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      q: `nationalPokedexNumbers:${selectedGroup.dex}`,
      pageSize: "250",
      orderBy: "-set.releaseDate,number",
      select: "id,name,artist,rarity,number,set,images",
    });
    setCardsLoading(true);
    setCardsError(false);
    fetch(`https://api.pokemontcg.io/v2/cards?${params}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Card lookup failed"); return response.json(); })
      .then((payload) => { setCards(payload.data || []); setSelectedCard(payload.data?.[0] || null); })
      .catch((error) => { if (error.name !== "AbortError") setCardsError(true); })
      .finally(() => setCardsLoading(false));
    return () => controller.abort();
  }, [variantView, selectedGroup?.dex, cards.length]);

  useEffect(() => {
    if (!selectedGroup?.dex) { setDetails(null); return; }
    const controller = new AbortController();
    setDetailsLoading(true);
    setDetails(null);
    Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${selectedGroup.dex}`, { signal: controller.signal }).then((response) => response.json()),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${selectedGroup.dex}`, { signal: controller.signal }).then((response) => response.json()),
    ]).then(([pokemon, species]) => {
      const englishDescriptions = species.flavor_text_entries.filter((entry: { language: { name: string } }) => entry.language.name === "en");
      const description = englishDescriptions.at(-1)?.flavor_text.replace(/[\n\f]/g, " ").replace(/\s+/g, " ") || "No Pokédex entry available.";
      const genus = species.genera.find((entry: { language: { name: string } }) => entry.language.name === "en")?.genus || "Pokémon";
      setDetails({ genus, description, types: pokemon.types.map((entry: { type: { name: string } }) => entry.type.name), height: pokemon.height / 10, weight: pokemon.weight / 10, habitat: species.habitat?.name || null, legendary: species.is_legendary, mythical: species.is_mythical });
    }).catch((error) => { if (error.name !== "AbortError") setDetails(null); }).finally(() => setDetailsLoading(false));
    return () => controller.abort();
  }, [selectedGroup?.dex]);

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = groups.filter((group) => {
      const filterMatch = filter === "all" ||
        (filter === "alternate" && group.items.some((item) => item.category === "alternate")) ||
        (filter.startsWith("gen-") && group.generation === Number(filter.slice(4)));
      const haystack = `${group.title} ${group.dex ?? ""} ${group.items.map((item) => `${item.title} ${item.collection}`).join(" ")}`.toLowerCase();
      return filterMatch && (!needle || haystack.includes(needle));
    });
    return [...result].sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "collection") return a.representative.collection.localeCompare(b.representative.collection) || a.title.localeCompare(b.title);
      return (a.dex ?? 9999) - (b.dex ?? 9999) || a.title.localeCompare(b.title);
    });
  }, [groups, query, filter, sort]);

  const favoriteResults = useMemo(() => filteredGroups.filter((group) => favorites.has(group.key)), [filteredGroups, favorites]);
  const designResults = useMemo(() => filteredGroups.filter((group) => group.items.some((item) => item.category === "design")), [filteredGroups]);
  const referenceResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return setteiDirectory.filter((group) => !needle || `${group.name} ${group.dex} ${group.links.map((link) => link.label).join(" ")}`.toLowerCase().includes(needle));
  }, [query, setteiDirectory]);
  const referenceItems = useMemo(() => referenceResults.flatMap((group) => group.links.map((link, index) => ({ group, link, index }))), [referenceResults]);
  const developmentResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return developmentArchive.filter((item) => !needle || `${item.year} ${item.title} ${item.kind} ${item.credit} ${item.sourceLabel} ${item.description} alpha beta prototype capsule monsters capumon reddit imgur carddass early art`.toLowerCase().includes(needle));
  }, [query]);
  const resourceResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return referenceResources.filter((resource) => !needle || `${resource.title} ${resource.eyebrow} ${resource.description} ${resource.keywords}`.toLowerCase().includes(needle));
  }, [query]);
  const activeGroups = view === "favorites" ? favoriteResults : filteredGroups;
  const activeGeneration = filter.startsWith("gen-") ? Number(filter.slice(4)) : null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") { event.preventDefault(); searchRef.current?.focus(); }
      if (tourRoom !== null) {
        if (event.key === "Escape") setTourRoom(null);
        if (event.key === "ArrowRight") setTourRoom((tourRoom + 1) % museumRooms.length);
        if (event.key === "ArrowLeft") setTourRoom((tourRoom - 1 + museumRooms.length) % museumRooms.length);
        return;
      }
      if (selectedPanel) {
        if (event.key === "Escape") setSelectedPanel(null);
        return;
      }
      if (selectedDevelopment) {
        if (event.key === "Escape") setSelectedDevelopment(null);
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") moveDevelopment(event.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (selectedReference) {
        if (event.key === "Escape") setSelectedReference(null);
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          const current = referenceItems.findIndex((item) => item.group.dex === selectedReference.group.dex && item.index === selectedReference.index);
          if (current >= 0 && referenceItems.length) {
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const next = referenceItems[(current + direction + referenceItems.length) % referenceItems.length];
            setSelectedReference({ group: next.group, index: next.index });
          }
        }
        return;
      }
      if (!selected || !selectedGroup) return;
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const current = activeGroups.findIndex((group) => group.key === selectedGroup.key);
        if (current >= 0 && activeGroups.length) setSelected(activeGroups[(current + direction + activeGroups.length) % activeGroups.length].representative);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const featured = useMemo(() => ["Bulbasaur", "Charizard", "Pikachu", "Gengar", "Eevee"].map((name) => art.find((item) => item.title === name && item.category === "generation")).filter(Boolean) as PokemonArt[], [art]);
  const counts = useMemo(() => ({ alternates: art.filter((item) => item.category === "alternate").length }), [art]);
  useEffect(() => setVisible(PAGE_SIZE), [query, filter, sort, view]);

  function toggleFavorite(key: string) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem("pocket-archive-favorite-species", JSON.stringify([...next]));
      return next;
    });
  }

  function changeDisplay(mode: "grid" | "list") {
    setDisplayMode(mode);
    localStorage.setItem("pocket-archive-display", mode);
  }

  function openAllPokedex() {
    setView("gallery");
    setFilter("all");
    window.history.pushState(null, "", "#pokedex");
  }

  function openGeneration(generation: number) {
    setView("gallery");
    setFilter(`gen-${generation}`);
    window.history.pushState(null, "", `#gen-${generation}`);
  }

  function openReferences() {
    setView("references");
    setFilter("all");
    window.history.pushState(null, "", "#archive");
  }

  function openArchiveSection(section: "alpha" | "sketches" | "references" | "resources") {
    setArchiveSection(section);
    setVisible(PAGE_SIZE);
    requestAnimationFrame(() => document.querySelector("#archive-browser")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function openMuseum() {
    setView("museum");
    setFilter("all");
    window.history.pushState(null, "", "#museum");
  }

  function openFavorites() {
    setView("favorites");
    setFilter("all");
    window.history.pushState(null, "", "#favorites");
    requestAnimationFrame(() => document.querySelector("#collection")?.scrollIntoView({ behavior: "smooth" }));
  }

  function openTopLevelPage(page: "archive" | "museum" | "pokedex") {
    if (page === "archive") openReferences(); else if (page === "museum") openMuseum(); else openAllPokedex();
    requestAnimationFrame(() => document.querySelector("#collection")?.scrollIntoView({ behavior: "smooth" }));
  }

  function openReference(group: SetteiGroup, index: number) {
    setReferenceImageError(false);
    setSelectedReference({ group, index });
  }

  function moveReference(direction: number) {
    if (!selectedReference || !referenceItems.length) return;
    const current = referenceItems.findIndex((item) => item.group.dex === selectedReference.group.dex && item.index === selectedReference.index);
    if (current < 0) return;
    const next = referenceItems[(current + direction + referenceItems.length) % referenceItems.length];
    setReferenceImageError(false);
    setSelectedReference({ group: next.group, index: next.index });
  }

  function moveDevelopment(direction: number) {
    if (!selectedDevelopment || !developmentResults.length) return;
    const current = developmentResults.findIndex((item) => item.id === selectedDevelopment.id);
    if (current < 0) return;
    setSelectedDevelopment(developmentResults[(current + direction + developmentResults.length) % developmentResults.length]);
  }

  function renderGroupCard(group: PokemonGroup) {
    return (
      <article className="art-card" key={group.key}>
        <button className="image-button" onClick={() => setSelected(group.representative)} aria-label={`Open Pokédex entry for ${group.title}`}>
          <span className="dex-number">{group.dex ? `#${String(group.dex).padStart(4, "0")}` : "ALT"}</span>
          <img src={group.representative.src} alt={group.title} loading="lazy" />
          {group.items.length > 1 && <span className="forms-count">{group.items.length} images</span>}
        </button>
        <div className="card-info">
          <div><h3>{group.title}</h3><p>{group.dex ? `Gen ${generationRoman[group.generation]} · ${generationRegions[group.generation]}` : group.representative.collection}</p></div>
          <button className={`heart ${favorites.has(group.key) ? "saved" : ""}`} onClick={() => toggleFavorite(group.key)} aria-label={`${favorites.has(group.key) ? "Remove" : "Add"} ${group.title} ${favorites.has(group.key) ? "from" : "to"} favorites`}>♥</button>
        </div>
      </article>
    );
  }

  function renderNameRow(group: PokemonGroup) {
    const formCount = group.items.filter((item) => item.category === "generation").length;
    const artworkCount = group.items.filter((item) => item.category === "alternate").length;
    const designCount = group.items.filter((item) => item.category === "design").length;
    return (
      <article className="name-row" key={group.key}>
        <button className="name-row-main" onClick={() => setSelected(group.representative)} aria-label={`Open Pokédex entry for ${group.title}`}>
          <span className="name-dex">{group.dex ? `#${String(group.dex).padStart(4, "0")}` : "ALT"}</span>
          <strong>{group.title}</strong>
          <span className="name-region">{group.dex ? `Gen ${generationRoman[group.generation]} · ${generationRegions[group.generation]}` : group.representative.collection}</span>
          <span className="name-counts">{formCount > 1 ? `${formCount} forms` : "Standard form"}{artworkCount ? ` · ${artworkCount} alternate ${artworkCount === 1 ? "artwork" : "artworks"}` : ""}{designCount ? ` · ${designCount} ${designCount === 1 ? "design sheet" : "design sheets"}` : ""}</span>
          <span className="name-arrow" aria-hidden="true">›</span>
        </button>
        <button className={`heart name-heart ${favorites.has(group.key) ? "saved" : ""}`} onClick={() => toggleFavorite(group.key)} aria-label={`${favorites.has(group.key) ? "Remove" : "Add"} ${group.title} ${favorites.has(group.key) ? "from" : "to"} favorites`}>♥</button>
      </article>
    );
  }

  function renderDesignCard(group: PokemonGroup) {
    const sheets = group.items.filter((item) => item.category === "design");
    const cover = sheets[0];
    return <article className="art-card design-card" key={`design-${group.key}`}>
      <button className="image-button" onClick={() => setSelected(cover)} aria-label={`Open sketches and design for ${group.title}`}>
        <span className="dex-number">{group.dex ? `#${String(group.dex).padStart(4, "0")}` : "REF"}</span>
        <img src={cover.src} alt={`${group.title} character design reference`} loading="lazy" />
        <span className="forms-count">{sheets.length} {sheets.length === 1 ? "sheet" : "sheets"}</span>
      </button>
      <div className="card-info"><div><h3>{group.title}</h3><p>{cover.collection}</p></div><button className={`heart ${favorites.has(group.key) ? "saved" : ""}`} onClick={() => toggleFavorite(group.key)} aria-label={`${favorites.has(group.key) ? "Remove" : "Add"} ${group.title} ${favorites.has(group.key) ? "from" : "to"} favorites`}>♥</button></div>
    </article>;
  }

  return (
    <main>
      <header className="site-header">
        <div className="brand"><span className="brand-mark"><i /></span><span>POCKET<br />ARCHIVES</span></div>
        <nav aria-label="Primary navigation"><button className={view === "references" ? "active" : ""} onClick={() => openTopLevelPage("archive")}>Archive</button><button className={view === "museum" ? "active" : ""} onClick={() => openTopLevelPage("museum")}>Museum</button><button className={view === "gallery" ? "active" : ""} onClick={() => openTopLevelPage("pokedex")}>Pokédex</button></nav>
        <button className="favorites-link" onClick={openFavorites}><span>♥</span> Favorites <b>{favorites.size}</b></button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow"><span /> The complete illustrated Pokédex</p><h1>Every era.<br /><em>Every form.</em></h1><p className="hero-intro">A fan-made field guide to 1,858 pieces of official Pokémon character art—from Kanto classics to Paldea and beyond.</p><button className="explore-button" onClick={() => openTopLevelPage("pokedex")}>Open the Pokédex <span>↓</span></button></div>
        <div className="hero-gallery" aria-label="Featured Pokémon artwork">{featured.map((item, index) => <button key={item.id} className={`feature-card feature-${index + 1}`} onClick={() => setSelected(item)} aria-label={`View ${item.title}`}><span className="feature-number">{String(item.dex).padStart(4, "0")}</span><img src={item.src} alt={item.title} /></button>)}{!featured.length && <div className="hero-loader">Cataloguing<br />the archive…</div>}</div>
        <div className="hero-stats"><span><b>{art.length ? art.length.toLocaleString() : "—"}</b> artworks</span><span><b>{groups.filter((group) => group.dex).length || "—"}</b> Pokémon</span><span><b>{counts.alternates || "—"}</b> alternates</span></div>
      </section>

      <section className="collection" id="collection">
        <div className="section-heading"><div><p className="eyebrow"><span /> {view === "gallery" ? "Browse the Pokédex" : view === "favorites" ? "Your collection" : view === "museum" ? "Pocket Archives Design Museum" : "Explore the archive"}</p><h2>{view === "gallery" ? "Know your favorite." : view === "favorites" ? "Saved for later." : view === "museum" ? "Walk through history." : "See how they’re made."}</h2></div><p>{view === "gallery" ? "Search a Pokémon once, then explore its Pokédex data, forms, and artwork in one place." : view === "favorites" ? "Every Pokémon you have favorited on this device, gathered in one place." : view === "museum" ? "A guided history of how Pokémon’s creatures, systems, artwork, and production language evolved." : "From 1990 prototype concepts to modern production sheets—organized from oldest to newest and viewed without leaving the archive."}</p></div>
        <div className="view-tabs" role="tablist" aria-label="Collection views">
          <button role="tab" aria-selected={view === "references"} className={view === "references" ? "active" : ""} onClick={openReferences}><span>01</span> Archive</button>
          <button role="tab" aria-selected={view === "museum"} className={view === "museum" ? "active" : ""} onClick={openMuseum}><span>02</span> Museum</button>
          <button role="tab" aria-selected={view === "gallery"} className={view === "gallery" ? "active" : ""} onClick={openAllPokedex}><span>03</span> Pokédex</button>
        </div>

        {view !== "museum" ? <div className="filter-panel">
          <label className="search-box"><span aria-hidden="true">⌕</span><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={view === "references" ? "Search Pokémon, prototype, pose, or resource…" : "Search Pokémon, number, form, or collection…"} aria-label={view === "references" ? "Search reference library" : "Search Pokédex"} /><kbd>/</kbd></label>
          {view === "gallery" ? <div className="filter-row" aria-label="Open generation page"><button className={filter === "all" ? "active" : ""} onClick={openAllPokedex}>All</button>{Array.from({ length: 9 }, (_, index) => index + 1).map((gen) => <button key={gen} className={filter === `gen-${gen}` ? "active" : ""} onClick={() => openGeneration(gen)}>Gen {generationRoman[gen]}</button>)}</div> : view === "references" ? <p className="favorites-note">Tap any sheet to study it here in the archive. Use the arrows to move through the collection without leaving the site.</p> : <p className="favorites-note">Your saved Pokémon live here on this device.</p>}
        </div> : <div className="museum-page-note"><span>Open daily · Admission always free</span><p>Choose the guided tour for the complete story, or enter The 190 to explore the five design periods at your own pace.</p></div>}

        {view === "gallery" && activeGeneration && <div className="generation-page-heading"><div><span>Generation {generationRoman[activeGeneration]}</span><h3>{generationRegions[activeGeneration]}</h3></div><button onClick={openAllPokedex}>← All Pokémon</button></div>}

        {view !== "museum" && <div className="results-bar"><p>{view === "references" ? <><b>{archiveSection === "alpha" ? developmentResults.length.toLocaleString() : archiveSection === "sketches" ? designResults.length.toLocaleString() : archiveSection === "references" ? referenceItems.length.toLocaleString() : resourceResults.length.toLocaleString()}</b> {archiveSection === "alpha" ? "alpha & beta plates" : archiveSection === "sketches" ? "character sketch groups" : archiveSection === "references" ? "production sheets" : "artist resources"}</> : <><b>{activeGroups.length.toLocaleString()}</b> Pokémon{activeGeneration ? ` · Generation ${generationRoman[activeGeneration]}` : ""}</>}</p><div className="results-controls">{view === "gallery" && <label>Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="dex">Pokédex number</option><option value="name">Name A–Z</option><option value="collection">Collection</option></select></label>}{view !== "references" && <div className="display-toggle" role="group" aria-label="Display style"><button className={displayMode === "grid" ? "active" : ""} onClick={() => changeDisplay("grid")} aria-pressed={displayMode === "grid"}><span>▦</span> Grid</button><button className={displayMode === "list" ? "active" : ""} onClick={() => changeDisplay("list")} aria-pressed={displayMode === "list"}><span>☰</span> Names</button></div>}</div></div>}

        {view === "references" ? <div className="reference-library" id="archive-browser">
          <nav className="archive-index" aria-label="Archive sections"><button className={archiveSection === "alpha" ? "active" : ""} onClick={() => openArchiveSection("alpha")}><small>01</small><b>Alpha &amp; beta</b><span>{developmentResults.length} plates</span></button><button className={archiveSection === "sketches" ? "active" : ""} onClick={() => openArchiveSection("sketches")}><small>02</small><b>Character sketches</b><span>{designResults.length} Pokémon</span></button><button className={archiveSection === "references" ? "active" : ""} onClick={() => openArchiveSection("references")}><small>03</small><b>Production sheets</b><span>{referenceItems.length} sheets</span></button><button className={archiveSection === "resources" ? "active" : ""} onClick={() => openArchiveSection("resources")}><small>04</small><b>Artist resources</b><span>{resourceResults.length} collections</span></button></nav>
          {archiveSection === "alpha" && (!!developmentResults.length ? <section className="development-archive"><div className="timeline-heading"><span>1990–1997 · Earliest material first</span><h3>Alpha &amp; beta archive</h3><p>Original concepts, extracted prototype assets, release-era Carddass illustrations, and research plates are labeled separately.</p></div><div className="thread-source-note"><p><b>Source overview.</b> This room combines early Game Freak material, prototype research plates, and 52 unique images preserved through the Reddit/Imgur collection.</p><span>Oldest to newest</span></div><div className="development-grid">{developmentResults.map((item) => <article className="development-card" key={item.id}><button onClick={() => setSelectedDevelopment(item)} aria-label={`Open ${item.title}`}><span className="development-image"><img src={item.src} alt={item.title} loading="lazy" /></span><span className="development-card-copy"><small>{item.year} · {item.kind}</small><strong>{item.title}</strong><em>{item.credit}</em></span></button></article>)}</div></section> : <div className="empty-state"><span>?</span><h3>No early material found</h3><p>Try a broader search.</p><button onClick={() => setQuery("")}>Clear search</button></div>)}
          {archiveSection === "sketches" && (!!designResults.length ? <section className="archive-sketches"><div className="reference-heading"><span>1996–present · Pokédex order</span><h3>Character sketches</h3><p>{designResults.length} Pokémon</p></div><div className="art-grid">{designResults.map(renderDesignCard)}</div></section> : <div className="empty-state"><span>?</span><h3>No character sketches found</h3><p>Try another Pokémon name.</p><button onClick={() => setQuery("")}>Clear search</button></div>)}
          {archiveSection === "references" && <section className="production-room"><div className="archive-provenance"><div><span>Production room</span><h3>What are these sheets?</h3></div><div><p><b>Settei</b> are working reference drawings used to keep characters, poses, expressions, and proportions consistent in animation.</p><p>Each popup keeps only the sheet title and its source record.</p><p className="provenance-record">PS Art Room index · OLM production references</p></div></div><div className="reference-heading"><span>1997–present · Pokédex order</span><h3>Production references</h3><p>{referenceItems.length} sheets</p></div>{setteiDirectory.length === 0 ? <div className="loading-grid">Indexing the reference room…</div> : referenceItems.length === 0 ? <div className="empty-state"><span>?</span><h3>No reference sheets found</h3><p>Try another Pokémon, pose, or expression.</p><button onClick={() => setQuery("")}>Clear search</button></div> : <div className="settei-gallery">{referenceItems.slice(0, visible).map(({ group, link, index }) => { const archived = link.url.includes("web.archive.org/web/"); return <article className="sheet-card" key={`${group.dex}-${link.url}-${index}`}><button onClick={() => openReference(group, index)} aria-label={`Open ${group.name} ${link.label} in the reference viewer`}><span className="sheet-image"><img src={referenceDestination(link.url)} alt={`${group.name} ${link.label}`} loading="lazy" /></span><span className="sheet-card-copy"><small>#{String(group.dex).padStart(4, "0")}{archived ? " · Preserved copy" : " · Production art"}</small><strong>{group.name}</strong><em>{link.label === "Model sheet" && index > 0 ? `Model sheet ${index + 1}` : titleCase(link.label)}</em></span></button></article>; })}</div>}</section>}
          {archiveSection === "resources" && (!!resourceResults.length ? <section className="artist-resources"><div className="reference-heading"><span>Drawing room</span><h3>Artist resources</h3><p>{resourceResults.length} collections</p></div><div className="resource-grid static-resources">{resourceResults.map((resource) => <article className="resource-card" key={resource.title}><span>{resource.eyebrow}</span><h3>{resource.title}</h3><p>{resource.description}</p></article>)}</div><p className="resource-source-line">Catalogued from the PS Art Room resource index.</p></section> : <div className="empty-state"><span>?</span><h3>No resources found</h3><p>Try a broader search.</p><button onClick={() => setQuery("")}>Clear search</button></div>)}
        </div> : view === "museum" ? <div className="museum-page">
          <button className="museum-launch" onClick={() => setTourRoom(0)}><span><small>Wing 01 · Guided exhibition</small><b>The history of Pokémon design</b><em>A self-guided museum tour through 8 chronological rooms</em></span><strong>Start tour <i>→</i></strong></button>
          <section className="internal-list-wing"><div className="museum-wing-heading"><span>Wing 02 · Internal archaeology</span><h3>The 190</h3><p>Explore Helix Chamber’s reconstruction of the original Red &amp; Green internal roster as five broad design periods. This is a research framework—not a confirmed production timeline.</p></div><div className="museum-stat-strip"><div><b>190</b><span>internal slots</span></div><div><b>151</b><span>released Pokémon</span></div><div><b>39</b><span>unused slots</span></div><div><b>5</b><span>design periods</span></div></div><div className="internal-period-grid">{internalListPanels.map((panel, index) => <button key={panel.id} onClick={() => setSelectedPanel(panel)}><small>Period {String(index + 1).padStart(2, "0")}</small><b>{panel.title}</b><p>{panel.description}</p></button>)}</div></section>
          <section className="museum-research-wing"><div className="museum-wing-heading"><span>Wing 03 · Research desk</span><h3>How we know</h3><p>Seven concise explanations of prototype evidence, internal numbering, lost designs, and what can—or cannot—be concluded from the surviving material.</p></div><div className="research-square-grid" aria-label="Local prototype research explanations">{helixResearchPanels.map((panel, index) => <button key={panel.id} onClick={() => setSelectedPanel(panel)}><small>{String(index + 1).padStart(2, "0")} · Research note</small><b>{panel.title}</b></button>)}</div></section>
        </div> : art.length === 0 ? <div className="loading-grid">Opening the archive…</div> : activeGroups.length === 0 ? <div className="empty-state"><span>{view === "favorites" ? "♥" : "?"}</span><h3>{view === "favorites" ? "No favorites yet" : "No matches found"}</h3><p>{view === "favorites" ? "Tap the heart on any Pokémon to build your collection." : "Try another name, number, or generation."}</p>{view !== "favorites" && <button onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</button>}</div> : <div className={displayMode === "grid" ? "art-grid" : "name-list"}>{(displayMode === "grid" ? activeGroups.slice(0, visible) : activeGroups).map(displayMode === "grid" ? renderGroupCard : renderNameRow)}</div>}
        {view === "references" && archiveSection === "references" && visible < referenceItems.length && <button className="load-more" onClick={() => setVisible((value) => value + PAGE_SIZE)}>Load more <span>{Math.min(PAGE_SIZE, referenceItems.length - visible)}</span></button>}
        {displayMode === "grid" && (view === "gallery" || view === "favorites") && visible < activeGroups.length && <button className="load-more" onClick={() => setVisible((value) => value + PAGE_SIZE)}>Load more <span>{Math.min(PAGE_SIZE, activeGroups.length - visible)}</span></button>}
      </section>

      <section className="about" id="about"><p className="eyebrow"><span /> About the archive</p><div className="about-grid"><h2>A visual history,<br />one creature at a time.</h2><div><p>Pocket Archives brings each Pokémon’s official art, forms, reference drawings, cards, and Pokédex details together. Your supplied character-design sheets and PS Art Room’s credited production references share one searchable References &amp; Sketches section, while remaining visibly identified by source. Species information is supplied by PokéAPI, and the image-only card gallery is supplied by the community Pokémon TCG API.</p><p className="source-records">Source records · PS Art Room · PokéAPI · Pokémon TCG API · Nintendo creator interviews · Helix Chamber</p><p className="fine-print">A personal, non-commercial fan archive. Pokémon and all related characters are trademarks of Nintendo, Game Freak, and Creatures Inc. Source records remain credited to their original curators and hosts; archive browsing stays inside Pocket Archives.</p></div></div></section>
      <footer><div className="brand footer-brand"><span className="brand-mark"><i /></span><span>POCKET<br />ARCHIVES</span></div><p>Gotta archive ’em all.</p></footer>

      {selected && selectedGroup && <div className="modal" role="dialog" aria-modal="true" aria-label={`${selectedGroup.title} Pokédex entry`} onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
        <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close Pokédex entry">×</button>
        <div className={`modal-art ${selectedGroup.dex || selectedGroup.items.length > 1 ? "has-forms" : ""}`}><span className="modal-index">{variantView === "cards" && selectedCard ? `${selectedCard.set.name} · #${selectedCard.number}` : selectedGroup.dex ? `#${String(selectedGroup.dex).padStart(4, "0")}` : "SPECIAL ART"}</span>{variantView === "cards" && selectedCard ? <img className="tcg-card-main" src={selectedCard.images.large} alt={`${selectedCard.name} card from ${selectedCard.set.name}`} /> : <img src={selected.src} alt={selected.title} />}{(selectedGroup.dex || selectedGroup.items.length > 1) && <div className="form-strip" aria-label={`${selectedGroup.title} images`}><div className="variant-tabs" role="tablist" aria-label="Image type"><button role="tab" aria-selected={variantView === "forms"} className={variantView === "forms" ? "active" : ""} disabled={!selectedForms.length} onClick={() => { setVariantView("forms"); if (selectedForms.length) setSelected(selectedForms[0]); }}>Forms <b>{selectedForms.length}</b></button><button role="tab" aria-selected={variantView === "artwork"} className={variantView === "artwork" ? "active" : ""} disabled={!selectedArtwork.length} onClick={() => { setVariantView("artwork"); if (selectedArtwork.length) setSelected(selectedArtwork[0]); }}>Alternate artwork <b>{selectedArtwork.length}</b></button><button role="tab" aria-selected={variantView === "design"} className={variantView === "design" ? "active" : ""} disabled={!selectedDesign.length} onClick={() => { setVariantView("design"); if (selectedDesign.length) setSelected(selectedDesign[0]); }}>Sketches & design <b>{selectedDesign.length}</b></button><button role="tab" aria-selected={variantView === "cards"} className={variantView === "cards" ? "active" : ""} disabled={!selectedGroup.dex} onClick={() => setVariantView("cards")}>Cards <b>{cardsLoading ? "…" : cards.length || ""}</b></button></div>{variantView === "cards" ? cardsLoading ? <p className="card-strip-message">Finding cards…</p> : cardsError ? <p className="card-strip-message">Card gallery unavailable right now.</p> : cards.map((card) => <button key={card.id} className={`variant-thumb card-thumb ${selectedCard?.id === card.id ? "active" : ""}`} onClick={() => setSelectedCard(card)} aria-label={`Show ${card.name}, ${card.set.name} number ${card.number}`}><img src={card.images.small} alt="" loading="lazy" /><span>{card.set.name} · {card.number}</span></button>) : shownVariants.map((item) => <button key={item.id} className={`variant-thumb ${selected.id === item.id ? "active" : ""}`} onClick={() => setSelected(item)} aria-label={`Show ${item.title}, ${item.collection}`}><img src={item.src} alt="" loading="lazy" /><span>{item.title}</span></button>)}</div>}</div>
        <div className="modal-details"><p className="eyebrow"><span /> {selectedGroup.dex ? `Generation ${generationRoman[selectedGroup.generation]} · ${generationRegions[selectedGroup.generation]}` : selected.collection}</p><h2>{selectedGroup.title}</h2>{detailsLoading ? <p className="details-loading">Reading Pokédex data…</p> : details ? <><p className="pokemon-genus">{details.legendary ? "Legendary · " : details.mythical ? "Mythical · " : ""}{details.genus}</p><p className="dex-description">{details.description}</p><div className="type-row">{details.types.map((type) => <span className={`type type-${type}`} key={type}>{titleCase(type)}</span>)}</div><dl className="pokemon-facts"><div><dt>Height</dt><dd>{details.height} m</dd></div><div><dt>Weight</dt><dd>{details.weight} kg</dd></div><div><dt>Habitat</dt><dd>{details.habitat ? titleCase(details.habitat) : "Unknown"}</dd></div><div><dt>Artwork</dt><dd>{selectedGroup.items.length} in archive</dd></div></dl></> : selectedGroup.dex ? <p className="dex-description">Pokédex information is temporarily unavailable.</p> : <p className="dex-description">This unnumbered artwork belongs to the {selected.collection} collection.</p>}
          {variantView === "cards" && selectedCard ? <div className="source-credit card-credit"><span>Trading card</span><b>{selectedCard.set.name} · #{selectedCard.number}</b><p>{selectedCard.rarity || "Rarity not listed"} · Illustrated by {selectedCard.artist || "artist not listed"}</p></div> : <div className="source-credit compact-credit"><span>Collection</span><b>{selected.collection}</b></div>}
          <div className="modal-actions"><button onClick={() => toggleFavorite(selectedGroup.key)}>{favorites.has(selectedGroup.key) ? "♥ In favorites" : "♡ Add to favorites"}</button>{variantView !== "cards" && <a href={selected.src} download>Download art ↓</a>}</div><p className="key-hint">Use ← → for next Pokémon · Esc to close</p>
        </div>
      </div>}

      {selectedReference && <div className="reference-viewer" role="dialog" aria-modal="true" aria-label={`${selectedReference.group.name} reference sheet`} onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedReference(null); }}>
        <button className="reference-viewer-close" onClick={() => setSelectedReference(null)} aria-label="Close reference viewer">×</button>
        <div className="reference-viewer-stage">
          <span className="reference-viewer-index">#{String(selectedReference.group.dex).padStart(4, "0")} · {selectedReference.index + 1} of {selectedReference.group.links.length}</span>
          {referenceImageError ? <div className="reference-image-error"><b>Preview unavailable</b><p>This preserved sheet could not be loaded by its original host.</p></div> : <img src={referenceDestination(selectedReference.group.links[selectedReference.index].url)} alt={`${selectedReference.group.name} ${selectedReference.group.links[selectedReference.index].label}`} onError={() => setReferenceImageError(true)} />}
          <button className="reference-step previous" onClick={() => moveReference(-1)} aria-label="Previous reference sheet">←</button>
          <button className="reference-step next" onClick={() => moveReference(1)} aria-label="Next reference sheet">→</button>
        </div>
        <aside className="reference-viewer-details">
          <p className="eyebrow"><span /> Production reference</p>
          <h2>{selectedReference.group.name}</h2>
          <p className="reference-viewer-label">{titleCase(selectedReference.group.links[selectedReference.index].label)}</p>
          <div className="reference-source"><span>Provenance</span><b>{referenceProvenance(selectedReference.group.links[selectedReference.index].url).label}</b><p>{referenceProvenance(selectedReference.group.links[selectedReference.index].url).archived ? "Preserved copy located through the PS Art Room index" : `Image host: ${referenceProvenance(selectedReference.group.links[selectedReference.index].url).host} · Located through the PS Art Room index`}</p></div>
          <p className="key-hint">Use ← → for another sheet · Esc to close</p>
        </aside>
      </div>}

      {selectedDevelopment && <div className="reference-viewer development-viewer" role="dialog" aria-modal="true" aria-label={`${selectedDevelopment.title} early development plate`} onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedDevelopment(null); }}>
        <button className="reference-viewer-close" onClick={() => setSelectedDevelopment(null)} aria-label="Close early development viewer">×</button>
        <div className="reference-viewer-stage development-stage">
          <span className="reference-viewer-index">{selectedDevelopment.year} · {developmentResults.findIndex((item) => item.id === selectedDevelopment.id) + 1} of {developmentResults.length}</span>
          <img src={selectedDevelopment.src} alt={selectedDevelopment.title} />
          <button className="reference-step previous" onClick={() => moveDevelopment(-1)} aria-label="Previous early development plate">←</button>
          <button className="reference-step next" onClick={() => moveDevelopment(1)} aria-label="Next early development plate">→</button>
        </div>
        <aside className="reference-viewer-details">
          <p className="eyebrow"><span /> Early development archive</p>
          <h2>{selectedDevelopment.title}</h2>
          <p className="reference-viewer-label">{selectedDevelopment.year} · {selectedDevelopment.kind}</p>
          {!selectedDevelopment.id.startsWith("reddit-") && !selectedDevelopment.id.startsWith("carddass-") && <p className="reference-viewer-description">{selectedDevelopment.description}</p>}
          <div className="reference-source"><span>Creator / assembly credit</span><b>{selectedDevelopment.credit}</b><p>{selectedDevelopment.sourceLabel}</p></div>
          <p className="key-hint">Use ← → for another plate · Esc to close</p>
        </aside>
      </div>}

      {tourRoom !== null && <div className="museum-tour" role="dialog" aria-modal="true" aria-label={`Museum tour room ${tourRoom + 1}: ${museumRooms[tourRoom].title}`}>
        <header><div className="museum-wordmark"><span className="brand-mark"><i /></span><b>POCKET ARCHIVES</b><small>DESIGN MUSEUM</small></div><div className="museum-progress-label">Room {String(tourRoom + 1).padStart(2, "0")} / {String(museumRooms.length).padStart(2, "0")}</div><button onClick={() => setTourRoom(null)} aria-label="Exit museum tour">×</button></header>
        <div className="museum-art"><span>{museumRooms[tourRoom].year}</span><img src={museumRooms[tourRoom].image} alt={museumRooms[tourRoom].caption} /><small>{museumRooms[tourRoom].caption}</small></div>
        <article className="museum-wall-text"><p className="eyebrow"><span /> {museumRooms[tourRoom].subtitle}</p><h2>{museumRooms[tourRoom].title}</h2><p className="museum-body">{museumRooms[tourRoom].body}</p><ul>{museumRooms[tourRoom].highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul><p className="museum-source">Source record · {museumRooms[tourRoom].source}</p></article>
        <nav className="museum-controls" aria-label="Museum tour navigation"><button disabled={tourRoom === 0} onClick={() => setTourRoom((room) => room === null ? 0 : Math.max(0, room - 1))}>← Previous</button><button onClick={() => tourRoom === museumRooms.length - 1 ? setTourRoom(null) : setTourRoom(tourRoom + 1)}>{tourRoom === museumRooms.length - 1 ? "Finish tour" : "Next room →"}</button></nav>
      </div>}

      {selectedPanel && <div className="reference-viewer local-info-viewer" role="dialog" aria-modal="true" aria-label={selectedPanel.title} onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedPanel(null); }}>
        <button className="reference-viewer-close" onClick={() => setSelectedPanel(null)} aria-label="Close explanation">×</button>
        <div className="local-info-stage"><span>POCKET<br />ARCHIVES</span><b>RESEARCH<br />NOTE</b><small>READ WITHOUT<br />LEAVING THE ARCHIVE</small></div>
        <aside className="reference-viewer-details local-info-details">
          <p className="eyebrow"><span /> {selectedPanel.eyebrow}</p>
          <h2>{selectedPanel.title}</h2>
          <p className="reference-viewer-description">{selectedPanel.description}</p>
          <ol className="local-info-list">{selectedPanel.details.map((detail) => <li key={detail}>{detail}</li>)}</ol>
          <div className="reference-source"><span>Source record</span><b>{selectedPanel.source}</b><p>This is a concise Pocket Archives summary, not a verbatim reproduction.</p></div>
          <p className="local-viewer-note">This explanation opens and closes entirely inside Pocket Archives.</p>
          <p className="key-hint">Esc to close</p>
        </aside>
      </div>}
    </main>
  );
}
