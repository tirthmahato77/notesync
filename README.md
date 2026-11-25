# NoteSync - Offline-First Notes Management System (PWA)

A Progressive Web Application (PWA) that allows users to create, edit, organize, and manage personal notes and checklists both online and offline.

---

## Key Features

1. **User Authentication**
   - User registration and login
   - JWT-based authentication
   - Password hashing using bcryptjs
   - Individual user data isolation

2. **Notes Management**
   - Create and edit notes with title and content
   - Basic text formatting (bold, italic, bullet lists)
   - Auto-save while typing (debounced)
   - Pinned notes section
   - Note background colors (7 palette colors)
   - Labels and tags for categorizing notes
   - Instant search across note titles and content
   - Grid and List view layouts

3. **Checklist & To-Do Notes**
   - Create checklist-style notes
   - Check and uncheck tasks with line-through animation
   - Add, edit, and delete individual checklist items
   - Progress preview on note cards

4. **Archive & Trash**
   - Archive notes to keep dashboard tidy
   - Unarchive notes back to dashboard
   - Soft-delete notes into Trash
   - Restore notes or permanently delete them
   - "Empty Trash" one-click action

5. **Offline-First Architecture & PWA**
   - IndexedDB local storage using the `idb` library
   - Changes saved instantly to IndexedDB when offline
   - Pending sync queue (`syncQueue` store in IndexedDB)
   - Automatic synchronization with the server upon reconnection
   - Real-time online/offline indicator banner
   - Service Worker (`sw.js`) with Cache First for static assets and Network First for API
   - Web App Manifest (`manifest.json`) for Add to Home Screen and standalone app mode
   - Custom offline fallback page (`offline.html`)

---

## Technologies Used

- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router v7, React Icons, React Hot Toast
- **Local Storage:** IndexedDB (via `idb` library)
- **PWA:** Service Workers, Web App Manifest, Cache API
- **Backend:** Node.js, Express.js, CORS, JSON Web Tokens (JWT), Bcrypt.js
- **Database:** Firebase Firestore Admin SDK (with integrated fallback store for local testing)

---

## How to Run the Project

### 1. Start the Backend Server

Open a terminal and navigate to the `server` directory:

```bash
cd server
npm run dev
```

The server will start on `http://localhost:8080`.

### 2. Start the Frontend Application

Open another terminal and navigate to the `client` directory:

```bash
cd client
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## Project Structure

```
note-app/
├── server/
│   ├── config/
│   │   └── firebase.js       # Firebase Admin & fallback store
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js           # Register, login, me routes
│   │   └── notes.js          # Notes CRUD, sync, and labels
│   ├── .env                  # Port, JWT secret, Firebase config
│   ├── index.js              # Express app entry
│   └── package.json
│
├── client/
│   ├── public/
│   │   ├── icons/            # App icons
│   │   ├── favicon.svg       # Favicon
│   │   ├── manifest.json     # Web App Manifest
│   │   ├── offline.html      # Offline fallback page
│   │   └── sw.js             # Service Worker
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChecklistEditor.jsx
│   │   │   ├── LabelManager.jsx
│   │   │   ├── NoteCard.jsx
│   │   │   ├── NoteEditor.jsx
│   │   │   ├── OnlineStatus.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Archive.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Trash.jsx
│   │   ├── services/
│   │   │   ├── api.js        # REST API calls
│   │   │   ├── db.js         # IndexedDB operations
│   │   │   └── sync.js       # Online/offline sync engine
│   │   ├── App.jsx           # App routes
│   │   ├── index.css         # Tailwind styles
│   │   └── main.jsx          # React DOM entry
│   ├── index.html            # HTML entry & SW registration
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## College Presentation Points (Quick Reference)

- **Why PWA?** PWAs provide app-like experience on any device, installable without app stores, with fast loading through caching.
- **Why IndexedDB?** Unlike `localStorage` which is limited to ~5MB and synchronous, `IndexedDB` is asynchronous, transactional, and supports large structured data storage.
- **How Sync Works?** When offline, operations are recorded in an IndexedDB `syncQueue`. When the `online` event fires in the browser, the pending items in `syncQueue` are sent to the `/api/notes/sync` endpoint and updated on the server.
- **Service Worker Lifecycle:** `install` caches static app assets; `activate` cleans up old caches; `fetch` intercepts network requests and serves cached files when offline.

