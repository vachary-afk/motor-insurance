import { registerRootComponent } from 'expo';

import App from './App';

// Register service worker for PWA support (web only)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed — app still works
    });
  });
}

registerRootComponent(App);
