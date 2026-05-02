# Mailbox — Free Temporary Email

A minimal, modern, single-purpose temporary email web app. Generate a disposable
inbox in one click and read incoming mail directly in the browser. Powered by
the public **[mail.tm](https://mail.tm)** REST API.

> ⚠️ Disposable inboxes are public. Never use them for sensitive accounts, banking,
> or anything you wouldn't want strangers to read.

---

## ✅ Currently Completed Features

### Core
- **One-click disposable inbox** — random `user@domain` created on first load
- **Persistent address** — your inbox survives page reloads (stored in `localStorage`)
- **Auto-refreshing inbox** — polls `mail.tm` every 10 seconds
- **Visibility-aware refresh** — re-checks inbox when you switch back to the tab
- **Read mail** — opens in a clean modal viewer with safe HTML rendering
- **Mark as read** — automatic on open (PATCH `/messages/{id}`)
- **Copy email address** — single tap copy, with toast confirmation
- **Change address** — deletes the current inbox and creates a fresh one
- **Delete inbox** — permanently removes the account on mail.tm

### UI / UX
- Single-page, no routing, no sidebar — purely focused on temp mail
- Centered, minimal layout inspired by `temp-mail.org`, `10minutemail`, `linear.app`
- **Dark / Light theme toggle** — dark by default, persisted in `localStorage["mailbox_theme"]`
- Centered "Mailbox" header (3-column grid keeps it mathematically centered)
- Subtle gradient backdrop adapts to active theme
- Sticky translucent header with backdrop-blur
- Status indicator pill (Connecting / Connected / Network error / Session expired)
- Unread mail dot + bold styling
- Avatar initial chip per sender
- Smooth modal animation, mobile-friendly bottom-sheet on small screens
- Fully responsive (works down to ~320px)
- Keyboard-friendly (Esc closes modal)

### Email Content Handling
- HTML sanitization (strips `<script>`, `<iframe>`, `on*` handlers, `javascript:` URLs)
- All links forced to `target="_blank" rel="noopener noreferrer"`
- Decodes quoted-printable (`=20`, `=3D`, `=C3=A9`, soft line-breaks)
- Decodes RFC 2047 encoded-word headers (`=?utf-8?B?...?=`, `=?utf-8?Q?...?=`)
- Repairs UTF-8 mojibake (e.g. `â€™` → `’`)
- Plain-text bodies preserved with `<pre>` and auto-linkified URLs

---

## 🌐 Functional Entry URI

| Path        | Method | Description                              |
|-------------|--------|------------------------------------------|
| `/`         | GET    | Single-page Temp Mail app (`index.html`) |

No client-side routing or query parameters — the app initializes on `DOMContentLoaded`.

---

## 🔌 External API (mail.tm)

| Endpoint                     | Used For                          |
|------------------------------|-----------------------------------|
| `GET  /domains`              | List active inbox domains         |
| `POST /accounts`             | Create disposable inbox           |
| `POST /token`                | Authenticate, get JWT bearer      |
| `GET  /me`                   | Verify token validity on reload   |
| `GET  /messages?page=1`      | Poll inbox                        |
| `GET  /messages/{id}`        | Fetch full message body           |
| `PATCH /messages/{id}`       | Mark message as seen              |
| `DELETE /accounts/{id}`      | Delete the disposable inbox       |

All requests are CORS-enabled and authorization-free for account creation.
After login, a JWT is sent in `Authorization: Bearer <token>`.

---

## 💾 Data Models & Storage

### `localStorage["mailbox_mailtm_account"]`
```json
{
  "id": "string (mail.tm account id)",
  "address": "user@domain.tld",
  "password": "string (16 chars)",
  "token": "JWT string"
}
```

### In-memory message shape (from mail.tm)
```json
{
  "id": "string",
  "from": { "name": "string", "address": "string" },
  "to":   [{ "address": "string" }],
  "subject": "string",
  "intro": "string",
  "html":  ["string"] | null,
  "text":  "string"  | null,
  "seen":  false,
  "createdAt": "ISO-8601 timestamp"
}
```

No backend / no project tables are used.

---

## 🗂 File Structure

```
index.html              Single-page app entry
favicon.svg             Brand icon
css/
  └── style.css         All app styles (light, modern, responsive)
js/
  ├── utils.js          Toast + clipboard + tiny random helpers
  └── temp-mail.js      mail.tm integration + UI logic
README.md
```

---

## 🚧 Features Not Yet Implemented

- Optional dark theme toggle
- Address QR code (for quickly pasting on a phone)
- Manual mark-all-as-read
- Per-message delete (mail.tm supports `DELETE /messages/{id}`)
- Multiple saved inboxes / quick switcher
- Search & filter inbox
- Custom username / custom domain selection
- Inbox countdown / TTL display
- PWA / offline shell

---

## ▶️ Recommended Next Steps

1. **Per-message delete** — add a trash icon in each `mail-item`.
2. **Theme toggle** — variables already follow a single source of truth in `:root`,
   so a `.theme-dark` class would be a small change.
3. **QR code for address** — render a QR via a tiny lib (e.g. `qrcode.min.js` from jsDelivr)
   inside a small popover under the email field.
4. **PWA manifest + service worker** — make it installable & offline-capable.
5. **Custom username** — add a small input + checkbox to override `randomUser()`
   when calling `POST /accounts`.

---

## 🚀 Deployment

To make the website live, please use the **Publish tab** — it will deploy the
static files and provide a public URL automatically.
