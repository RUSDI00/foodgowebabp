import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process'; // Added this line

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables from .env file based on the mode (development, production, etc.)
  // process.cwd() is the project root.
  // The third argument '' means all env variables are loaded, not just those prefixed with VITE_.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This makes process.env.API_KEY available in your client-side code.
      // Vite normally exposes env variables via import.meta.env.
      // JSON.stringify is important to correctly stringify the value.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // You can define other process.env variables here if needed
      // 'process.env.NODE_ENV': JSON.stringify(mode), // Example
    }
  };
});