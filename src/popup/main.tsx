import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Yerel fontlar (Vite woff2'leri dist/'e gömer → MV3 CSP uyumlu, CDN yok).
// Arayüz: Geist Sans · Mono: Geist Mono · Okuma: Source Serif 4.
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/500.css';
import '@fontsource/source-serif-4/600.css';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
