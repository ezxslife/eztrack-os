# Phase 1: Monorepo Foundation & Expo Setup

> **Goal:** Scaffold the Expo app inside the existing Turborepo monorepo, wire up shared packages, configure EAS Build, and establish the development workflow.
> **Duration:** 3–4 days
> **Prerequisites:** Node 20+, pnpm 10+, Xcode 16+, EAS CLI

---

## 1.1 Monorepo Integration

### Current Structure
```
EZTrack/
├── apps/
│   ├── web/          # Next.js 16 (fully built)
│   ├── mobile/       # ← EMPTY — we build here
│   └── wall-display/ # Future
├── packages/
│   ├── shared/       # Types, enums, constants, validation (Zod)
│   ├── api/          # Supabase client factories
│   └── ui/           # Design tokens (JS)
├── turbo.json
└── pnpm-workspace.yaml
```

### Tasks

**1.1.1 — Verify workspace config**

`pnpm-workspace.yaml` should already include:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**1.1.2 — Scaffold Expo app**

```bash
cd apps/
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
```

**1.1.3 — Set package name in `apps/mobile/package.json`**

```json
{
  "name": "@eztrack/mobile",
  "version": "0.0.1",
  "private": true,
  "main": "expo-router/entry",
  "dependencies": {
    "@eztrack/shared": "workspace:*",
    "@eztrack/api": "workspace:*",
    "@eztrack/ui": "workspace:*"
  }
}
```

**1.1.4 — Update turbo.json pipeline**

Add mobile-specific tasks:
```json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "type-check": {},
    "@eztrack/mobile#dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["@eztrack/shared#build", "@eztrack/api#build"]
    },
    "@eztrack/mobile#build:ios": {
      "dependsOn": ["@eztrack/shared#build", "@eztrack/api#build"]
    }
  }
}
```

---

## 1.2 Expo Configuration

### `app.config.ts`

```typescript
import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "EZTrack",
  slug: "eztrack-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  scheme: "eztrack",

  // iOS 26 splash — separate light/dark
  splash: {
    image: "./assets/splash-light.png",
    resizeMode: "contain",
    backgroundColor: "#F2F2F7",
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.ezxs.eztrack",
    config: {
      usesNonExemptEncryption: false,
    },
    splash: {
      light: {
        image: "./assets/splash-light.png",
        resizeMode: "contain",
        backgroundColor: "#F2F2F7",
      },
      dark: {
        image: "./assets/splash-dark.png",
        resizeMode: "contain",
        backgroundColor: "#000000",
      },
    },
  },

  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#06B6D4",
    },
    package: "com.ezxs.eztrack",
    splash: {
      light: {
        image: "./assets/splash-light.png",
        resizeMode: "contain",
        backgroundColor: "#F2F2F7",
      },
      dark: {
        image: "./assets/splash-dark.png",
        resizeMode: "contain",
        backgroundColor: "#121212",
      },
    },
  },

  plugins: [
    "expo-router",
    "expo-font",
    "expo-haptics",
    "expo-blur",
    "expo-secure-store",
    [
      "expo-camera",
      { cameraPermission: "EZTrack needs camera access for incident photos." },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "EZTrack uses your location to tag incidents and dispatches.",
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#06B6D4",
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    eas: { projectId: "your-eas-project-id" },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
});
```

---

## 1.3 Core Dependencies

### Install in `apps/mobile/`:

```bash
# Expo SDK + Router
npx expo install expo-router expo-linking expo-constants expo-status-bar

# Supabase
pnpm add @supabase/supabase-js

# State & Data
pnpm add zustand @tanstack/react-query react-native-mmkv

# UI & Animation
npx expo install expo-blur expo-haptics expo-font
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install react-native-safe-area-context react-native-screens
npx expo install @react-native-async-storage/async-storage

# Bottom sheets
pnpm add @gorhom/bottom-sheet

# Icons
pnpm add lucide-react-native react-native-svg

# Forms & Validation (shared Zod schemas)
pnpm add zod

# Date handling
pnpm add date-fns

# Networking
pnpm add @react-native-community/netinfo

# Camera & Media
npx expo install expo-camera expo-image-picker expo-file-system

# Location
npx expo install expo-location

# Notifications
npx expo install expo-notifications expo-device

# Secure storage (for auth tokens)
npx expo install expo-secure-store

# Glass effect (iOS 26)
npx expo install expo-glass-effect
```

---

## 1.4 Shared Package Wiring

### Problem: Expo + monorepo resolution

Expo's Metro bundler needs to know about workspace packages. Configure `metro.config.js`:

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all monorepo packages
config.watchFolders = [monorepoRoot];

// Resolve from monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Ensure shared packages resolve correctly
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

### Verify shared imports work:

```typescript
// This should resolve from packages/shared
import { IncidentSeverity, StaffRole } from "@eztrack/shared";
import { STATUS_COLORS, PRIORITY_COLORS } from "@eztrack/shared";
import type { Incident, Dispatch, Profile } from "@eztrack/shared";

// This should resolve from packages/ui
import { BRAND, SURFACE, TYPOGRAPHY } from "@eztrack/ui";

// This should resolve from packages/api
import { createBrowserClient } from "@eztrack/api";
```

---

## 1.5 TypeScript Configuration

### `apps/mobile/tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@eztrack/shared": ["../../packages/shared/src"],
      "@eztrack/api": ["../../packages/api/src"],
      "@eztrack/ui": ["../../packages/ui/src"]
    },
    "types": ["expo/types"]
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
```

---

## 1.6 Environment Variables

### `.env` (in `apps/mobile/`)

```bash
EXPO_PUBLIC_SUPABASE_URL=https://pjxmkliosgfwfbwjycxv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_APP_ENV=development
```

### Access pattern:

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

---

## 1.7 EAS Build Configuration

### `eas.json` (in `apps/mobile/`)

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id",
        "ascAppId": "your-app-store-connect-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

---

## 1.8 Development Scripts

### Add to root `package.json`:

```json
{
  "scripts": {
    "mobile": "turbo run dev --filter=@eztrack/mobile",
    "mobile:ios": "cd apps/mobile && npx expo run:ios",
    "mobile:android": "cd apps/mobile && npx expo run:android",
    "mobile:build:dev": "cd apps/mobile && eas build --profile development --platform ios",
    "mobile:build:preview": "cd apps/mobile && eas build --profile preview --platform ios",
    "mobile:build:prod": "cd apps/mobile && eas build --profile production --platform ios"
  }
}
```

---

## 1.9 Folder Scaffolding

Create the initial directory structure:

```bash
cd apps/mobile
mkdir -p src/{theme,components/{ui/glass,data,forms,layout},hooks,stores,lib/{api/hooks,storage,auth,offline},navigation,types}
mkdir -p app/{_layout.tsx,'(auth)','(tabs)','(detail)','(create)',settings,analytics,reports,notifications,alerts}
mkdir -p assets
```

---

## 1.10 Verification Checklist

- [ ] `pnpm install` from monorepo root succeeds
- [ ] `cd apps/mobile && npx expo start` launches without errors
- [ ] `import { StaffRole } from "@eztrack/shared"` resolves
- [ ] `import { BRAND } from "@eztrack/ui"` resolves
- [ ] TypeScript: `npx tsc --noEmit` passes
- [ ] EAS: `eas build --profile development --platform ios` completes
- [ ] Metro bundler resolves all workspace dependencies
- [ ] Environment variables accessible via `process.env.EXPO_PUBLIC_*`

---

## Dependencies on Other Phases

| This Phase Produces | Consumed By |
|---------------------|-------------|
| Expo project scaffold | All subsequent phases |
| Shared package imports | Phase 2 (tokens), Phase 3 (types/enums), Phase 5–7 (validation) |
| Metro config | Phase 2+ (all component development) |
| EAS build config | Phase 10 (release) |
| TypeScript paths | All phases |

---

**Next:** [Phase 2 — Design System & iOS 26 Glass →](./02-DESIGN-SYSTEM.md)
