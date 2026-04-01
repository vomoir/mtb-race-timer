# MTB Race Timer - Components Directory

This directory contains the React components for the MTB Race Timer application, a specialized tool for timing mountain bike races.

## Project Overview

The MTB Race Timer is a web-based application designed to manage rider starts, capture finish times, and generate real-time results. It supports multi-track events, category filtering, and solo/mass start modes.

### Key Technologies
- **Framework:** React (Functional Components & Hooks)
- **State Management:** Zustand (via `useRaceStore`)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **UI Components:** Headless UI patterns with custom Tailwind styling

## Directory Structure & Key Components

### Core Timing Operations
- **`Starter.jsx`**: Handles starting riders. Supports bib number entry, waiting lists with category filtering, and DNS (Did Not Start) marking.
- **`FinishLine.jsx`**: Manages the finish line. Features "Capture" mode for quick timestamping, "On Track" monitoring, and a "Log" for review. Supports DNF (Did Not Finish) marking.
- **`RaceClock.jsx`**: Displays the elapsed time since the first rider started.

### Data & Results
- **`Results.jsx` / `OverallResults.jsx`**: Displays race standings, times, and gaps.
- **`EventSummary.jsx`**: Provides a high-level overview of the current event's progress.
- **`RiderImporter.jsx` / `RiderRegistration.jsx`**: Tools for bulk-importing riders or cloning registrations from other tracks.

### UI Primitives & Utilities
- **`Badge.jsx` / `Card.jsx`**: Reusable UI components for consistent styling.
- **`ConfirmDialog.jsx` / `TrackDialog.jsx`**: Specialized modal dialogs for critical actions.
- **`Header.jsx`**: Main navigation and event status bar.
- **`LoadingStates.jsx` / `LoginScreen.jsx`**: Application lifecycle and authentication UI.

### Sub-directories
- **`starter/`**: Contains specialized sub-components for the Starter view, such as `CategoryFilter.jsx` and `TabButton.jsx`.

## Development Conventions

- **State Access**: Use the `useRaceStore` hook for all global state (riders, timing logs, event config).
- **Business Logic**: Complex list transformations (e.g., filtering riders "on track" vs "waiting") should be handled in `useRiderLists` hook or `utils.js` rather than inside components.
- **Styling**: Prefer utility-first CSS via Tailwind. Follow the existing color palette (Slate for UI, Orange/Red for timing actions, Green for success/starts).
- **Safety**: Always include confirmation dialogs for destructive actions (DNF, DNS, deleting logs).

## Building and Running
The project appears to be a Vite-based React application.
- `npm run dev`: Start the development server.
- `npm run build`: Build for production.
- `npm test`: Run tests (if configured).

> TODO: Verify exact build commands in the root `package.json`.
