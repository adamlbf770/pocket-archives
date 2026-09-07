const BLOCKED_WORDS = /\b(?:bulk|common|uncommon|energy|trainer|mystery|repack|proxy|reprint|custom|digital|online|code|damaged|poor|altered|empty|wrapper|pack)\b/i;
const LOT_WORDS = /\b(?:lot|bundle|collection)\b/i;
const IR_WORDS = /\b(?:illustration rare|art rare|IRs?|ARs?)\b/i;
const ULTRA_WORDS = /\b(?:ultra rares?|URs?)\b/i;
const ONLY_WORDS = /\b(?:only|all)\b/i;
const FOREIGN_LANGUAGES = ["japanese", "korean", "simplified chinese", "traditional chinese", "chinese", "spanish", "french", "german", "italian", "portuguese"];
const MATERIAL_VARIANTS = ["shadowless", "1st edition", "first edition", "unlimited", "reverse holo", "cosmos holo", "cracked ice", "master ball", "poke ball", "pokeball", "promo"];

export function deliveredPrice(item) {
  const itemPrice = Number(item?.price?.value ?? NaN);
  if (!Number.isFinite(itemPrice)) return NaN;
  const costs = (item.shippingOptions ?? []).map((option) => Number(option?.shippingCost?.value)).filter(Number.isFinite);
  return itemPrice + (costs.length ? Math.min(...costs) : 0);
}

export function acquisitionCost(itemPrice, shipping = 0, taxRate = 0) {
  return round((Number(itemPrice) + Number(shipping)) * (1 + Number(taxRate)));
}

export function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return NaN;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function percentageBelow(price, market) {
  if (!(price >= 0) || !(market > 0)) return NaN;
  return ((market - price) / market) * 100;
}

export function parseSlab(title) {
  const text = String(title ?? "");
  const graderMatch = text.match(/\b(PSA|CGC|BGS|BECKETT|TAG|SGC)\b/i);
  if (!graderMatch) return null;
  const grader = graderMatch[1].toUpperCase() === "BECKETT" ? "BGS" : graderMatch[1].toUpperCase();
  const gradePattern = new RegExp(`\\b(?:${grader === "BGS" ? "BGS|BECKETT" : grader})\\s*(?:PRISTINE|PERFECT|GEM\\s*MINT|MINT|NM-MT|NEAR\\s*MINT)?\\s*(10|9\\.5|9|8\\.5|8|7\\.5|7|6|5|4|3|2|1)\\b`, "i");
  const gradeMatch = text.match(gradePattern);
  const fraction = text.match(/\b([A-Z]{0,5}\d{1,4})\s*\/\s*([A-Z]{0,5}\d{1,4})\b/i);
  const hashNumber = text.match(/(?:^|\s)#([A-Z]{0,5}\d{1,4})\b/i);
  if (!gradeMatch || (!fraction && !hashNumber)) return null;
  return { grader, grade: gradeMatch[1], cardNumber: fraction ? `${fraction[1].toUpperCase()}/${fraction[2].toUpperCase()}` : hashNumber[1].toUpperCase() };
}

export function parseSlabIdentity(title) {
  const slab = parseSlab(title);
  if (!slab) return null;
  const text = normalize(title);
  const certificationNumber = String(title).match(/\b(?:cert(?:ification)?\s*(?:no\.?|#)?\s*)?(\d{7,12})\b/i)?.[1] ?? "";
  return { ...slab, language: detectLanguage(text), variants: MATERIAL_VARIANTS.filter((variant) => text.includes(variant)), certificationNumber };
}

export function sameSlab(a, b) {
  const left = parseSlab(a);
  const right = parseSlab(b);
  return Boolean(left && right && left.grader === right.grader && left.grade === right.grade && left.cardNumber === right.cardNumber);
}

export function slabSearchQuery(title) {
  const slab = parseSlab(title);
  if (!slab) return "";
  const useful = identityTokens(title).slice(0, 7).join(" ");
  return `${useful} ${slab.cardNumber} ${slab.grader} ${slab.grade}`.replace(/\s+/g, " ").trim();
}

export function comparableSlab(a, b) {
  if (!sameSlab(a, b)) return false;
  const leftIdentity = parseSlabIdentity(a);
  const rightIdentity = parseSlabIdentity(b);
  if (!leftIdentity || !rightIdentity || leftIdentity.language !== rightIdentity.language) return false;
  if (variantConflict(leftIdentity.variants, rightIdentity.variants)) return false;
  const left = new Set(identityTokens(a));
  const right = new Set(identityTokens(b));
  const overlap = [...left].filter((token) => right.has(token));
  return overlap.length >= Math.min(2, left.size, right.size);
}

export function conservativeMedian(values) {
  const sorted = values.filter(Number.isFinite).filter((value) => value > 0).sort((a, b) => a - b);
  if (sorted.length < 4) return median(sorted);
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const iqr = q3 - q1;
  return median(sorted.filter((value) => value >= Math.max(0, q1 - 1.5 * iqr) && value <= q3 + 1.5 * iqr));
}

export function recentSoldRange(values) {
  const sorted = values.filter(Number.isFinite).filter((value) => value > 0).sort((a, b) => a - b);
  if (!sorted.length) return { low: NaN, high: NaN };
  if (sorted.length < 4) return { low: sorted[0], high: sorted.at(-1) };
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const iqr = q3 - q1;
  const kept = sorted.filter((value) => value >= Math.max(0, q1 - 1.5 * iqr) && value <= q3 + 1.5 * iqr);
  return { low: kept[0], high: kept.at(-1) };
}

export function liquidityGrade(soldDates, now = new Date()) {
  const recent = soldDates.map((value) => new Date(value)).filter((value) => Number.isFinite(value.getTime())).filter((value) => now.getTime() - value.getTime() <= 180 * 86_400_000).sort((a, b) => a - b);
  if (!recent.length) return { grade: "D", sales: 0, medianDaysBetweenSales: null };
  const gaps = recent.slice(1).map((date, index) => (date - recent[index]) / 86_400_000);
  const cadence = gaps.length ? median(gaps) : null;
  if (recent.length >= 5 && cadence !== null && cadence <= 21) return { grade: "A", sales: recent.length, medianDaysBetweenSales: round(cadence) };
  if (recent.length >= 3 && cadence !== null && cadence <= 45) return { grade: "B", sales: recent.length, medianDaysBetweenSales: round(cadence) };
  return { grade: "C", sales: recent.length, medianDaysBetweenSales: cadence === null ? null : round(cadence) };
}

export function targetMarketRatio(grader) {
  if (String(grader).toUpperCase() === "PSA") return 0.7;
  if (["CGC", "BGS", "TAG"].includes(String(grader).toUpperCase())) return 0.6;
  return 0.5;
}

export function calculateDealEconomics({ itemPrice, shipping = 0, taxRate = 0.07, soldPrices = [], soldDates = [], grader, sellingFeeRate = 0.1325, transactionFee = 0.3, outboundShipping = 5, packaging = 0.75, minimumProfit = 10, minimumRoi = 0.25, lowValueMinimumProfit = 12 }) {
  const market = conservativeMedian(soldPrices);
  const range = recentSoldRange(soldPrices);
  const landed = acquisitionCost(itemPrice, shipping, taxRate);
  const fees = Number.isFinite(market) ? market * sellingFeeRate + transactionFee : NaN;
  const netProfit = Number.isFinite(market) ? market - fees - outboundShipping - packaging - landed : NaN;
  const roi = landed > 0 && Number.isFinite(netProfit) ? (netProfit / landed) * 100 : NaN;
  const discount = percentageBelow(landed, market);
  const liquidity = liquidityGrade(soldDates);
  const requiredProfit = market < 30 ? Math.max(minimumProfit, lowValueMinimumProfit) : minimumProfit;
  const ratioCap = Number.isFinite(market) ? market * targetMarketRatio(grader) : NaN;
  const profitCap = Number.isFinite(market) ? market - fees - outboundShipping - packaging - requiredProfit : NaN;
  const roiCap = Number.isFinite(market) ? (market - fees - outboundShipping - packaging) / (1 + minimumRoi) : NaN;
  const maximumLandedCost = Math.min(ratioCap, profitCap, roiCap);
  const maximumBuyPrice = Number.isFinite(maximumLandedCost) ? Math.max(0, maximumLandedCost / (1 + taxRate) - shipping) : NaN;
  const suggestedOffer = Number.isFinite(maximumBuyPrice) ? Math.max(0, Math.floor(maximumBuyPrice * 0.92)) : NaN;
  const recommendation = recommendationFor({ market, liquidity: liquidity.grade, discount, netProfit, roi, minimumProfit: requiredProfit, minimumRoi });
  return { landedCost: round(landed), soldMedian: roundOrNull(market), soldRange: { low: roundOrNull(range.low), high: roundOrNull(range.high) }, estimatedFees: roundOrNull(fees), expectedNetProfit: roundOrNull(netProfit), expectedRoiPercent: roundOrNull(roi), discountToSoldMarketPercent: roundOrNull(discount), maximumBuyPrice: roundOrNull(maximumBuyPrice), suggestedOffer: roundOrNull(suggestedOffer), liquidityGrade: liquidity.grade, medianDaysBetweenSales: liquidity.medianDaysBetweenSales, recommendation };
}

export function classifyBundle(title) {
  const text = String(title ?? "");
  if (BLOCKED_WORDS.test(text) || !LOT_WORDS.test(text)) return null;
  const countMatch = text.match(/\b(\d{1,3})\s*(?:cards?|pcs?|x)\b/i);
  const count = countMatch ? Number(countMatch[1]) : null;
  if (IR_WORDS.test(text) && ONLY_WORDS.test(text)) return { type: "Illustration Rare", count };
  if (ULTRA_WORDS.test(text) && ONLY_WORDS.test(text)) return { type: "Ultra Rare", count };
  return null;
}

export function comparableBundlePrices(candidate, items) {
  const target = classifyBundle(candidate.title);
  if (!target?.count) return [];
  return items.flatMap((item) => {
    const parsed = classifyBundle(item.title);
    const total = deliveredPrice(item);
    if (!parsed?.count || parsed.type !== target.type || !Number.isFinite(total)) return [];
    if (parsed.count < target.count * 0.8 || parsed.count > target.count * 1.2) return [];
    return [total / parsed.count];
  });
}

export function isBlockedTitle(title) { return BLOCKED_WORDS.test(String(title ?? "")); }

function recommendationFor({ market, liquidity, discount, netProfit, roi, minimumProfit, minimumRoi }) {
  if (!Number.isFinite(market) || liquidity === "D") return "PASS";
  if (liquidity === "C") return "REVIEW";
  if (discount >= 40 && netProfit >= 20 && roi >= 40) return "STRONG BUY";
  if (discount >= 30 && netProfit >= minimumProfit && roi >= minimumRoi * 100) return "BUY";
  if (discount >= 20 && netProfit >= minimumProfit * 0.8) return "WATCH";
  return "PASS";
}

function detectLanguage(text) { return FOREIGN_LANGUAGES.find((language) => text.includes(language)) ?? "english-or-unspecified"; }
function normalizeVariant(value) { if (value === "first edition") return "1st edition"; if (value === "pokeball") return "poke ball"; return value; }
function variantConflict(left, right) { const a = new Set(left.map(normalizeVariant)); const b = new Set(right.map(normalizeVariant)); return [...new Set([...a, ...b])].some((variant) => a.has(variant) !== b.has(variant)); }
function normalize(value) { return String(value ?? "").toLowerCase().replace(/[’]/g, "'"); }
function identityTokens(title) { const stop = new Set(["pokemon", "magic", "gathering", "yugioh", "piece", "tcg", "card", "graded", "slab", "psa", "cgc", "bgs", "beckett", "tag", "sgc", "gem", "mint", "nm", "mt", "holo", "foil", "rare", "english", "japanese", "korean", "chinese", "edition", "first", "1st"]); return normalize(title).replace(/\b\d{1,4}\s*\/\s*\d{1,4}\b/g, " ").replace(/[^a-z0-9'-]+/g, " ").split(/\s+/).filter((token) => token.length > 2 && !stop.has(token) && !/^\d+(?:\.\d+)?$/.test(token)); }
function percentile(sorted, p) { const index = (sorted.length - 1) * p; const low = Math.floor(index); const high = Math.ceil(index); return low === high ? sorted[low] : sorted[low] + (sorted[high] - sorted[low]) * (index - low); }
function round(value) { return Math.round(value * 100) / 100; }
function roundOrNull(value) { return Number.isFinite(value) ? round(value) : null; }
