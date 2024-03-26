import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {viteStaticCopy} from "vite-plugin-static-copy";

export const __dirname = new URL('.', import.meta.url).pathname;


// https://vitejs.dev/config/
export default defineConfig({
  base:'/evoludraw/',
  optimizeDeps: {
    // A workaround for Vite bug: https://github.com/vitejs/vite/issues/13314#issuecomment-1560745780
    exclude: ["@evolu/react"],
    // Another workaround for Vite bug: https://github.com/radix-ui/primitives/discussions/1915#discussioncomment-5733178
    include: ["react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `[name][hash].js`,
        chunkFileNames: `[name][hash].js`,
        assetFileNames: `[name][hash].[ext]`,
      },
    },
  },
  worker: {
    format: "es",
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: __dirname + '/node_modules/@excalidraw/excalidraw/dist/excalidraw-assets/*',
          dest: 'assets/excalidraw/excalidraw-assets',
        }
      ],
    }),],
  define: {
    'process.env': {}
  },
})
