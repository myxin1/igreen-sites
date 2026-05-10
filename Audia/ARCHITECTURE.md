# Audia Architecture

Audia is currently delivered as a browser-first static app so it can run without build tooling.
The production entrypoints remain:

- `index.html` for the landing page
- `app.html` for the app experience
- `components/header` for the shared top navigation component
- `components/body` for landing body behavior and body structure references
- `components/footer` for the shared footer component used across static pages
- `js/` for runtime services
- `css/` for the visual system

The expandable product architecture is scaffolded as:

- `frontend/components` reusable UI pieces
- `frontend/screens` screen-level flows
- `frontend/services` browser services and adapters
- `backend/api` future HTTP endpoints
- `backend/audio-engine` future server audio generation or presets
- `backend/user-data` future auth, progress and subscription storage
- `backend/recommendation-system` future AI personalization layer
- `roadmap` strategic execution board with progress and forecast
- `components/header` shared HTML/CSS/JS header with theme icons and app CTA
- `components/body` shared landing interactions and body structure notes
- `components/footer` shared HTML/CSS/JS footer with background boxes effect

Current service mapping:

- `js/audio-engine.js` -> Web Audio runtime
- `js/recommendation.js` -> mental-state recommendation system
- `js/storage.js` -> local user data, streaks and progress
- `js/sessions.js` -> guided protocols, categories and state definitions
- `js/app.js` -> screens, components and interaction controller
