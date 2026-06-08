import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      // Exclude the _auth/index stub — public routes/index.tsx owns "/"
      routeFileIgnorePattern: "_auth/index",
    }),
    react(),
    VitePWA({
      registerType: "autoUpdate",

      // Pre-cache all build output + static assets
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // Allow the SW to cache API responses from the same origin
        runtimeCaching: [
          {
            urlPattern: /^\/trpc\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "trpc-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },

      includeAssets: ["logo.png", "icon-192.png", "icon-512.png"],

      manifest: {
        name: "GymTracker",
        short_name: "GymTracker",
        description: "Workout & Nutrition Tracker — offline-first",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      // Keep the SW active in dev so you can test install flow in Chrome
      devOptions: { enabled: true },
    }),
  ],
});
