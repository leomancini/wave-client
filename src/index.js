import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-workers/web-push-notifications.js")
    .catch((error) => {
      console.error("SW registration failed:", error);
    });
}
