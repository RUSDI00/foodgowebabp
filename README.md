# FoodGo E-commerce Project

A fully functional e-commerce platform named FoodGo, featuring user and admin panels, product listings, cart, checkout, wallet, notifications, and promo management.

## Prerequisites

- Node.js (v18 or newer recommended)
- npm (usually comes with Node.js) or yarn (optional)

## Setup

1.  **Download or Clone:**
    If you downloaded the project files, ensure they are extracted into a dedicated folder. If this were a git repository, you would clone it.

2.  **Navigate to Project Directory:**
    Open your terminal (like the integrated terminal in VS Code) and navigate to the root directory of the project (where `package.json` is located).
    ```bash
    cd path/to/your/foodgo-ecommerce
    ```

3.  **Install Dependencies:**
    Run the following command to install all the necessary project dependencies:
    ```bash
    npm install
    ```
    (Or, if you prefer using yarn: `yarn install`)

4.  **Environment Variables (for API Keys):**
    This project is set up to potentially use APIs like the Gemini API. To manage API keys securely:
    *   Create a new file named `.env` in the root of your project (the same directory as `package.json`).
    *   Add your API keys to this file in the format `VARIABLE_NAME="your_key_here"`. For example, for the Gemini API, you would add:
        ```env
        API_KEY="YOUR_GEMINI_API_KEY_HERE"
        ```
    *   **Important:** The `.env` file should **not** be committed to version control if this were a public repository. An `.env.example` file is provided to show the structure.
    *   The application (via `vite.config.ts`) is configured to make `process.env.API_KEY` available in the client-side code if an `API_KEY` is defined in your `.env` file.

## Running the Development Server

Once the setup is complete, you can start the local development server:

```bash
npm run dev
```
(Or, with yarn: `yarn dev`)

This command will start the Vite development server. It will typically open the application in your default web browser at a local address (e.g., `http://localhost:5173`). If it doesn't open automatically, the terminal will display the URL you can use.

Vite provides Hot Module Replacement (HMR), meaning changes you make to the code will often update in the browser almost instantly without a full page reload.

## Building for Production (Informational)

To create an optimized build of your application for deployment:

```bash
npm run build
```
(Or, with yarn: `yarn build`)

This command will:
1.  Run TypeScript (`tsc`) to check for type errors (as per the `build` script in `package.json`).
2.  Use Vite to bundle your code, optimize assets, and place them in a `dist` folder.

You can then preview this production build locally:
```bash
npm run preview
```

## Project Structure Overview

-   `index.html`: The main HTML entry point for the application.
-   `index.tsx`: The main React/TypeScript entry point that renders the `App` component into the DOM.
-   `App.tsx`: The root React component containing the main application structure and routing setup.
-   `components/`: Directory for reusable UI components (e.g., `Navbar.tsx`, `ProductCard.tsx`).
-   `hooks/`: Directory for custom React hooks (e.g., `useAuth.tsx`).
-   `pages/`: Directory for top-level page components, organized by user and admin sections.
-   `services/`: Directory for modules handling business logic and data operations (currently using `localStorage` as a mock database).
-   `types.ts`: Contains all TypeScript type definitions and interfaces for the application.
-   `constants.ts`: Stores application-wide constants.
-   `package.json`: Lists project dependencies, scripts, and metadata.
-   `vite.config.ts`: Configuration file for Vite (bundler and dev server).
-   `tsconfig.json`: Main TypeScript compiler configuration.
-   `tsconfig.node.json`: TypeScript configuration for Node.js-specific files (like `vite.config.ts`).
-   `.env.example`: An example file showing the structure for environment variables.

## Key Technologies Used

-   React (v19)
-   TypeScript
-   React Router DOM (v6) for client-side routing
-   Recharts for data visualization (charts in Admin Dashboard)
-   Tailwind CSS (via CDN for styling)
-   Font Awesome (via CDN for icons)
-   Vite for development server and bundling
