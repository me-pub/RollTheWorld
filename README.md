# Roll the World

Roll the World is a daily global luck challenge. Each day every player rolls a random number between 1 and today's estimated world population. Your device's best rolls climb a shared leaderboard while your personal history and streaks live on your phone.

## Core Features
- Daily roll that locks in once per UTC day and celebrates big wins with haptics and confetti.
- Global leaderboard with a top 100 view plus a personalized "around you" slice.
- Timeline view that tracks past rolls, ranks, and your current streak of consecutive days played.
- Privacy-first design that keeps identifiers hashed in Turso and only stores a short device fingerprint locally.
- Settings panel with quick access to your device hash, cache reset, and runtime configuration values.

## Tech Stack
- Expo + React Native with Expo Router for navigation.
- Turso (libSQL) as the backing data store for rolls and leaderboards.
- Expo services such as expo-linear-gradient, expo-blur, and expo-haptics to elevate the UI.
- TypeScript throughout the app, with shared utilities in constants, hooks, lib, store, and utils.

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure environment variables by copying .env.example to .env and filling in the Turso connection details.

3. Start the app

   ```bash
   npx expo start
   ```

In the terminal output you can choose to open the project in a development build, Android emulator, iOS simulator, or Expo Go.

## Project Layout
- app/ holds the routed screens, including the tab-based Home, History, Leaderboard, and Settings views.
- components/ contains shared UI primitives such as themed text.
- lib/roll-service.ts encapsulates network calls to Turso for rolls, history, and leaderboards.
- utils/ provides device, date, and caching helpers used across the app.

## Contributing
Pull requests and feedback that improve the daily roll experience are welcome. If you find an issue, feel free to open a ticket with the bug, what you expected to happen, and the steps to reproduce it.
