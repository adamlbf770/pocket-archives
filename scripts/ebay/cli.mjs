#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { ebayRequest, validAccessToken } from "./api.mjs";
import {
  MARKETPLACE_ID,
  REQUIRED_OAUTH_SCOPES,
  buildInventoryItem,
  buildOffer,
  findCardConditionDescriptor,
  normalizeDraft,
  sanitizeOrders,
} from "./core.mjs";
import { CREDENTIALS, writeCredential } from "./keychain.mjs";

const projectRoot = resolve(import.meta.dirname, "../..");
const dataDir = resolve(projectRoot, "data/ebay");
const accountConfigPath = resolve(dataDir, "account-config.json");

const [command = "help", ...args] = process.argv.slice(2);

try {
  switch (command) {
    case "store":
      await storeSecret(args[0]);
      break;
    case "doctor":
      await doctor();
      break;
    case "sync-config":
      await syncConfig();
      break;
    case "setup-location":
      await setupLocation(args);
      break;
    case "draft":
      await createDraft(args);
      break;
    case "orders":
      await exportOrders(args);
      break;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  console.error(`\n${error.message}\n`);
  process.exitCode = 1;
}

async function storeSecret(name) {
  if (!Object.hasOwn(CREDENTIALS, name)) {
    throw new Error(`Credential must be one of: ${Object.keys(CREDENTIALS).join(", ")}`);
  }
  let value = "";
  if (stdin.isTTY) {
    const input = createInterface({ input: stdin, output: stdout });
    value = await input.question(`Paste ${name}, then press Return: `);
    input.close();
  } else {
    for await (const chunk of stdin) value += chunk;
  }
  writeCredential(name, value);
  console.log(`${name} stored securely in macOS Keychain.`);
}

async function doctor() {
  await validAccessToken();
  const privileges = await ebayRequest("/sell/account/v1/privilege");
  console.log("eBay Production connection: ready");
  if (privileges?.sellingLimit) {
    console.log("Seller privileges: readable");
  }
  console.log(`Authorized scopes: ${REQUIRED_OAUTH_SCOPES.length} (minimal Pocket Archives set)`);
}

async function syncConfig() {
  const [locations, fulfillment, payment, returns] = await Promise.all([
    ebayRequest("/sell/inventory/v1/location?limit=100"),
    ebayRequest(`/sell/account/v1/fulfillment_policy?marketplace_id=${MARKETPLACE_ID}`),
    ebayRequest(`/sell/account/v1/payment_policy?marketplace_id=${MARKETPLACE_ID}`),
    ebayRequest(`/sell/account/v1/return_policy?marketplace_id=${MARKETPLACE_ID}`),
  ]);

  const activeLocations = (locations?.locations ?? []).filter(
    (location) => location.merchantLocationStatus === "ENABLED",
  );
  const config = {
    marketplaceId: MARKETPLACE_ID,
    merchantLocationKey: requireSingle("enabled inventory location", activeLocations)?.merchantLocationKey,
    fulfillmentPolicyId: pickPolicy(
      fulfillment?.fulfillmentPolicies,
      "fulfillment",
      /Pocket Archives ESE 78 cents/i,
    ).fulfillmentPolicyId,
    paymentPolicyId: pickPolicy(
      payment?.paymentPolicies,
      "payment",
      /^Pocket Archives - Payment$/i,
    ).paymentPolicyId,
    returnPolicyId: pickPolicy(
      returns?.returnPolicies,
      "return",
      /^Pocket Archives - No Returns$/i,
    ).returnPolicyId,
    syncedAt: new Date().toISOString(),
  };

  await writeJson(accountConfigPath, config);
  console.log(`Saved eBay account configuration to ${accountConfigPath}`);
  console.log(`Location: ${config.merchantLocationKey}`);
  console.log(`Fulfillment policy: ${config.fulfillmentPolicyId}`);
  console.log(`Payment policy: ${config.paymentPolicyId}`);
  console.log(`Return policy: ${config.returnPolicyId}`);
}

async function setupLocation(args) {
  const postalCode = flagValue(args, "--postal");
  if (!/^\d{5}(?:-\d{4})?$/.test(postalCode ?? "")) {
    throw new Error("Use: npm run ebay -- setup-location --postal 33067 [--apply]");
  }
  const merchantLocationKey = `pocket-archives-${postalCode.slice(0, 5)}`;
  const payload = {
    name: "Pocket Archives Shipping Origin",
    location: { address: { postalCode, country: "US" } },
    locationTypes: ["WAREHOUSE"],
    merchantLocationStatus: "ENABLED",
  };

  if (!args.includes("--apply")) {
    console.log("Location validated. No eBay data was changed.");
    console.log(JSON.stringify({ merchantLocationKey, ...payload }, null, 2));
    return;
  }

  await ebayRequest(`/sell/inventory/v1/location/${encodeURIComponent(merchantLocationKey)}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  console.log(`Created enabled eBay inventory location ${merchantLocationKey}.`);
}

async function createDraft(args) {
  const inputPath = flagValue(args, "--file") ?? args.find((arg) => !arg.startsWith("--"));
  if (!inputPath) throw new Error("Use: npm run ebay -- draft --file path/to/draft.json [--apply]");

  const draft = normalizeDraft(JSON.parse(await readFile(resolve(inputPath), "utf8")));
  const accountConfig = JSON.parse(await readFile(accountConfigPath, "utf8"));
  const conditionPolicies = await ebayRequest(
    `/sell/metadata/v1/marketplace/${MARKETPLACE_ID}/get_item_condition_policies?filter=categoryIds:%7B${encodeURIComponent(draft.categoryId)}%7D`,
  );
  const resolvedCondition = findCardConditionDescriptor(
    conditionPolicies,
    draft.categoryId,
    draft.cardCondition,
  );
  const inventoryItem = buildInventoryItem(draft, resolvedCondition);
  const offer = buildOffer(draft, accountConfig);

  if (!args.includes("--apply")) {
    console.log("Draft validated. No eBay data was changed.");
    console.log(JSON.stringify({ sku: draft.sku, title: draft.title, price: draft.price, status: "UNPUBLISHED" }, null, 2));
    console.log("Run again with --apply to create the unpublished eBay offer.");
    return;
  }

  await ebayRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(draft.sku)}`, {
    method: "PUT",
    body: JSON.stringify(inventoryItem),
  });
  const created = await ebayRequest("/sell/inventory/v1/offer", {
    method: "POST",
    body: JSON.stringify(offer),
  });

  const result = {
    sku: draft.sku,
    offerId: created.offerId,
    status: "UNPUBLISHED",
    createdAt: new Date().toISOString(),
    shippingProfile: draft.shippingProfile,
    ...(draft.verification ? { verification: draft.verification } : {}),
  };
  await writeJson(resolve(dataDir, "drafts", `${safeFilename(draft.sku)}.json`), result);
  console.log(`Created unpublished eBay offer ${created.offerId} for ${draft.sku}.`);
  console.log("Nothing was published or made buyable.");
}

async function exportOrders(args) {
  const days = Number(flagValue(args, "--days") ?? 90);
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new Error("--days must be an integer from 1 to 90.");
  }
  const from = new Date(Date.now() - days * 86_400_000).toISOString();
  const filter = encodeURIComponent(`creationdate:[${from}..${new Date().toISOString()}]`);
  const rawOrders = [];
  let offset = 0;
  let total = 0;
  do {
    const response = await ebayRequest(
      `/sell/fulfillment/v1/order?filter=${filter}&limit=200&offset=${offset}`,
    );
    rawOrders.push(...(response?.orders ?? []));
    total = Number(response?.total ?? rawOrders.length);
    offset += Number(response?.limit ?? 200);
  } while (offset < total);
  const orders = sanitizeOrders({ orders: rawOrders });
  const outputPath = resolve(dataDir, "orders.json");
  await writeJson(outputPath, { exportedAt: new Date().toISOString(), orders });
  console.log(`Exported ${orders.length} sanitized orders to ${outputPath}.`);
  console.log("Buyer names, addresses, emails, and usernames were not saved.");
}

function pickPolicy(policies = [], label, preferredName = null) {
  const candidates = policies.filter((policy) =>
    (policy.categoryTypes ?? []).some((category) => category.name === "ALL_EXCLUDING_MOTORS_VEHICLES"),
  );
  const preferred = preferredName
    ? candidates.find((policy) => preferredName.test(policy.name ?? ""))
    : null;
  if (preferred) return preferred;
  return requireSingle(`${label} policy`, candidates);
}

function requireSingle(label, values = []) {
  if (values.length === 1) return values[0];
  if (values.length === 0) throw new Error(`No ${label} was found in eBay.`);
  throw new Error(`Multiple ${label} policies were found. Set the intended ID in ${accountConfigPath}.`);
}

function flagValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function safeFilename(value) {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
}

function printHelp() {
  console.log(`Pocket Archives eBay assistant\n\nCommands:\n  store <credential>       Read a secret from stdin into macOS Keychain\n  doctor                  Verify Production API access\n  setup-location          Create the required warehouse location (add --apply)\n  sync-config             Discover active location and business policies\n  draft --file FILE       Validate an unpublished offer (add --apply to create it)\n  orders [--days 90]      Export sold/shipped status without buyer PII\n\nThis tool intentionally has no publish command.`);
}
