import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// İki ayrı build hedefi:
//  - default: popup + background. İkisi de ES module olarak yüklenir, ortak
//    kodu chunks/ altında paylaşabilirler.
//  - content: content script TEK BAŞINA derlenir. Manifest V3'te content
//    script'leri klasik script olarak yüklenir (ES module değil); içinde
//    `import` kalırsa sayfada hiç çalışmaz, mesaj dinleyicisi kaydolmaz ve
//    chrome.tabs.sendMessage "Content script sayfada bulunamadı." ile reddedilir.
//    Bu yüzden ayrı, kendi içinde tam (chunk'sız) bir IIFE bundle üretiyoruz.
const isContent = process.env.BUILD_TARGET === 'content';

export default defineConfig({
  plugins: [react()],

  // public/ (manifest.json + icons) yalnızca ilk build'de kopyalanır.
  publicDir: isContent ? false : 'public',

  build: {
    outDir: 'dist',
    // content build ilk build'in çıktısını silmemeli.
    emptyOutDir: !isContent,
    sourcemap: false,
    rollupOptions: isContent
      ? {
          input: { content: resolve(__dirname, 'src/content/index.ts') },
          output: {
            entryFileNames: '[name].js',
            // Tek dosya, import yok → klasik script olarak güvenle yüklenir.
            inlineDynamicImports: true,
            format: 'iife',
          },
        }
      : {
          input: {
            popup:      resolve(__dirname, 'popup.html'),
            background: resolve(__dirname, 'src/background/index.ts'),
          },
          output: {
            // Sabit isimler — manifest.json bu isimlerle referans veriyor
            entryFileNames: '[name].js',
            chunkFileNames: 'chunks/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash][extname]',
            manualChunks(id) {
              if (id.includes('pdfmake')) return 'pdfmake';
            },
          },
        },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
