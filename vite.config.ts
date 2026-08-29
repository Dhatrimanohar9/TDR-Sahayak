import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { openAiProxyPlugin } from "./server/openai-proxy";

export default defineConfig({
  plugins: [react(), tailwindcss(), openAiProxyPlugin()],
});
