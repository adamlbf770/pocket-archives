/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  INVENTORY_MEDIA_UPLOAD_TOKEN?: string;
  INVENTORY_MEDIA: {
    get(key: string): Promise<{
      body: ReadableStream;
      httpEtag?: string;
      httpMetadata?: { contentType?: string; cacheControl?: string };
    } | null>;
    head(key: string): Promise<object | null>;
    put(
      key: string,
      body: ReadableStream,
      options: { httpMetadata: { contentType: string; cacheControl: string } },
    ): Promise<object>;
  };
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/media/upload") {
      const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (!env.INVENTORY_MEDIA_UPLOAD_TOKEN || supplied !== env.INVENTORY_MEDIA_UPLOAD_TOKEN) {
        return Response.json({ error: "Not authorized." }, { status: 401 });
      }
      const key = url.searchParams.get("key") || "";
      const allowedKey = /^(inventory-previews|art)\/[A-Za-z0-9_@+.,()' -]+(?:\/[A-Za-z0-9_@+.,()' -]+)*\.(?:jpe?g|png|webp|gif)$/i;
      if (!allowedKey.test(key) || key.includes("..")) {
        return Response.json({ error: "Invalid media key." }, { status: 400 });
      }
      if (request.method === "HEAD") {
        return new Response(null, { status: await env.INVENTORY_MEDIA.head(key) ? 204 : 404 });
      }
      const length = Number(request.headers.get("content-length") || 0);
      if (request.method !== "PUT" || !request.body || length < 1 || length > 8 * 1024 * 1024) {
        return Response.json({ error: "Invalid media request." }, { status: 400 });
      }
      const contentType = request.headers.get("content-type") || "application/octet-stream";
      await env.INVENTORY_MEDIA.put(key, request.body, {
        httpMetadata: {
          contentType,
          cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
      return Response.json({ key, stored: true });
    }

    if (
      (request.method === "GET" || request.method === "HEAD") &&
      (url.pathname.startsWith("/inventory-previews/") || url.pathname.startsWith("/art/"))
    ) {
      // Local development still serves public/ directly. Hosted builds omit
      // these large folders and transparently fall back to R2.
      const asset = await env.ASSETS.fetch(request);
      if (asset.ok) return asset;
      const object = await env.INVENTORY_MEDIA.get(decodeURIComponent(url.pathname.slice(1)));
      if (!object) return new Response("Not found", { status: 404 });
      const headers = new Headers({
        "Cache-Control": object.httpMetadata?.cacheControl || "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Type": object.httpMetadata?.contentType || "image/jpeg",
      });
      if (object.httpEtag) headers.set("ETag", object.httpEtag);
      return new Response(object.body, { headers });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    // The dealer catalog shares deployment infrastructure while remaining a
    // distinct host and route surface. Commerce services can be replaced later
    // without moving the main archive application.
    if (url.hostname === "shop.pocketarchives.com") {
      if (url.pathname === "/") url.pathname = "/shop";
      const objectMatch = url.pathname.match(/^\/objects\/([^/]+)$/);
      if (objectMatch) url.pathname = `/objects/${objectMatch[1]}`;
      request = new Request(url, request);
    }

    if (url.hostname === "inventory.pocketarchives.com" && url.pathname === "/") {
      url.pathname = "/inventory";
      request = new Request(url, request);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
