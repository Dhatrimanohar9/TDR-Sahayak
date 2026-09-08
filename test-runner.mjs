import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});

try {
  await server.ssrLoadModule("./test-matrix.mjs");
} finally {
  await server.close();
}
