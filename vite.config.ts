import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import vue from "@vitejs/plugin-vue";
import jsx from "@vitejs/plugin-vue-jsx";
import pkg from "./package.json";

import { resolve } from "path";

export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "IDBReactive",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: [
        ...Object.keys(pkg.peerDependencies),
        ...Object.keys(pkg.devDependencies),
      ],
      treeshake: true,
    },
    outDir: "./dist",
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      compilerOptions: {
        esModuleInterop: true,
      },
    }),
    vue(),
    jsx(),
  ],
});
