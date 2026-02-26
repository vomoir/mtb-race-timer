import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  test: {
    environment: 'jsdom', // This "fakes" the browser environment
    globals: true,
    setupFiles: './src/tests/setup.js', // This file will run before each test suite
    include: ['src/tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    server: {
      deps: {
        inline: [/@csstools/, /@asamuzakjp\/css-color/],
      },
    },
    css: true, 
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // Automatically updates when new code is deployed
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "MTB Race Timer Pro",
        short_name: "MTB Timer",
        description: "Ride Dungog® Mountain Bike Race Timing App",
        theme_color: "#ff4500",
        background_color: "#1a1a1a",
        display: "standalone",
        icons: [
          {
            src: "images/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "images/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "images/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
