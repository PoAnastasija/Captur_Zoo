'use client';

import { useEffect } from 'react';

export default function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker enregistré:', registration);
          })
          .catch((error) => {
            console.log('Erreur Service Worker:', error);
          });
      });
    }
  }, []);

  return null;
}