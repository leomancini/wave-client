import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

// Force service worker registration in development
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-workers/web-push-notifications.js")
    .then((registration) => {
      console.log("SW registered:", registration);
    })
    .catch((error) => {
      console.log("SW registration failed:", error);
    });
}
