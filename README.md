# 🛡️ CrisisNav

> An offline-first emergency guidance platform for quickly accessing structured crisis protocols when connectivity may be unreliable.

## What is CrisisNav?

CrisisNav is a Progressive Web App focused on making emergency guidance fast to find and usable in difficult connectivity conditions.

The project combines cached content, structured emergency protocols, multilingual support, voice interaction, and a responsive interface.

## ✨ Highlights

- 📡 **Offline-first PWA** — service-worker caching keeps core resources available after the first successful load
- 🎙️ **Voice interaction** — hands-free navigation and protocol control
- 🌍 **Multilingual interface** — localization support for Indian languages
- 🔎 **Protocol search** — quickly find relevant emergency guidance
- 🧭 **Step-based guidance** — structured protocols with visible progress
- 📱 **Responsive UI** — designed for mobile and desktop use
- 🔐 **User features** — authentication/profile flows are included in the application

## 🧰 Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js, Express, CORS
- **PWA:** Service Worker + Web App Manifest
- **Icons:** Phosphor Icons

## 🚀 Run Locally

### Prerequisites

- Node.js and npm

### Setup

```bash
git clone https://github.com/sanyukt63/CrisisNav.git
cd CrisisNav
npm install
npm start
```

Then open:

```text
http://localhost:3001
```

For additional setup details, see [SETUP_GUIDE.md](SETUP_GUIDE.md).

## 📂 Key Files

```text
CrisisNav/
├── app.js              # Main application logic
├── auth_service.js     # Authentication-related logic
├── i18n.js             # Localization
├── index.html          # Main application
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline caching
├── SETUP_GUIDE.md      # Detailed setup
└── package.json        # Node.js configuration
```

## 🗺️ Roadmap

- [ ] Add automated unit/integration tests
- [ ] Add protocol content validation
- [ ] Improve offline cache update strategy
- [ ] Add accessibility checks
- [ ] Add contributor documentation
- [ ] Add demo screenshots/video
- [ ] Add automated CI checks

## ⚠️ Important

CrisisNav is a software project for organizing emergency guidance. It is **not a substitute for local emergency services, professional responders, or official public-safety instructions**. In a real emergency, follow applicable local guidance and contact emergency services when appropriate.

## 🤝 Contributing

Bug reports, accessibility improvements, documentation, testing, and feature contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Make and test your change
4. Open a pull request explaining the problem and solution

⭐ If the project is useful, consider starring it and sharing feedback.
