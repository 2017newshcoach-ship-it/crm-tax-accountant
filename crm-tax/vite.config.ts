import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Figma Make asset imports (figma:asset/...) are not available outside Figma.
// This plugin resolves them to an empty transparent PNG data URL for local dev/testing.
function figmaAssetPlugin(): Plugin {
  const EMPTY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return {
    name: 'figma-asset-mock',
    enforce: 'pre',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) return id;
    },
    load(id) {
      if (id.startsWith('figma:asset/')) {
        return `export default ${JSON.stringify(EMPTY_PNG)};`;
      }
    },
  };
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    figmaAssetPlugin(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    historyApiFallback: true,
  },
})
