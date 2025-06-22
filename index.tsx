
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeDb } from './services/db';

initializeDb(); // Initialize mock DB with some seed data

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
