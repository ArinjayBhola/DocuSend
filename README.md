# DocuSend | Trackable Document Sharing & Deal Room Platform

**DocuSend** is a SaaS product that lets businesses share documents via secure, trackable links with real-time analytics on who viewed what, when, and for how long. Think "Google Analytics for your PDFs."

The project has recently been migrated to a modern **TypeScript** stack with a separated frontend and backend architecture.

---

## 🏗 Architecture

- **Frontend (`/frontend`)**: React 19, Vite, Tailwind V4, React Router DOM, Recharts, PDF.js, all written in TypeScript.
- **Backend (`/backend`)**: Node.js, Express, SQLite, Drizzle ORM, JWT Auth, completely converted to TypeScript.

---

## 🎯 Features

- ✅ **Real-Time View Tracking** - Know instantly when someone opens your document
- ✅ **Page-Level Analytics** - See which pages get the most attention with heatmaps
- ✅ **Password & Email Gates** - Protect sensitive docs and capture leads
- ✅ **Deal Rooms / Workspaces** - Share multiple documents via single link
- ✅ **Expiring Links** - Set expiration dates on documents
- ✅ **Usage Limits** - Free: 5 docs, Pro: 50 docs, Business: Unlimited
- ✅ **Razorpay Integration** - Subscription billing with webhooks
- ✅ **JWT Authentication** - Secure httpOnly cookie-based auth
- ✅ **Type Safety** - Full TypeScript support across the entire stack

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run dev
```

The backend API will start on `http://localhost:3000`.

### 2. Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend application will be available at `http://localhost:5173`.

---

## � Project Structure

```
.
├── backend/                  # Express REST API
│   ├── src/                  # TypeScript source code
│   │   ├── config/           # App configuration
│   │   ├── db/               # Drizzle schema and migrations
│   │   ├── middleware/       # Express middlewares
│   │   ├── routes/           # API Endpoints
│   │   ├── services/         # Integrations (Razorpay, Email)
│   │   └── utils/            # Helpers
│   ├── tsconfig.json         # TypeScript configuration
│   └── package.json
│
├── frontend/                 # React SPA
│   ├── src/                  # TypeScript React code
│   │   ├── api/              # API Client functions
│   │   ├── components/       # UI Components
│   │   ├── context/          # React Contexts
│   │   ├── hooks/            # Custom Hooks
│   │   ├── pages/            # Route Components
│   │   └── utils/            # Helpers
│   ├── tsconfig.json         # TypeScript configuration
│   └── package.json
│
└── README.md                 # This file
```

## � Documentation

For more detailed information about each component, see the respective documentation:

- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)

---
