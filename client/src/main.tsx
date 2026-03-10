import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const buildVersion = (typeof __BUILD_VERSION__ !== 'undefined' ? __BUILD_VERSION__ : new Date().toISOString().split('T')[0]) as string;

    navigator.serviceWorker.register(`/sw.js?v=${buildVersion}`)
      .then(registration => {
        console.log('Service Worker registered:', registration.scope);

        setInterval(() => {
          registration.update();
        }, 1800000);

        if ('sync' in registration) {
          console.log('Background Sync is supported');
        }
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

declare const __BUILD_VERSION__: string;
