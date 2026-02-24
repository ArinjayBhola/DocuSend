# DocuSend Backend

The backend REST API for DocuSend. Completely rewritten in TypeScript.

## 🛠 Tech Stack

- **Node.js + Express.js**
- **TypeScript**
- **SQLite Database**
- **Drizzle ORM**
- **JWT Authentication**
- **Razorpay Integration**

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill the variables:

```bash
cp .env.example .env
```

### Database Setup

The backend uses Drizzle ORM and SQLite. To set up your schema and tables:

```bash
# Optional: generates migration files
npm run db:generate

# Runs the migrations and sets up docusend.db
npm run db:migrate
```

### Running the Server

Start the development server with Hot Reloading via `tsx`:

```bash
npm run dev
```

The API will run on `http://localhost:3000`.

### Production Build

Typecheck and build the TypeScript codebase:

```bash
npm run build
```
