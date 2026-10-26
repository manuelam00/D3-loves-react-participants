import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/D3-loves-react-participants/",
  plugins: [react()],
});
