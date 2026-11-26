# VALENCY — Native Mobile App Build Guide (iPhone .ipa & Android .apk)

## Why You Can't Just Email a Raw `.ipa` File to an iPhone
- **Apple Code-Signing Rule:** iOS strictly refuses to install unsigned `.ipa` files. Compiling and signing a real iOS `.ipa` requires **macOS + Xcode** and an **Apple Developer certificate** ($99/yr for TestFlight & App Store distribution).
- **Android Is Simpler:** An Android `.apk` can be downloaded and installed directly on any Android phone without Google Play.

---

## Path 1 (Fastest — Works Today on iPhone & Android, Zero Mac Needed): Mobile PWA Bundle
We already built your clean, ultra-lightweight mobile web bundle:
- Folder: `../dist/valency-mobile-pwa/`
- Zip: `../dist/valency-mobile-pwa.zip`

1. Drag and drop `dist/valency-mobile-pwa/` (or `dist/valency-mobile-pwa.zip`) onto **https://app.netlify.com/drop** (or upload to Cloudflare Pages / GitHub Pages).
2. Text the resulting `https://...` URL to your friend.
3. On **iPhone Safari**: tap **Share → Add to Home Screen → Add**.
4. On **Android Chrome**: tap **⋮ → Add to Home screen / Install app**.

It installs on their Home Screen with the custom VALENCY atomic icon, runs full-screen with no browser bar, saves Story Mode progress locally, and works offline!

*(To rebuild the bundle after future edits, run `node scripts/build-mobile-bundle.js`. Add `--with-audio` if you also want to include large `.wav` files; `.mp3`/`.m4a`/`.ogg` files in `assets/audio/` are included automatically.)*

---

## Path 2 (True Native App Store / TestFlight `.ipa` & Android `.apk` via Capacitor)
This folder (`mobile-native/`) is pre-configured with **Capacitor 6** pointing directly at `../dist/valency-mobile-pwa`:

### Option A: Cloud Build via GitHub Actions (No Mac Required for Build, Apple Dev Account Needed for iOS Signing)
1. Push `valency-card-game` to a GitHub repository and copy `mobile-native/.github/workflows/build-mobile-apps.yml` into the repo's `.github/workflows/` folder.
2. Run the workflow in GitHub Actions:
   - Downloads a ready-to-install **`valency-android-debug-apk`** for Android phones immediately.
   - Builds the macOS Xcode **`VALENCY.xcarchive`** on Apple Silicon runners (add your Apple Developer signing certificate & provisioning profile secrets to export a TestFlight `.ipa`).

### Option B: On a Mac with Xcode Installed
```bash
cd mobile-native
npm install
npm run build:web
npx cap add ios
npx cap sync ios
npx cap open ios
```
Then in Xcode: select your Apple Team under **Signing & Capabilities** → **Product → Archive → Distribute App → TestFlight & App Store**, and invite your friend via Apple's TestFlight app!
