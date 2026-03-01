# Project File Guide — CarHunter (Expo Go)

This document describes every file in the repository after the cleanup, Expo Go restoration, and refactor passes. Use it to understand architecture, data flow, and where to change behavior.

---

## 1. High-level architecture

### App flow
- **Entry:** `expo-router/entry` (from `package.json` main) loads the Expo Router app root.
- **Root layout** (`app/_layout.tsx`): Wraps the app in `AuthProvider`, `ThemeProvider`, `GestureHandlerRootView`. Runs Supabase diagnostics once, mounts `RevenueCatInit`, and renders `AuthGate` + `RootLayoutNav`.
- **Auth gate:** Based on `session` and `profileComplete`, redirects to `/auth`, `/loading`, `/profile-details`, or `/(tabs)`.
- **Tabs:** Three tabs — Dashboard (stats), Spot (index), Garage (my-cars). Default tab on open is Spot.
- **Core loop:** User spots a car (camera or manual upload) → image sent to backend `/identify` → AI identification + XP → result stored in Supabase (spottings, spotting_photos) and in local Zustand store. Quota is enforced via profile RPC and RevenueCat entitlements; paywall is shown when limit reached.

### Key modules
- **Auth & profile:** `contexts/auth.tsx` — session, profile hydration, RevenueCat sync. `EMPTY_USER` imported from `store/useStore.ts`.
- **State:** `store/useStore.ts` (Zustand, persisted settings + in-memory spots/user/paywall, exports `EMPTY_USER`); `store/useCongratsStore.ts` (one-time congrats UI).
- **Backend:** `services/api/carhunter.ts` — FastAPI `identify` and related. Import `identifyCar` directly from here (the old `services/carIdentifier.ts` passthrough has been removed).
- **Spot save flow:** `hooks/useSaveSpot.ts` — orchestrates identify result → processSpot → store update → post-spot navigation. Used by `IdentificationSheet`.
- **Data:** `services/supabase/*` — spottings, profile, quota, legacy cars, storage, delete-user.
- **Monetization:** `services/entitlements.ts`, `services/revenuecat.ts`, `components/RevenueCatInit.tsx`, `components/paywall/PaywallModal.tsx`.

### Data flow
- **Spots:** Fetched on login in auth context (`fetchSpottingsForUser`), merged into Zustand. New spots added via `processSpot` (Supabase + store). Garage and car-detail read from store and Supabase (photos, signed URLs). Garage re-fetches on focus with a 30-second guard to avoid redundant calls.
- **Profile/XP:** From Supabase `profiles`; updated after each spot (quota RPC, XP, streak). RevenueCat listener syncs entitlements to profile.
- **Theme:** Owned exclusively by `contexts/theme.tsx` + `constants/theme.ts`; persisted to AsyncStorage under key `app_theme`. The Zustand store does **not** hold theme state — `settings.darkMode` was removed. `ThemePicker` calls `setThemeId` on the theme context directly.

---

## 2. Per-folder explanation

| Folder | Purpose |
|--------|--------|
| **app/** | Expo Router file-based routes. Each file is a screen; `_layout.tsx` files define layout/stack/tabs. |
| **components/** | Reusable UI: bottomsheets, camera, dashboard widgets, paywall, settings, stats, navigation. |
| **constants/** | Theme palette and shared constants. |
| **contexts/** | React context providers: auth (session, profile, RevenueCat), theme. |
| **hooks/** | Data hooks: save-spot orchestration, dashboard stats, legacy car photo URLs, spotting photo URLs. |
| **lib/** | Supabase client and one-time diagnostics (local console only). |
| **services/** | API client (carhunter backend), entitlements, gamification, RevenueCat, and Supabase service modules. |
| **store/** | Zustand stores: main app store (spots, user, settings, paywall), congrats store. |
| **supabase/** | Edge function (delete-user) and migrations for profiles, achievements, spottings, legacy_cars, quota RPC. |
| **types/** | Shared TypeScript types (SpottedCar, User, IdentifyResponse, etc.). |
| **utils/** | Helpers: congrats payload, car key, UUID. |
| **assets/** | App icon, splash, favicon, images. |
| **docs/** | Specs and checklists (this guide, monetization testing, appSpecs). |

---

## 3. Per-file explanation

### Root config and env
- **app.json** — Expo app config: name (CarHunter), slug, icon, splash, iOS/Android identifiers and permissions, scheme (`carhunter`), plugins (expo-camera, expo-image-picker), EAS projectId. Used by `expo start` and Expo Go.
- **package.json** — App name `car-hunter-ai`, scripts (`start`, `ios`, `android`, `web`), dependencies (no expo-dev-client). Entry: `expo-router/entry`.
- **package-lock.json** — Lockfile; do not edit by hand.
- **tsconfig.json** — Extends `expo/tsconfig.base`, strict mode, path alias `@/*` → project root.
- **babel.config.js** — Preset `babel-preset-expo`, plugin `react-native-reanimated/plugin`.
- **eas.json** — EAS Build config: preview and production profiles only (no development/dev-client profile). Used by `eas build` if you add native builds later.
- **.gitignore** — Ignores node_modules, .expo, .env, dist, build, .DS_Store; includes generated expo-cli block.
- **.env** — Local env (not committed). Required: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`; optional: `EXPO_PUBLIC_REVENUECAT_API_KEY`.
- **expo-env.d.ts** — Expo env type declarations for `process.env.EXPO_PUBLIC_*`.

### App routes (app/)
- **app/_layout.tsx** — Root layout: providers (Auth, Theme, GestureHandler), SupabaseDiagnostics, RevenueCatInit, StatusBarThemed, AuthGate, RootLayoutNav (Stack with all screens), GlobalPaywall. The redundant `if (!session) return` dead-code path in AuthGate has been removed.
- **app/(tabs)/_layout.tsx** — Tabs layout: Dashboard, Spot, Garage. Uses CustomTabBar. Forces initial tab to Spot on first open.
- **app/(tabs)/index.tsx** — Spot tab: main camera/spot entry UI. Imports `identifyCar` directly from `services/api/carhunter`.
- **app/(tabs)/my-cars.tsx** — Garage tab: list of spotted cars (from store + Supabase), search, empty state. The non-functional "Type" filter dropdown has been removed. `useFocusEffect` has a 30-second fetch guard (`useRef` timestamp) to prevent redundant Supabase calls on repeated tab focus. Dot indicators in card view are only rendered when `cars.length <= 8` to prevent layout overflow.
- **app/(tabs)/stats.tsx** — Dashboard tab: rank, XP, streak, stats; uses useDashboardStats.
- **app/auth.tsx** — Sign in / sign up form; redirects to (tabs) or profile-details.
- **app/loading.tsx** — Loading screen while profile is being hydrated.
- **app/profile-details.tsx** — Onboarding: required profile fields (e.g. username) before using app.
- **app/settings/_layout.tsx** — Settings stack layout (modal presentation).
- **app/settings/index.tsx** — Settings screen: theme, camera grid, notifications, sign out, reset garage. Uses fixed `paddingTop: 16` (not `insets.top`) because React Navigation's modal container already applies safe-area insets, preventing double-application.
- **app/settings/edit-profile.tsx** — Edit profile (name, username, location, bio). Same safe-area fix as settings/index.tsx.
- **app/paywall.tsx** — Full-screen paywall route (in addition to modal).
- **app/car-detail.tsx** — Single spotted car detail (from store + Supabase photos).
- **app/post-spot.tsx** — Post-spot screen: show identification, XP, congrats.
- **app/edit-spot.tsx** — Edit spot metadata (e.g. notes).
- **app/edit-spot-photos.tsx** — Edit photos for a spot.
- **app/add-legacy-car.tsx** — Add a legacy car (pre-migration garage).
- **app/legacy-car-detail.tsx** — Detail for a legacy car.
- **app/edit-legacy-car-photos.tsx** — Edit photos for a legacy car.
- **app/manual-upload.tsx** — Upload image from library for identification. Imports `identifyCar` directly from `../services/api/carhunter`. Manual uploads are XP-inert (no gamification side-effects).
- **app/user-profile.tsx** — View another user's profile (e.g. from leaderboard).
- **app/rank-progression.tsx** — Rank/XP progression view.
- **app/dev-reset.tsx** — Dev-only screen (hidden when !__DEV__): hard reset (sign out + clear AsyncStorage), test spotting photo signed URL. Reachable via `/dev-reset`; not in root Stack but file-based route still works.

### Components
- **components/RevenueCatInit.tsx** — Initializes RevenueCat with optional API key; syncs customer info to profile on login.
- **components/bottomsheet/CarDetailsPanel.tsx** — Bottom sheet panel showing car details (make, model, specs).
- **components/bottomsheet/ConfidenceBar.tsx** — Confidence/uncertainty bar for predictions.
- **components/bottomsheet/IdentificationSheet.tsx** — Identification bottom sheet (predictions, editable fields, multi-photo). Delegates all save logic to `hooks/useSaveSpot`. The dead local-save fallback block and floating XP animation have been removed. Image keys use URI strings (not array index).
- **components/bottomsheet/PredictionCard.tsx** — Single prediction card in list.
- **components/camera/CameraControls.tsx** — Camera capture controls (used from Spot tab).
- **components/dashboard/RankCard.tsx** — Rank display card.
- **components/dashboard/RankProgressRing.tsx** — Circular rank/XP progress.
- **components/dashboard/StatBox.tsx** — Stat box (e.g. total spots).
- **components/dashboard/StreakCard.tsx** — Streak display and 2× paywall CTA.
- **components/dashboard/XPProgressBar.tsx** — XP progress bar.
- **components/mycars/EmptyState.tsx** — Empty state for garage.
- **components/mycars/SearchBar.tsx** — Search input for garage list.
- **components/mycars/SpottedCarCard.tsx** — Card for one spotted car in garage.
- **components/navigation/CustomTabBar.tsx** — Custom tab bar (used in tabs layout).
- **components/paywall/PaywallModal.tsx** — Paywall modal (limit message, purchase options, restore).
- **components/postSpot/LevelProgress.tsx** — Level/rank progress on post-spot screen.
- **components/postSpot/TrophyCard.tsx** — Trophy card after spot.
- **components/postSpot/XpPill.tsx** — XP pill display.
- **components/settings/ThemePicker.tsx** — Theme selection UI; calls `setThemeId` on `ThemeContext` directly.
- **components/settings/ThemePreviewCard.tsx** — Theme preview card.

### Constants, contexts, hooks, lib
- **constants/theme.ts** — All theme definitions (palettes, `THEME_STORAGE_KEY = 'app_theme'`, `DEFAULT_THEME_ID = 'dark'`). Source of truth for available themes.
- **contexts/auth.tsx** — Auth context: session, signIn, signUp, signOut, profile hydration, RevenueCat sync, isAuthInitialized, profileComplete. `EMPTY_USER` is imported from `store/useStore` (not defined locally). `signOut` clears Zustand state only — it does **not** call `AsyncStorage.clear()` (which would wipe the stored theme).
- **contexts/theme.tsx** — Theme context: `themeId`, `colors`, `rarityColors`, `setThemeId`. Sole owner of theme persistence — reads/writes AsyncStorage key `app_theme` on mount and on change. Does not use `store.settings.darkMode`.
- **hooks/useDashboardStats.ts** — Aggregates dashboard stats (XP, streak, rank, etc.) from store and gamification.
- **hooks/useLegacyCarPhotoUrls.ts** — Fetches signed URLs for legacy car photos.
- **hooks/useSaveSpot.ts** — Orchestrates the full spot-save flow: fetch profile, call `processSpot`, update store user/spots, build congrats payload, navigate to `/post-spot`. Accepts callbacks for `onSuccess`, `onDuplicate`, `onPaywall`, `onError`. Used by `IdentificationSheet`.
- **hooks/useSpottingPhotoUrls.ts** — Fetches signed URLs for spotting photos.
- **lib/supabase.ts** — Creates Supabase client (env URL/anon key, AsyncStorage for auth). Exports `runSupabaseDiagnostics()` (runs once, local console only).

### Services
- **services/api/carhunter.ts** — Backend client: `identifyCar()` POST to FastAPI `/identify`, returns `IdentifyResponse`. Base URL: carhunter-backend.onrender.com. Import from here directly; do not create re-export wrappers.
- **services/entitlements.ts** — Maps RevenueCat entitlements to app features (e.g. daily limit, streak multiplier). `deriveEntitlements`: free=3 spots/day, one-time (extra_spots)=10/day, monthly=unlimited + 2× streak multiplier when streak ≥ 7.
- **services/gamification.ts** — Ranks, XP constants, getCurrentRank, getNextRank, XP for rarity.
- **services/revenuecat.ts** — RevenueCat init, setUserId, getCustomerInfoAndSync, addRevenueCatListener.
- **services/supabase/dailyLimit.ts** — Daily spot limit logic (RPC, profile fields). Defines its own local `ProfileForLimit` type; independent of `processSpot.ts`.
- **services/supabase/deleteUser.ts** — Delete user data (calls Supabase edge function if used).
- **services/supabase/legacyCarPhotos.ts** — Legacy car photo CRUD.
- **services/supabase/legacyCars.ts** — Legacy cars CRUD.
- **services/supabase/processSpot.ts** — Persist spot: spottings row, spotting_photos, profile update (XP, streak, quota). Uses and re-exports canonical `ProfileRow` from `types/index.ts` (local duplicate types removed).
- **services/supabase/profile.ts** — Fetch/update profile, checkUsernameAvailability, profileHasRequiredFields.
- **services/supabase/quota.ts** — Check/consume quota (RPC), paywall trigger.
- **services/supabase/spottingPhotos.ts** — Spotting photos fetch (primary photo path, etc.).
- **services/supabase/spottings.ts** — Fetch spottings for user, delete spotting.
- **services/supabase/storage.ts** — Signed URLs for storage objects.

### Store, types, utils
- **store/useStore.ts** — Zustand store: spots, user, settings (persisted to AsyncStorage), showPaywall, paywallLimitInfo. Actions: addSpot, setSpots, removeSpot, clearSpots, setUser, updateXP, setSetting, setShowPaywall, setPaywallLimitInfo. `EMPTY_USER` is exported for use in auth context and elsewhere. `settings` does not include `darkMode` (theme is managed by ThemeContext).
- **store/useCongratsStore.ts** — One-time congrats state (e.g. rank up) for UI.
- **types/index.ts** — Types: RarityLevel, Prediction, CarDetails, IdentifyResponse, SpottedCar (includes optional `carKey?: string`), User, UserStats, ProfileRow, Settings (no `darkMode`), LegacyCar.
- **utils/buildCongratsPayload.ts** — Builds congrats payload for post-spot (e.g. rank up).
- **utils/carKey.ts** — Generates stable key for car (make/model/year).
- **utils/uuid.ts** — UUID generation (for spot IDs, etc.).

### Supabase
- **supabase/functions/delete-user/index.ts** — Edge function: deletes or anonymizes user data (invoked from client or backend).
- **supabase/migrations/*.sql** — Migrations: profiles (with complete_profile, daily quota columns), achievements, spotting_photos, spottings policies, legacy_cars, daily_quota RPC (try_consume_spot, etc.).
- **supabase/.temp/** — Supabase CLI temp files (project ref, versions); can be gitignored or committed per team.

### Assets
- **assets/icon.png** — App icon.
- **assets/adaptive-icon.png** — Android adaptive icon.
- **assets/splash.png** — Splash screen image.
- **assets/favicon.png** — Web favicon.
- **assets/images/background.jpg** — Background image (e.g. auth/splash).

### Docs
- **docs/MONETIZATION_TESTING_CHECKLIST.md** — QA checklist for quota, paywall, restore, streak multiplier.
- **docs/appSpecs.txt** — Product and tech spec (CarHunter, stack, repo structure).

---

## 4. Removed items

### Dependencies
- **expo-dev-client** — Removed from package.json. It was used for custom development builds; Expo Go does not need it. Proof: no imports of `expo-dev-client` in app/contexts/components/services; only package.json and lockfile referenced it.

### Scripts
- **expo run:ios** / **expo run:android** — Replaced with **expo start --ios** and **expo start --android** so the app runs in Expo Go instead of a native build.

### Config
- **eas.json** — Removed the **development** build profile that had `developmentClient: true`. Preview and production profiles kept for future EAS builds.

### Directories (prebuild output)
- **ios/** — Entire folder removed. It was generated by `expo prebuild` for a custom dev client / native build. Not referenced by Expo Go; app runs in Expo Go without it.
- **android/** — Entire folder removed. Same as ios/; prebuild output for native/dev-client.

### Files (refactor pass)
- **services/carIdentifier.ts** — Deleted. It was a trivial one-liner re-exporting `identifyCar` from `services/api/carhunter.ts` with no added logic. All callers (`app/(tabs)/index.tsx`, `app/manual-upload.tsx`) now import from `services/api/carhunter` directly.

### Store fields
- **settings.darkMode** — Removed from `Settings` type and `DEFAULT_SETTINGS`. Theme state is owned exclusively by `ThemeContext` (persisted to AsyncStorage key `app_theme`). No code should read or write `store.settings.darkMode`.

### Unchanged / not removed
- **"Spotter"** in `services/gamification.ts` (rank title) — Left as-is. It is a gamification label (e.g. "Hunter", "Tracker"), not the product name "Car Spotter".
- **No Expo logging/telemetry** was present in app source; only `lib/supabase.ts` uses `console.log` for local diagnostics (documented as "local console only"). No Sentry or Expo log-forwarding was found.
- **dev-reset** — Kept; dev-only route for reset and testing, reachable via `/dev-reset`.

---

## 5. Expo Go restoration

### What was changed
- **expo-dev-client** removed from dependencies; lockfile updated with `npm install`.
- **Scripts** updated to: `start`: `expo start`; `ios`: `expo start --ios`; `android`: `expo start --android`. No `expo run:*` for default workflow.
- **eas.json** development profile (developmentClient: true) removed.
- **ios/** and **android/** deleted so the project is managed-Expo only; no native folders to maintain.

### Final run commands
- Start dev server and open in Expo Go:
  `npx expo start`
  Then scan QR with Expo Go (iOS/Android) or press `i` / `a` for simulator/emulator.
- iOS simulator: `npm run ios` (runs `expo start --ios`; opens in Expo Go in simulator if configured).
- Android emulator: `npm run android` (runs `expo start --android`; opens in Expo Go in emulator if configured).

### Constraints
- **Expo Go** supports only a subset of native APIs. Current deps (expo-camera, expo-image-picker, react-native-purchases, etc.) are compatible with Expo Go for this app's usage. If you add a library that requires native code not in Expo Go, you will need a **development build** again (re-add expo-dev-client and run `expo prebuild` to regenerate ios/android).
- **react-native-purchases** in Expo Go runs in a preview/mock mode; real IAP requires a development or production build when you ship.

---

## 6. Refactor pass (auth-email-pass branch)

### Changes made
1. **`types/index.ts`** — Added `carKey?: string` to `SpottedCar`. Removed `darkMode: boolean` from `Settings`.
2. **`store/useStore.ts`** — Exported `EMPTY_USER` constant. Removed `darkMode: true` from `DEFAULT_SETTINGS`.
3. **`contexts/auth.tsx`** — Imports `EMPTY_USER` from store (no local duplicate). `signOut` no longer calls `AsyncStorage.clear()` — doing so wiped `app_theme` and caused the user's theme choice to revert to the default dark theme on every sign-out. `supabase.auth.signOut()` already clears auth session data from AsyncStorage.
4. **`app/_layout.tsx`** — Removed the unreachable `if (!session) return` dead-code branch in `AuthGate`.
5. **`services/supabase/processSpot.ts`** — Removed local `ProfileForLimit` / `ProfileRow` type duplicates. Now imports and re-exports canonical `ProfileRow` from `types/index.ts`.
6. **`hooks/useSaveSpot.ts`** (new) — Extracted spot-save orchestration from `IdentificationSheet` into a dedicated hook.
7. **`components/bottomsheet/IdentificationSheet.tsx`** — Simplified `handleSave` to delegate to `useSaveSpot`. Removed dead local-save fallback block, floating XP animation state, and redundant imports. Image `key` props now use URI strings instead of array index.
8. **`services/carIdentifier.ts`** — Deleted (trivial passthrough; see Section 4).
9. **`app/(tabs)/index.tsx`** and **`app/manual-upload.tsx`** — Updated imports to `services/api/carhunter` directly.
10. **`app/(tabs)/my-cars.tsx`** — Removed non-functional "Type" filter dropdown. Added 30-second `useFocusEffect` fetch guard. Capped dot indicators to `cars.length <= 8`.
11. **`app/settings/index.tsx`** and **`app/settings/edit-profile.tsx`** — Replaced `paddingTop: insets.top + X` with fixed `paddingTop: 16`. React Navigation's modal container already applies safe-area insets; adding `insets.top` again caused excessive top margin on settings screens.

---

## 7. How to run

1. **Prerequisites:** Node.js, npm, Expo Go on device/simulator/emulator.
2. **Env:** Copy `.env.example` to `.env` (if present) or create `.env` with `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`; optionally `EXPO_PUBLIC_REVENUECAT_API_KEY`.
3. **Install:** `npm install`
4. **Start:** `npx expo start`
5. **Open:** Scan QR with Expo Go, or press `i` (iOS) / `a` (Android) when the terminal offers it.
6. No custom dev client or `expo prebuild` step is required for this workflow.

**Smoke check:** Run `npx expo start` in the project root; Metro should start and the terminal should show a QR code and options to open in iOS/Android. Open the project in Expo Go on a simulator/emulator or device to confirm the app loads.
