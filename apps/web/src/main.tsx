import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import { initializeTelegramWebApp } from "./platform/telegram";
import "./styles/global.css";

// Инициализация Telegram Mini App, если приложение открыто в Telegram.
initializeTelegramWebApp();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);