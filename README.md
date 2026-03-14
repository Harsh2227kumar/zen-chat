# Zen Chat

Modern real-time chat frontend built with React, TypeScript, Vite, Tailwind CSS, and Socket.IO.

<p align="center">
	<img src="https://via.placeholder.com/1200x360/0f172a/ffffff?text=Zen+Chat+-+Real-time+Messaging+UI" alt="Zen Chat Banner" width="100%" />
</p>

<p align="center">
	<em>Replace the banner URL above with your real project cover image or screenshot collage.</em>
</p>

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.3.4-000000?logo=bun&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)

---

## ✨ Overview

Zen Chat is a responsive messaging interface that connects to a backend API + Socket.IO server for live conversations.

It supports private chats, group chats, unread indicators, delivery/read insights, optimistic message updates, and mobile-friendly navigation.

---

## 🚀 Core Features

- 🔐 Auth-aware startup (expects existing auth token + session cookies)
- 💬 Real-time messaging with Socket.IO events
- 👥 Create one-to-one chats by username/email
- 🫂 Create group chats with optional description
- ✅ Optimistic message sending for snappy UX
- 👁️ Message info modal (delivered/seen details)
- 🟢 Online/offline presence indicators
- 🔎 Sidebar search for chat rooms
- 🔔 Unread count badges
- 📱 Mobile layout with slide-in sidebar sheet
- 🌙 UI primitives powered by shadcn/ui + Radix

---

## 🧰 Tech Stack (with icons)

[![My Skills](https://skillicons.dev/icons?i=react,ts,vite,tailwind,bun,eslint)](https://skillicons.dev)

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI
- **Real-time**: socket.io-client
- **Routing**: react-router-dom
- **State/Data Utilities**: @tanstack/react-query, react-hook-form, zod

---

## 🖼️ Screenshots

<p align="center">
	<img src="https://via.placeholder.com/1000x560/111827/ffffff?text=Chat+List+%26+Main+Conversation" alt="Chat List and Conversation" width="95%" />
</p>

<p align="center">
	<img src="https://via.placeholder.com/1000x560/1f2937/ffffff?text=New+Chat+%26+Group+Creation+Modal" alt="New Chat and Group Modals" width="95%" />
</p>

<p align="center">
	<img src="https://via.placeholder.com/420x860/0b1220/ffffff?text=Mobile+Sidebar+Sheet+View" alt="Mobile View" width="35%" />
</p>

> Replace these placeholder images with actual app screenshots from your local build for the best portfolio impact.

---

## 📁 Project Structure

```text
src/
	components/
		chat/
			ChatSidebar.tsx
			ChatArea.tsx
			NewChatModal.tsx
			NewGroupModal.tsx
			MessageInfoModal.tsx
		ui/                # shadcn/ui primitives
	hooks/
		use-mobile.tsx
	lib/
		utils.ts
	pages/
		Index.tsx          # main chat experience
		NotFound.tsx
	App.tsx
	main.tsx
```

---

## ⚙️ Prerequisites

- **Bun** `>= 1.3.4` (recommended package manager/runtime)
- A running backend server with:
	- REST endpoints under `/api/...`
	- Socket.IO namespace on the same base URL

---

## 🛠️ Getting Started

### 1) Clone and install

```bash
git clone <your-repository-url>
cd zen-chat
bun install
```

### 2) Configure environment

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:3000
```

> If `VITE_API_BASE_URL` is not set, the app falls back to `http://localhost:3000`.

### 3) Run development server

```bash
bun run dev
```

Open the URL shown by Vite (typically `http://localhost:5173`).

---

## 📜 Available Scripts

- `bun run dev` — start dev server
- `bun run build` — production build
- `bun run build:dev` — development-mode build
- `bun run preview` — preview production build
- `bun run lint` — run ESLint

---

## 🔌 Backend Contract (Expected)

This frontend expects authentication and chat APIs from a backend service.

### REST endpoints used

- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/chat/rooms`
- `GET /api/chat/rooms/:roomId/messages`
- `POST /api/chat/rooms/private-by-username`
- `POST /api/chat/rooms`

### Socket events used

- `connect`, `connect_error`, `disconnect`
- `room:join`, `room:created`
- `message:send`, `message:new`, `message:error`
- `user:status`

### Auth expectations

- Token is read from `localStorage.getItem("token")`
- Requests use `credentials: "include"` for cookie/session support

---

## 🧠 How the App Works

1. On load, app checks for auth token and opens a Socket.IO connection.
2. It fetches current user + room list and joins room channels.
3. Selecting a room fetches its message history (lazy per room).
4. Sending a message updates UI optimistically, then syncs with server events.
5. Incoming events update messages, last message preview, and presence state.

---

## 📱 Responsive Behavior

- **Desktop/Tablet**: sidebar + chat area side-by-side
- **Mobile**: sidebar displayed in a left sheet drawer, chat area stays primary

---

## 🧪 Quality & Tooling

- ESLint 9 configuration included
- TypeScript strict project setup
- Vite + SWC for fast builds and HMR

---

## 🚢 Deployment

Build and deploy static assets from `dist/`:

```bash
bun run build
```

Then host `dist` on any static hosting provider (Netlify, Vercel, GitHub Pages, Nginx, etc.), ensuring it can reach your API/Socket backend.

---

## 🙌 Credits

Built with the React + Vite + shadcn/ui ecosystem.
