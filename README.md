 # 📬 Mailbox — Free Temporary Email
 
 A minimal, modern, single-purpose **temporary email web app**. Generate a disposable inbox in one click and read incoming mail directly in your browser. Powered by the public [mail.tm](https://mail.tm) REST API.
 
 > ⚠️ **Disposable inboxes are public.** Never use them for sensitive accounts, banking, password resets to important services, or anything you wouldn't want strangers to read.
 
 ---
 
 ## ✨ Features
 
 ### Core
 - **One-click disposable inbox** — generate a fresh address instantly
 - **Persistent address** — your inbox survives page reloads via `localStorage` 
 - **Auto-refreshing inbox** — polls every 10 seconds for new mail
 - **Visibility-aware refresh** — pauses polling when the tab is hidden to save bandwidth
 - **Read mail** in a clean modal viewer
 - **Mark as read** — automatic when opened
 - **Copy email address** with toast confirmation
 - **Change address** — delete current and generate a new one
 - **Delete inbox** permanently
 
 ### UI / UX
 - Single-page, centered minimal design
 - 🌗 **Dark / Light theme toggle**
 - Status indicator pill, unread mail dot, avatar initial chip
 - Smooth modal animations
 - Fully responsive (works from 320px and up)
 - Keyboard-friendly (`Esc` closes modal)
 
 ### Email Content Handling
 - HTML sanitization (XSS-safe rendering)
 - All links forced to `target="_blank"` with `rel="noopener noreferrer"` 
 - Quoted-printable decoding
 - RFC 2047 encoded-word header decoding
 - UTF-8 mojibake repair
 - Plain-text body preservation with auto-linkified URLs
 
 ---
 
 ## 🚀 Getting Started
 
 ### Run locally
 This is a pure static site — no build step, no dependencies to install.
 
 ```bash
 git clone https://github.com/rizwanhasanbd/temp-name.git
 cd temp-name
 
 # Open index.html directly, or serve it:
 python3 -m http.server 8000
 # Then visit http://localhost:8000
 ```
 
 ### Deploy
 Drop the folder into any static host:
 - [Cloudflare Pages](https://pages.cloudflare.com)
 - [GitHub Pages](https://pages.github.com)
 - [Netlify](https://www.netlify.com)
 - [Vercel](https://vercel.com)
 
 ---
 
 ## 📁 Project Structure
 
 ```
 temp-name/
 ├── index.html        # Entry point
 ├── favicon.svg       # App icon
 ├── css/
 │   └── style.css     # All styles (light/dark themes)
 ├── js/
 │   ├── utils.js      # Decoders, sanitizer, helpers
 │   └── temp-mail.js  # Main app logic + mail.tm API calls
 └── README.md
 ```
 
 ---
 
 ## 🛠️ Tech Stack
 
 - **HTML5 / CSS3 / Vanilla JavaScript** — no frameworks, no build tools
 - **[mail.tm API](https://docs.mail.tm)** — disposable inbox provider
 - **localStorage** — persistent session
 - **JWT** — authentication with mail.tm
 
 ---
 
 ## 🗺️ Roadmap
 
 Planned for future releases:
 - [ ] Per-message delete
 - [ ] QR code for the inbox address
 - [ ] Manual "mark all as read"
 - [ ] Multiple saved inboxes
 - [ ] Search & filter mail
 - [ ] Custom username
 - [ ] Custom domain selection
 - [ ] Inbox countdown / TTL display
 - [ ] PWA + offline shell (service worker)
 
 ---
 
 ## 🤝 Contributing
 
 Contributions are welcome. If you have a feature idea or find a bug:
 1. Open an issue describing the change
 2. Fork the repo
 3. Submit a pull request
 
 ---
 
 ## 📜 License
 
 MIT — feel free to use, modify, and distribute.
 
 ---
 
 ## ⚠️ Disclaimer
 
 Mailbox uses the public mail.tm service. **All inboxes are public and accessible to anyone who knows the address.** Use only for sign-ups, testing, or anywhere a real email isn't necessary. Never use for:
 - Banking or financial accounts
 - Password resets on important services
 - Anything containing personal or sensitive information
 
 ---
 
 **Built with care by [@rizwanhasanbd](https://github.com/rizwanhasanbd).**
 
