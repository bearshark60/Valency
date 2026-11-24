# VALENCY — iPhone Mobile Pilot Testing Guide

The dedicated mobile version lives at **`mobile.html`** and runs on the exact same rules engine, 120-card Unit 1 deck, Interactive Tutorial, and **Chapter 0: Academy Licensure** Story Mode as the desktop version (`index.html`), while leaving `index.html` untouched.

---

## Option A: Share with a Friend Anywhere (Fastest — 60 Seconds, Free)

Use **Netlify Drop** (no account required for temporary pilot links, or free account for a permanent link):

1. Open [https://app.netlify.com/drop](https://app.netlify.com/drop) in your desktop browser.
2. Drag and drop the entire `valency-card-game` folder onto the page:
   `C:\Users\joshb\.gemini\antigravity\scratch\valency-card-game`
   *(Optional tip: if you want super fast cellular upload/load times, temporarily remove or compress the two ~31 MB `.wav` files in `assets/audio/` to `.mp3`/`.m4a`; VALENCY's built-in synthesized soundtracks play automatically if a `.wav` is omitted!)*
3. Copy the live HTTPS URL Netlify generates and send your friend:
   `https://<your-site-name>.netlify.app/mobile.html`

> **Alternative free permanent hosts:** Push the folder to **GitHub Pages** or **Cloudflare Pages** and share `https://<your-url>/mobile.html`.

---

## Option B: Test Instantly on an iPhone on the Same Wi-Fi

1. Double-click **`start-mobile-pilot.bat`** inside `valency-card-game` (or run `"C:\Program Files\nodejs\node.exe" server.js`).
2. Look for the printed Wi-Fi address, e.g.:
   `http://192.168.1.42:8080/mobile.html`
3. Open that URL in **Safari** on the iPhone (connected to the same Wi-Fi network).
   *(If Windows Firewall prompts on first run, allow Node.js on Private networks.)*

---

## How Your Friend Installs It Like a Native iPhone App

1. Open the `mobile.html` link in **Safari** on iPhone.
2. Tap the **Share** button (square with upward arrow at the bottom of Safari).
3. Scroll down and tap **Add to Home Screen** → **Add**.
4. Launch **VALENCY** from the iPhone Home Screen — it opens full-screen with its custom atomic icon, safe-area support for the Dynamic Island/notch, offline caching, and persistent Story Mode progress.

---

## Mobile Controls Quick Reference for Your Pilot Tester

- **Play in Portrait OR Landscape:** Both orientations adapt automatically.
- **Swipe Hand & Fields:** Swipe left/right across your hand cards and across both players' compound rows.
- **Inspect Any Card:** Tap the **`🔍`** button in the upper-right of any card to open the full-size card view (replaces desktop mouse hover).
- **Recipe Hints & Log:** Tap **`💡`** or **`📜`** in the top bar to open the slide-up drawer; tapping a recipe hint auto-selects those cards and closes the drawer.
- **Periodic Table / Rules / Audio / Restart:** Tap **`⋯`** in the top-right corner to open the Lab Controls sheet.
