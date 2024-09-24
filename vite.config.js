import path from "path";
import { defineConfig } from "vite";
import { ViteEjsPlugin } from "vite-plugin-ejs";

export default defineConfig({
  root: path.resolve(__dirname),
  publicDir: "public",
  plugins: [
    ViteEjsPlugin({
      title: "YouGES",
      description: "A simple app to manage your school life",
    }),
  ],
  server: {
    port: 5655,
    open: true,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "views"),
      },
    },
  },
});
