# DocuSend Frontend

The frontend for DocuSend, written in React with Vite and completely strictly typed via TypeScript.

## 🛠 Tech Stack

- **React 19**
- **Vite**
- **TypeScript**
- **Tailwind CSS V4**
- **React Router DOM v7**
- **Recharts** for Analytics
- **PDF.js** for document rendering

## 🚀 Getting Started

### Prerequisites
Make sure you have Node > 18.x installed.

### Installation

```bash
npm install
```

### Development

The frontend development server expects the backend to be running on `localhost:3000`. API requests are proxied via Vite config to avoid CORS issues.

```bash
npm run dev
```

This will run the frontend on `http://localhost:5173`.

### Building for Production

Compile TypeScript and build with Vite:

```bash
npm run build
```

This command generates production-ready assets located in the `dist` folder.
