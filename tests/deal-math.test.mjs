import test from "node:test";
import assert from "node:assert/strict";
import {
  acquisitionCost,
  calculateDealEconomics,
  classifyBundle,
  conservativeMedian,
  deliveredPrice,
  liquidityGrade,
  median,
  parseSlab,
  percentageBelow,
  sameSlab,
  slabSearchQuery,
  comparableSlab,
} from "../scripts/deals/deal-math.mjs";

test("deliveredPrice uses the lowest shipping option", () => {
  assert.equal(deliveredPrice({ price: { value: "20" }, shippingOptions: [{ shippingCost: { value: "5" } }, { shippingCost: { value: "3" } }] }), 23);
});

test("median and percentage calculations are stable", () => {
  assert.equal(median([3, 1, 2, 4]), 2.5);
  assert.equal(percentageBelow(70, 100), 30);
});

test("parseSlab requires grader grade and card number", () => {
  assert.deepEqual(parseSlab("Pokemon Pikachu 58/102 Base Set PSA 9"), { grader: "PSA", grade: "9", cardNumber: "58/102" });
  assert.equal(parseSlab("Pokemon PSA graded mystery card"), null);
  assert.equal(sameSlab("Pikachu 58/102 PSA 9", "PSA 9 Base Set Pikachu 58/102"), true);
  assert.equal(sameSlab("Pikachu 58/102 PSA 9", "Pikachu 58/102 PSA 10"), false);
  assert.equal(comparableSlab("Pikachu Base Set 58/102 PSA 9", "PSA 9 Base Set Pikachu 58/102"), true);
  assert.equal(comparableSlab("Pikachu Base Set 58/102 PSA 9", "Charmander Expedition 58/102 PSA 9"), false);
  assert.match(slabSearchQuery("1999 Pokemon Base Set Pikachu 58/102 PSA 9"), /Base Set Pikachu 58\/102 PSA 9/i);
});

test("bundle classification rejects regular bulk and mixed lots", () => {
  assert.deepEqual(classifyBundle("Pokemon 10 Card Illustration Rare Only Lot"), { type: "Illustration Rare", count: 10 });
  assert.deepEqual(classifyBundle("Pokemon 25 Cards All Ultra Rare Bundle"), { type: "Ultra Rare", count: 25 });
  assert.equal(classifyBundle("Pokemon 100 Card Ultra Rare Bulk Lot"), null);
  assert.equal(classifyBundle("Pokemon Mixed Collection Lot"), null);
});

test("landed cost includes shipping and estimated sales tax", () => {
  assert.equal(acquisitionCost(40, 5, 0.07), 48.15);
});

test("conservative sold value removes an obvious high outlier", () => {
  assert.equal(conservativeMedian([75, 78, 80, 82, 500]), 79);
});

test("liquidity grades use realized sale count and cadence", () => {
  const now = new Date("2026-09-05T00:00:00Z");
  assert.deepEqual(liquidityGrade(["2026-08-01", "2026-08-08", "2026-08-15", "2026-08-22", "2026-08-29"], now), { grade: "A", sales: 5, medianDaysBetweenSales: 7 });
  assert.equal(liquidityGrade([], now).grade, "D");
});

test("dealer math produces a recommendation only when profit ROI discount and liquidity clear", () => {
  const result = calculateDealEconomics({
    itemPrice: 40,
    shipping: 0,
    taxRate: 0.07,
    soldPrices: [78, 80, 82, 79, 81],
    soldDates: ["2026-08-01", "2026-08-08", "2026-08-15", "2026-08-22", "2026-08-29"],
    grader: "PSA",
    sellingFeeRate: 0.1325,
    transactionFee: 0.3,
    outboundShipping: 5,
    packaging: 0.75,
  });
  assert.equal(result.recommendation, "STRONG BUY");
  assert.equal(result.liquidityGrade, "A");
  assert.ok(result.maximumBuyPrice < 56);
  assert.ok(result.expectedNetProfit >= 10);
  assert.ok(result.expectedRoiPercent >= 25);
});

test("no realized sold history can never produce a buy recommendation", () => {
  const result = calculateDealEconomics({ itemPrice: 10, soldPrices: [], soldDates: [], grader: "PSA" });
  assert.equal(result.recommendation, "PASS");
  assert.equal(result.soldMedian, null);
  assert.equal(result.maximumBuyPrice, null);
});
