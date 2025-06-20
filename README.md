# Snapcast – Video Sharing Platform with Auth, Xata, Drizzle, Bunny, and Arcjet

A full-stack video sharing platform built with **Next.js**, **Better Auth**, **Xata**, **Drizzle ORM**, **Bunny CDN**,
and **Arcjet**.

---

## 🚀 Features

- 🔐 Secure authentication with [Better Auth](https://www.better-auth.com/)
- 🎥 Video upload and streaming via [Bunny CDN](https://bunny.net/)
- 🧠 Smart database and search powered by [Xata.io](https://xata.io/)
- 🛡️ Bot detection and security rules via [Arcjet](https://arcjet.com/)
- 🗃️ Type-safe ORM with [Drizzle](https://orm.drizzle.team/)

---

## 🧩 Tech Stack

### 🔐 [Arcjet](https://arcjet.com)

Arcjet is a developer-first security platform that integrates **bot protection**, **rate limiting**, **email validation**, and **attack protection** into your application with minimal code.  
It offers customizable protection for forms, login pages, and API routes, supporting frameworks like **Node.js**, **Next.js**, **Deno**, **Bun**, **Remix**, **SvelteKit**, and **NestJS**.

### 🎥 [Bunny.net](https://bunny.net)

Bunny.net is a developer-friendly **video delivery platform** offering **global CDN**, **edge storage**, **adaptive streaming**, and a **customizable player**.  
It simplifies video management with features like automatic encoding, token-based security, and real-time analytics — ideal for **seamless, secure, and scalable video streaming**.

### 🛡️ [Better Auth](https://www.better-auth.com)

Better Auth is a **TypeScript-first authentication** and authorization library that simplifies implementing **secure login**, **two-factor authentication**, and **social sign-ins**, all while supporting **multi-tenancy**.

### 🧠 [Drizzle ORM](https://orm.drizzle.team)

Drizzle ORM is a **type-safe, lightweight ORM** for SQL databases. It provides a modern solution for interacting with databases using TypeScript, supporting **migrations**, **queries**, and **schema management**.

### ⚡ [Next.js](https://nextjs.org)

Next.js is a powerful **React framework** that enables the development of **fast, scalable web applications** with features like **server-side rendering (SSR)**, **static site generation (SSG)**, and **API routes** for full-stack development.

### 🎨 [Tailwind CSS](https://tailwindcss.com)

Tailwind CSS is a **utility-first CSS framework** that allows developers to design custom user interfaces using low-level utility classes directly in HTML — greatly **streamlining the design process**.

### 🧾 [TypeScript](https://www.typescriptlang.org)

TypeScript is a **superset of JavaScript** that adds **static typing**, providing better **tooling**, **code quality**, and **error detection**, making it ideal for building **large-scale applications**.

### 📊 [Xata](https://xata.io)

Xata is a **serverless PostgreSQL platform** offering **auto-scaling**, **zero-downtime schema migrations**, **real-time branching**, and **built-in full-text search**.  
It provides a spreadsheet-like UI for intuitive data management, enhancing **modern development workflows**.

---

## 📦 Installation

```bash
git clone https://github.com/mistrypavankumar/loom-clone.git
cd loom-clone
npm install
```

---

## ⚙️ Environment Setup

Rename `.env.example` to `.env` and add your keys:

```env
# Public API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Xata DB
XATA_API_KEY=
DATABASE_URL=
DATABASE_URL_POSTGRES=

# Bunny CDN
BUNNY_STORAGE_ACCESS_KEY=
BUNNY_STREAM_ACCESS_KEY=
BUNNY_LIBRARY_ID=

# Arcjet (Security middleware)
ARCJET_API_KEY=
```

---

## 🔐 Setting up Better Auth

1. Go to [Better Auth Docs](https://www.better-auth.com/docs/installation#set-environment-variables)
2. Add values for:
    - `BETTER_AUTH_SECRET`
    - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from [Google Console](https://console.developers.google.com)
3. Make sure redirect URI is set to:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

---

## 🧠 Setting up Xata.io

1. Sign up at [xata.io](https://xata.io/)
2. Create a database.
3. In your terminal:

```bash
npm install -g @xata.io/cli
xata init
# Select your database, choose TypeScript
```

This creates `xata.config.ts` and links your app to the database.

---

## 🗃️ Setting up Drizzle ORM

Install dependencies:

```bash
npm install drizzle-orm
npm install -D drizzle-kit
npm install pg
```

```bash
npm install dotenv
```

You’ll also need a `drizzle.config.ts` file to generate schema types from Postgres. So create this file in root folder
and add below code. (Only if file not exists)

```bash
import {config} from "dotenv";
import {defineConfig} from "drizzle-kit";

config({
    path: "./.env",
})


export default defineConfig({
    schema: "./drizzle/schema.ts",
    out: "./drizzle/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL_POSTGRES!
    }
})

```

---

## 🎬 Bunny CDN Setup

1. Go to [bunny.net](https://bunny.net)
2. Create:
    - Storage Zone
    - Video Library
3. Set the following keys in `.env`:
    - `BUNNY_STORAGE_ACCESS_KEY`
    - `BUNNY_STREAM_ACCESS_KEY`
    - `BUNNY_LIBRARY_ID`

---

## 🛡️ Arcjet Middleware Setup

1. Sign up at [arcjet.com](https://arcjet.com)
2. Copy your `ARCJET_API_KEY` to `.env`
3. Arcjet provides:
    - Bot detection
    - Rate limiting
    - Attack protection

Middleware is configured using `createMiddleware(validate)` in `middleware.ts`.

---

## 🧪 Running the Project

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 📁 Folder Structure

```
loom-clone/
├── .xata/                  # Xata-generated config & schema files
├── app/                    # Next.js app directory (routes, layout)
├── components/             # Reusable React components
├── constants/              # Constant values (e.g., limits, enums)
├── drizzle/                # Drizzle ORM schema and DB setup
├── fonts/                  # Custom font files
├── lib/                    # Utility functions and third-party wrappers (e.g., Arcjet, auth)
├── node_modules/           # Installed dependencies
├── pages/                  # Legacy pages (if using both /pages and /app)
├── public/                 # Static files like images, icons
├── .env                    # Environment variables
├── .gitignore              # Git ignored files
├── .prettierrc             # Prettier code formatting config
├── drizzle.config.ts       # Drizzle ORM CLI config
├── eslint.config.mjs       # ESLint rules
├── middleware.ts           # Global middleware for auth and Arcjet protection
├── next.config.ts          # Next.js config file
├── package.json            # Project metadata and scripts
├── postcss.config.mjs      # PostCSS config for TailwindCSS
├── tsconfig.json           # TypeScript config
├── xata.ts                 # Xata DB client (generated)
└── README.md               # Project documentation (you’re reading it!)
```

---

## 🛠️ Scripts

```bash
xata init          # Setup Xata connection
drizzle-kit push   # Push schema changes
npm run dev        # Start local server
```

---

## 📜 License

MIT © 2025 [Pavan Kumar Mistry](https://github.com/mistrypavankumar)
