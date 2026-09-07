# @keystone/mobile

Expo SDK 54 app. Passkey-based onboarding (via Privy) is the only way to get a wallet in this app — there's no injected browser wallet on mobile, so this *is* the mobile wallet story, not an add-on.

## Setup

1. `pnpm install` from the repo root.
2. Create a Privy app at [dashboard.privy.io](https://dashboard.privy.io). Under **Login Methods**, enable **Passkey**. Copy the App ID and Client ID.
3. `cp .env.example .env` and fill in `EXPO_PUBLIC_PRIVY_APP_ID` / `EXPO_PUBLIC_PRIVY_CLIENT_ID`.
4. Passkey domain setup (required — see below) before passkeys will actually work on a device.

## Passkeys require a custom dev build, not Expo Go

Passkeys need the `associatedDomains` (iOS) / Digital Asset Links (Android) native entitlements configured in `app.json`. Expo Go is a shared, pre-built binary that can't carry app-specific entitlements, so this app **will not support passkey login inside plain Expo Go**. Use a custom dev client instead:

```
pnpm exec expo prebuild
pnpm run ios      # or: pnpm run android
```

(`pnpm run start` still works afterwards for fast refresh against that dev client.)

## Passkey domain setup

`app.json`'s `ios.associatedDomains` points at `webcredentials:keystone-web-nine.vercel.app` — the deployed web app's domain, since we already control it. Two verification files must be reachable there before Apple/Google will trust the app:

- **iOS**: `https://keystone-web-nine.vercel.app/.well-known/apple-app-site-association` — served by `apps/web/app/.well-known/apple-app-site-association/route.ts`. Replace the placeholder `TEAMID` in that file with the real Apple Developer Team ID before this works.
- **Android**: `https://keystone-web-nine.vercel.app/.well-known/assetlinks.json` — served from `apps/web/public/.well-known/assetlinks.json`. Replace `REPLACE_WITH_YOUR_ANDROID_SIGNING_CERT_SHA256_FINGERPRINT` with the SHA-256 fingerprint of the Android signing key (get it via `eas credentials` if using EAS Build, or your keystore's `keytool -list -v`), and add the same fingerprint to the Privy dashboard's allowed Android key hashes.

If `EXPO_PUBLIC_PASSKEY_RELYING_PARTY` is pointed at a different domain (e.g. a custom domain later), update `app.json`'s `associatedDomains` and both `.well-known` files to match.

## Screens

Ported from the "Keystone Mobile" Claude Design project (`claude.ai/design/p/d9385985-...`) — Splash → Landing → a tabbed app shell (Home / Trade / Earn / Activity) with a floating action button opening a Quick Actions sheet (Swap / Bridge), matching `apps/web`'s dark arch-themed brand.

## What's real vs. demo

Every screen carrying a **DEMO** badge (`components/DemoBadge.tsx`) is not backed by real execution yet — same "real data only, honestly labeled" convention `apps/web` already follows (`KEYSTONE_PRD.md` §9). Concretely:

- **Real**: passkey signup/login, embedded EOA wallet creation, Arc Testnet USDC/EURC balance reads (same contracts as web), the Landing/Home arch visualization's shape (real math, ported 1:1 from the design file).
- **Demo, labeled**: Trade's order book ladder and order placement, Swap, Bridge, Earn's APY/yield breakdown, Activity's event feed, Home's book-preview mid price. Wiring these to `kit.swap()`/`kit.bridge()` and the real indexer book is a follow-up (see `KEYSTONE_PRD.md`'s roadmap) — `lib/mockMarket.ts` holds all the placeholder data so it's easy to find and replace.
