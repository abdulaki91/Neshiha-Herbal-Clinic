import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // esbuild: {
  //   // Strip console.* calls and debugger statements from the production
  //   // build only — dev keeps them since console.log is still useful while
  //   // working locally. esbuild is Vite's default minifier, so this needs
  //   // no extra dependency.
  //   drop: mode === 'production' ? ['console', 'debugger'] : [],
  // },
  build: {
    rollupOptions: {
      output: {
        // Split vendor code out of the app bundle so browsers can cache it
        // across deploys instead of re-downloading it every release, and so
        // one 700kB+ "everything" chunk doesn't dominate the first load.
        //
        // Only socket.io-client is split into its own chunk here — it has
        // no dependency on React at all, so it's safe regardless of chunk
        // evaluation order. Everything else (react, react-dom, react-router,
        // @tanstack/react-query, react-icons, react-hook-form, react-i18next,
        // react-helmet-async, ...) stays in one chunk together on purpose:
        // several of those packages call React.createContext(...) at module
        // load time, so splitting react/react-dom into their own chunk
        // separately from those consumers is a known Rollup footgun — if the
        // consumer's chunk happens to evaluate before react's chunk has
        // finished, `React` is still undefined and that call throws
        // "Cannot read properties of undefined (reading 'createContext')".
        // Keeping them together guarantees correct evaluation order.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("socket.io")) return "vendor-socket";
          return "vendor";
        },
      },
    },
  },
}));
