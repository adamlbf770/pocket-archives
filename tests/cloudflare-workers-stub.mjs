const unsupported = () => {
  throw new Error("Cloudflare binding used by a Node-only render test.");
};

export const env = {
  DB: {
    prepare: unsupported,
    batch: unsupported,
  },
  INVENTORY_MEDIA: {
    get: unsupported,
    head: unsupported,
    put: unsupported,
  },
};
