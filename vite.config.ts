import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
import Userscript from "vite-userscript-plugin"
import { name, version } from "./package.json"

export default defineConfig({
  plugins: [
    tailwindcss(),
    Userscript({
        entry: "src/main.js",
        header: {
          name,
          version,
          match: [
            "http://localhost:3000",
            "http://localhost:5173",
            "https://wplace.live"
          ]
        },
        server: {
          port: 3000
        }
      })
      ],
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});

