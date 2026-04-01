# GEMINI.md - MTB Race Timer

This document provides essential context and instructions for AI agents working on the MTB Race Timer project.

## Project Overview

MTB Race Timer is a specialized Progressive Web App (PWA) designed for timing mountain bike races. It supports multi-track/multi-stage events, real-time synchronization via Firebase, and offline-first capabilities through local backups.

### Core Technologies
- **Frontend:** React 19, Vite (Build Tool)
- **State Management:** Zustand (`useRaceStore`)
- **Backend:** Firebase (Firestore for real-time data, Anonymous Auth for sessions)
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **Testing:** Vitest, React Testing Library
- **PWA:** `vite-plugin-pwa` for service worker management

## Architectural Concepts

### Data Structure & Identifiers
- **Event & Track:** An "Event" (e.g., "DH Championships") contains multiple "Tracks" (e.g., "Stage 1", "Stage 2").
- **`activeRaceId`**: A composite key formatted as `EVENT-NAME_TRACK-NAME`. This ID is used as a `raceId` field in the `riders` collection to segment data.
- **Rider ID**: Riders in Firestore use a composite ID: `${activeRaceId}_${riderNumber}` (e.g., `DH-CHAMPS_STAGE-1_105`). This ensures uniqueness across events and tracks.

### State Management (`src/store/raceStore.js`)
- The `useRaceStore` is the "Source of Truth" for the application.
- It manages Firebase subscriptions (`subscribeToRiders`), auth state, and all CRUD operations for riders and tracks.
- **Key Actions:**
    - `handleStart(rider)`: Sets `startTime` and moves rider to `ON_TRACK`.
    - `handleFinish(rider)`: Sets `finishTime`, calculates `durationMs`, and sets status to `FINISHED`.
    - `importRidersToDb(riders)`: Bulk imports riders and clones them across all tracks in an event.

### Business Logic & Hooks
- **`useRiderLists.js`**: Derives filtered and sorted lists from the flat `riders` array in the store.
    - `ridersOnTrack`: Riders with status `ON_TRACK`, sorted by start time.
    - `finishedRiders`: Riders with status `FINISHED`, sorted by fastest duration.
    - `waitingRiders`: Riders with status `WAITING`, sorted by bib number or by overall standings if in a multi-track event.
- **`utils.js`**: Contains critical time calculation and formatting logic. Use `formatDuration(ms)` for consistent result display (HH:MM:SS.cs).

## Development Conventions

### Styling & UI
- Use **Tailwind CSS** for all styling.
- Follow the existing color palette:
    - **Slate:** Primary UI background and containers.
    - **Orange/Amber:** Timing-related actions (Starter).
    - **Red:** Destructive actions (DNF, DNS, Delete).
    - **Green:** Success states and Finish captures.
- Reusable components are in `src/components/` (e.g., `Badge`, `Card`, `ConfirmDialog`).

### Testing
- Tests are located in `src/tests/`.
- Use `npm run test` to execute Vitest.
- **Rule:** For any bug fix, a reproduction test case should be added to `useRiderLists.test.js` or `raceTest.js`.

### Error Handling & Notifications
- Use `react-hot-toast` for user feedback.
- Destructive actions (e.g., marking a rider DNF) MUST require user confirmation via `ConfirmDialog`.

## Building and Running

- **Development:** `npm run dev`
- **Production Build:** `npm run build`
- **Linting:** `npm run lint`
- **Testing:** `npm run test`
- **Preview:** `npm run preview`

## Project Roadmap / TODOs
- [ ] Implement robust offline sync conflict resolution (currently uses simple local backup).
- [ ] Add export to CSV/Excel functionality for results.
- [ ] Enhance overall results view to better aggregate times across all stages.
