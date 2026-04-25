# ⚡ Aeron X — Electric Vehicle 3D Configurator

A production-level, interactive 3D electric vehicle showcase website inspired by Tesla's product experience.

![Aeron X](https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&q=80)

## 🚀 Live Demo

Open `index.html` locally or deploy to any static host.

## ✨ Features

- **Interactive 3D Viewer** — Rotate, zoom, and pan around a detailed Model Y built with Three.js & WebGL
- **Real-time Color Configurator** — Change exterior paint with smooth animated transitions
- **Camera Presets** — Front, Side, Rear, Top, and Interior views with GSAP-powered transitions
- **Auto-rotation** — Resumes automatically after 4 seconds of idle
- **Part Highlighting** — Click Wheels, Lights, or Glass to highlight them in the 3D scene
- **PBR Materials** — Physically-based rendering with RoomEnvironment reflections and ACES tone mapping
- **Fullscreen Mode** — Immersive full-screen 3D viewing
- **6 Vehicle Cards** — Model Y, Model 3, Model S, Model X, Cybertruck, Roadster
- **5 Nav Pages** — Energy, Charging, Discover, Shop, Sign In
- **Scroll Animations** — Smooth reveal animations on all pages
- **Fully Responsive** — Mobile and desktop with touch gesture support

## 🛠 Tech Stack

| Technology | Usage |
|---|---|
| Three.js r160 | 3D rendering, PBR materials, WebGL |
| GSAP 3 | Camera transitions, color animations |
| OrbitControls | Drag/zoom/pan controls |
| RoomEnvironment | HDRI-style environment reflections |
| Vanilla JS (ES Modules) | All interactivity |
| CSS3 | Animations, responsive layout |
| Google Fonts (Inter) | Typography |

## 📁 Project Structure

```
aeron-x/
├── index.html       # Homepage — vehicle grid
├── viewer.html      # 3D configurator (split-screen)
├── viewer.js        # Three.js scene, controls, color picker
├── home.js          # Vehicle card rendering & reveal
├── main.css         # Core styles & viewer layout
├── pages.css        # Page-specific styles & animations
├── energy.html      # Energy ecosystem page
├── charging.html    # Charging network page
├── discover.html    # News & discover page
├── shop.html        # Accessories & apparel shop
└── signin.html      # Sign in page
```

## 🏃 Run Locally

```bash
# Clone the repo
git clone https://github.com/GTY-azlan/aeron-x.git
cd aeron-x

# Serve with Python
python3 -m http.server 4000

# Open in browser
open http://localhost:4000
```

> **Note:** Must be served via HTTP (not opened as a file) due to ES module imports.

## 🎨 Design

- **Dark theme** — Deep navy `#0a0a0a` background
- **Accent** — Electric red `#e82127`
- **Secondary** — Electric blue `#3e9bff` for highlights
- **Typography** — Inter (300–700 weights)

## 📄 License

MIT — free to use, modify, and distribute.
