import React from "react";
import ReactDOM from "react-dom/client";
import MobileApp from "./MobileApp";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
        updateViaCache: "none",
      })
      .catch((error) => console.warn("[LYNE Mobile] service worker registration failed", error));
  });
}

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <MobileApp />
    </React.StrictMode>,
  );
}
