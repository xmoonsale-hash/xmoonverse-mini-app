
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/global.css";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

const telegramWebApp = window.Telegram?.WebApp;

// Сообщаем Telegram, что интерфейс готов.
telegramWebApp?.ready();

// Просим Telegram развернуть приложение на доступную высоту.
telegramWebApp?.expand();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
