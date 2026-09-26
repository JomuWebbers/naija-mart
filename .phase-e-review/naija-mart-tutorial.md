# Building "Naija Mart" — A Beginner's Walkthrough

A stage-by-stage build log for a small-scale e-commerce platform (inspired by Jumia), built with React + TypeScript, Express + TypeScript, Prisma, and Neon Postgres. Written as we go, including real errors hit along the way and how they were fixed — because the errors are often the most useful part for someone following along.

**Stack:** React (Vite) + TypeScript + Tailwind v4 (frontend) · Express + TypeScript (backend) · Prisma + Neon Postgres (database) · Vercel (deployment, no Docker needed)

---

## Stage 1: Project Structure & Git Setup

Created a root folder with two subfolders — `client` and `server` — to keep frontend and backend independent (this makes deploying each to Vercel separately much simpler later).

```powershell
mkdir naija-mart
cd naija-mart
mkdir client
mkdir server
git init
```

> **Windows/PowerShell note:** `mkdir client server` (space-separated) doesn't work in PowerShell like it does in bash — `mkdir` only accepts one folder at a time. Run them on separate lines, or use `New-Item -ItemType Directory -Path client, server`.

Added a `.gitignore` at the root immediately, before installing anything, so secrets and dependency folders never get committed by accident:

```
node_modules/
.env
.env.local
dist/
build/
.DS_Store
```

---

## Stage 2: Frontend Scaffold (Vite + React + TypeScript + Tailwind v4)

From inside `client`:

```powershell
npm create vite@latest . -- --template react-ts
```

Chose ESLint as the linter when prompted, and let it install + start the dev server automatically.

Installed the rest of the frontend dependencies:

```powershell
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom
npm install leaflet react-leaflet
npm install lucide-react
npm install react-hot-toast
npm install -D @types/leaflet
```

**Wiring up Tailwind v4** (note: this is noticeably simpler than Tailwind v3 — no `tailwind.config.js` or PostCSS setup needed):

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

`src/index.css` (replace entire contents):
```css
@import "tailwindcss";
```

Also added Leaflet's CSS import at the top of `src/main.tsx`:
```typescript
import 'leaflet/dist/leaflet.css'
```

Confirmed Tailwind was working by rendering a test component with utility classes (dark background, large bold white text) and checking it rendered correctly in the browser.

**✅ Checkpoint 1 — first commit:**
```powershell
git add .
git status   # sanity check: confirm node_modules is NOT staged
git commit -m "Initial frontend scaffold: Vite + React + TS + Tailwind v4"
```

---

## Stage 3: Backend Scaffold (Express + TypeScript)

From `naija-mart/server`:

```powershell
npm init -y
npm install express cors dotenv
npm install -D typescript ts-node-dev @types/node @types/express @types/cors
npx tsc --init
mkdir src
```

Created `src/server.ts` with a basic health-check route:

```typescript
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

Added a `dev` script to `package.json`:
```json
"dev": "ts-node-dev --respawn --transpile-only src/server.ts"
```

### Errors hit & fixes (this stage had several — all TypeScript config issues)

**Error: `TypeError: Cannot read properties of undefined (reading 'fileExists')`**
Cause: `npx tsc --init` had installed TypeScript 7.0.2 (a preview release) which `ts-node-dev` doesn't support.
Fix: pin to a stable version —
```powershell
npm uninstall typescript
npm install -D typescript@5.6.3
```

**Error: `"module": "nodenext"` conflicts with CommonJS packages**
Cause: the default `tsconfig.json` from `tsc --init` used strict ESM settings, which don't play well with `ts-node-dev` and packages like Express.
Fix: switched to a classic CommonJS setup:
```jsonc
"target": "ES2020",
"module": "commonjs",
"esModuleInterop": true,
"skipLibCheck": true,
"forceConsistentCasingInFileNames": true,
"strict": true,
"rootDir": "./src",
"outDir": "./dist"
```
Also removed `"types": []`, which was silently blocking `@types/node` and `@types/express` from loading.

**Error: `moduleResolution=node10 is deprecated`, then `moduleResolution: "Node"` capitalization error**
Fix: removed `moduleResolution` entirely — with `"module": "commonjs"`, TypeScript picks the correct resolution automatically. (Also worth noting: it's case-sensitive, so `"Node"` vs `"node"` matters if you do set it explicitly.)

**Error: `ECMAScript imports and exports cannot be written in a CommonJS file under 'verbatimModuleSyntax'`**
Cause: `verbatimModuleSyntax: true` was a leftover from the frontend template's default tsconfig, and it conflicts with CommonJS.
Fix: deleted that line. Also removed `"jsx": "react-jsx"` since it's meaningless for a backend project.

Once these were cleared, `npm run dev` ran cleanly and `http://localhost:5000/health` returned the expected JSON.

> **Side note:** you may see a harmless VS Code error like `Unable to load schema from https://www.schemastore.org/...` — this is just the editor failing to fetch an autocomplete schema file over the network. It doesn't affect your code at all and can be ignored.

**✅ Checkpoint 2 — second commit:**
```powershell
git add .
git status
git commit -m "Initial backend scaffold: Express + TypeScript health check"
```

---

## Stage 4: Push to GitHub

Created a new **empty** repository on GitHub (no README, .gitignore, or license — since a local repo with commits already existed, adding those on GitHub's side would cause a conflict on push).

```powershell
git remote add origin https://github.com/YOUR_USERNAME/naija-mart.git
git branch -M main
git push -u origin main
```

Repo now live with both frontend and backend scaffolds in one initial push.

---

## Stage 5: Database Setup (Prisma + Neon)

Created a free project on [neon.tech](https://neon.tech) — a serverless Postgres provider. Settings used:
- Postgres version: latest stable (18)
- Region: closest available to target users (no African region available on Neon; Europe was the closest choice)
- Skipped "Neon Auth" — this project uses its own JWT + Bcrypt authentication rather than a managed auth service

Installed Prisma from `server`:
```powershell
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```

### Errors hit & fixes

**Issue: `npx prisma init` installed `prisma@8.0.0-rc.13`** — a release candidate, not a stable version, and it created a `prisma.config.ts` file with newer agent-integration features not needed for this project.
Fix: pinned both CLI and client to a stable, matching version:
```powershell
npm uninstall prisma @prisma/client
npm install prisma@6.1.0 --save-dev --save-exact
npm install @prisma/client@6.1.0 --save-exact
```
Deleted `prisma.config.ts` (it required a `prisma/config` module that doesn't exist in 6.1.0).

**Error: `File 'prisma.config.ts' is not under 'rootDir'`**
Cause: `rootDir: "./src"` meant TypeScript expected only files inside `src` — but `prisma.config.ts` sat at the project root.
Fix (before deleting the file, this is the general fix for this class of error): add an explicit `include` field to `tsconfig.json`:
```jsonc
{
  "compilerOptions": { /* ... */ },
  "include": ["src/**/*"]
}
```

**Issue: `schema.prisma` never got created** — likely because the `prisma init` got tangled between the RC version and the later stable reinstall.
Fix: created it manually:
```powershell
mkdir prisma
```
`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

**Issue: Neon connection string copied incomplete** (missing password and `@` separator).
Fix: went back to the Neon dashboard and used the "Show password" / full connection string option rather than reconstructing it manually. Pasted the complete string into `server/.env`:
```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require&channel_binding=require"
```
> ⚠️ **Security note:** if a database password is ever pasted somewhere outside your own machine (a chat, a forum post, a public repo), rotate it immediately from your provider's dashboard. Never commit `.env` to Git — confirm it's listed in `.gitignore` before your first commit involving it.

**Error: `No command registered for 'migrate'`**
Cause: despite uninstalling, `npx prisma` was still resolving to the `8.0.0-rc.13` CLI (a stale/cached copy).
Fix: forced a clean reinstall:
```powershell
npm uninstall prisma
npm cache clean --force
npm install prisma@6.1.0 --save-dev --save-exact
```
Verified with `npx prisma --version` that both `prisma` and `@prisma/client` matched at `6.1.0` before proceeding. (Prisma will nag about a newer version being available — that's expected and safe to ignore, since the RC is intentionally being avoided for stability.)

### Running the first migration

```powershell
npx prisma migrate dev --name init
```

Output confirmed the migration was created and applied, and the database was in sync with the schema — full connection from Prisma → Neon confirmed working end to end.

**✅ Checkpoint 3 — third commit:**
```powershell
git add .
git status
git commit -m "Initial database connection: Prisma + Neon, User model"
git push
```

### A quick note on rotating a database password

Partway through this project, a Neon connection string got shared somewhere it shouldn't have (a chat log). The fix was simple and worth knowing: **rotating a database password does not require a new migration.** Migrations track schema (tables/columns/relations), not credentials. All that's needed after a password rotation is:

1. Update `DATABASE_URL` in `.env` with the new password.
2. Confirm the connection still works — either restart the dev server and hit a route that touches the database, or run:
   ```powershell
   npx prisma db pull
   npx prisma generate
   ```
   `db pull` introspects the live database and confirms Prisma can authenticate; `generate` regenerates the client to match.

> ⚠️ **General rule:** if a database password (or any secret) is ever pasted somewhere outside your own machine — a chat, a forum post, a public repo — rotate it immediately from your provider's dashboard, even if you're fairly sure nothing bad will come of it. It costs almost nothing to rotate, and costs a lot if you're wrong.

---

## Stage 6: Expanding the Schema (Product, Order, Address, DeliveryPartner)

Using a Prisma schema from a reference tutorial project as a *scaffold* rather than copying it wholesale — the goal is to build understanding of the schema design, not just reuse a finished implementation.

The reference schema (from a grocery delivery app tutorial) included five models: `User`, `Address`, `Product`, `Order`, and `DeliveryPartner`. A few adaptations were made to generalize it for a small-scale e-commerce platform (not grocery-specific) and to fit the project's own conventions:

- **Dropped grocery-specific fields** on `Product` — `unit` (e.g. "piece", "kg") and `isOrganic` don't make sense for a general marketplace.
- **Added a `role` field to `User`** (`"customer"` | `"admin"`) — the reference tutorial didn't need this distinction the same way, but this project needs to tell a regular customer apart from the business owner/admin.
- **Standardized all `id` fields to `cuid()`** instead of `uuid()` — purely for consistency with the `User` model created in Stage 5's first migration; no functional difference between the two as identifier strategies.
- **Kept `Address.state`** as a plain string field — this is what supports the project's multi-state delivery scope (Osun, Lagos, Oyo states).
- **Kept `Order.liveLocation` (a `Json` field) and the `deliveryPartnerId` relation** — these directly support live map-based delivery tracking via React Leaflet, one of this project's core scope features.
- **Kept the generator as `"prisma-client-js"`** (the classic client) rather than the reference's newer `"prisma-client"` generator with a custom output path — for consistency with what had already been generated in earlier stages.

Final schema applied via:
```powershell
npx prisma migrate dev --name add_core_models
```

This created `Address`, `Product`, `Order`, and `DeliveryPartner` tables and updated `User` with the new `role` field — all four models now live in the Neon database alongside `User`.

**✅ Checkpoint 4 — fourth commit:**
```powershell
git add .
git status
git commit -m "Add core Prisma schema: User, Address, Product, Order, DeliveryPartner"
git push
```

---

## Stage 7: Wireframing the UI (Before Writing Real Components)

Before building actual React pages, it's worth sketching out layout structure first — this catches layout/UX decisions early, when they're cheap to change, rather than after components are already coded.

**Timing note:** the right moment to wireframe is once the backend foundation (auth, database schema) is solid but before any frontend components exist — wireframing too early means designing blind with no data model in mind; wireframing too late means reworking components you already built.

### Approach used

Rather than jumping to Figma → WordPress → Elementor → WooCommerce (a no-code path considered and rejected — see note below), wireframing stayed inside the same React + Tailwind stack already in use, via **Figma Make** (Figma's AI-assisted prototyping tool that outputs real React/Tailwind code rather than just static images).

> **Why WordPress/WooCommerce was rejected:** that path is for building a store *without* writing custom code — but the whole point of this project is demonstrating a custom-built system (React + Express + Prisma). Switching stacks mid-project would throw away all backend work already done, and WooCommerce doesn't support custom features like live delivery tracking without significant extra plugin work anyway.

A homepage-only wireframe was generated in Figma Make first (desktop-only, no other screens), then reviewed. It covered: announcement bar, header/search, category nav, hero, category showcase, flash sale, best sellers grid, promo banner, new arrivals, brand strip, and footer — all in a clean low-fidelity style (gray placeholder blocks labeled "PRODUCT IMAGE" etc., bold black-and-white typography, no real images or colors except one accent color).

### Filling the gaps

The initial wireframe was missing two things needed for this project:
1. Only one screen (Homepage) — missing Product Detail, Cart, Checkout, Order Tracking, and Login/Register.
2. No mobile responsiveness — fixed-column grids with no breakpoint variants, no mobile navigation pattern.

Rather than manually rebuilding these in Figma, the missing screens and responsive breakpoints were added as actual code, in the same file/style conventions as the original (shared `Wire`, `MicroLabel`, `Divider` primitives extracted into their own file for reuse across screens). Each new screen followed the mobile-first Tailwind approach: unprefixed classes for mobile layout, `sm:`/`md:`/`lg:` prefixes layered on for wider screens.

Key responsive patterns applied to the homepage:
- Header collapses to a hamburger menu + condensed search row below `lg` breakpoint.
- Product grids shift from 4 columns (desktop) to 2 columns (mobile).
- Hero and promo sections stack vertically on mobile instead of sitting side-by-side.
- Footer link columns reflow (5 → 3 → 2 columns) depending on width.

The `Order Tracking` wireframe screen also included a delivery-confirmation OTP block (4-digit code display) tied directly to the `deliveryOtp` field already in the Prisma schema, and a placeholder labeled for the live map component that'll be built with React Leaflet.

### Running the wireframe locally for review

The wireframe was kept as a completely separate project folder (not inside the actual `naija-mart` project, and never committed to its Git repo) — purely a visual reference to click through while building the real components.

```powershell
cd C:\Users\USER
mkdir wireframe-reference
```

Unzipped the wireframe project into that folder, then:

```powershell
npm install
npm run dev
```

### Errors hit & fixes

**Issue: `npm run dev` → "Missing script: dev"**
Cause: the terminal's working directory wasn't actually inside the project folder when the command ran (a mismatch between where files were unzipped and where the terminal was pointed).
Fix: confirmed the actual folder contents with `Get-ChildItem`, and re-ran commands only after `cd`-ing into the correct folder containing `package.json` directly (not one level above it).

**Issue: `npm install` reported "up to date, audited 89 packages" but `node_modules` didn't actually exist**
Cause: unclear — possibly a stale npm cache reference, since this project's original lockfile was a `pnpm-lock.yaml` (Figma Make projects default to `pnpm`), which can cause `npm install` to behave inconsistently.
Fix: deleted `pnpm-lock.yaml` and force-reinstalled with npm directly:
```powershell
Remove-Item pnpm-lock.yaml
Remove-Item -Recurse -Force node_modules   # if present
npm install
```
Verified the actual binary existed afterward with:
```powershell
Get-ChildItem node_modules\.bin\vite*
```

**Issue: `'vite' is not recognized as an internal or external command`**
Cause: direct downstream effect of the above — `vite` genuinely wasn't installed yet.
Fix: resolved automatically once the clean reinstall above completed.

Once `npm run dev` ran cleanly, the wireframe was reviewed by resizing the browser window to confirm mobile breakpoints kicked in correctly (hamburger menu appearing, grids collapsing) before moving on to building real components.

---

## Stage 8: Real Login/Register Pages + Wiring the Homepage

With the wireframe reviewed and the backend auth endpoints already working, it was time to build actual pages that talk to the real backend.

### Routing and API setup

Installed nothing new here (`react-router-dom` was already installed in Stage 2). Wrapped the app in `BrowserRouter` inside `main.tsx`, and added `react-hot-toast`'s `<Toaster />` for user-facing success/error messages.

Created a small shared API helper (`client/src/lib/api.ts`) so every request doesn't repeat the base URL, JSON headers, and error handling:
```typescript
export async function apiRequest(path: string, options: RequestOptions = {}) {
  const res = await fetch(`${BASE_URL}${path}`, { /* method, headers, body */ })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Something went wrong')
  return data
}
```

### Auth state with Context

Built a small `AuthContext` to hold the logged-in user + JWT token across the app, persisted to `localStorage` so a refresh doesn't log the user out.

**Error hit: "Fast refresh only works when a file only exports components."**
Cause: Vite's Fast Refresh (component hot-reloading) requires a `.tsx` file to export *only* React components — mixing in a plain function (like a `useAuth` hook, or a `createContext` call) in the same file breaks that rule.
Fix: split into three separate files, each with a single responsibility:
- `auth-context.ts` — just the `createContext` call and TypeScript types (no JSX)
- `AuthContext.tsx` — just the `AuthProvider` component
- `useAuth.ts` — just the consumer hook

This same pattern applies to any context you build going forward: **types/context creation, the provider component, and the consumer hook each get their own file.**

### Building the pages

Created `Login.tsx` and `Register.tsx` in `client/src/pages`, each a simple form calling `apiRequest('/auth/login' | '/auth/register', ...)`, storing the result via `login(user, token)` from the auth context, showing a toast, and redirecting to the homepage on success.

**Error hit: file casing conflict** — `TypeScript: "Login.tsx" differs from "login.tsx" only in casing"`.
Cause: likely a duplicate file created at some point with different casing (Windows treats filenames as case-insensitive, but the TS compiler's internal tracking does not, causing a conflict warning even if only one file actually exists on disk).
Fix: confirmed via `Get-ChildItem` that only one file existed, then cleared the warning with **TypeScript: Restart TS Server** from VS Code's Command Palette (`Ctrl+Shift+P`).

### Porting the wireframe homepage into the real project

The wireframe's `Homepage.tsx` (fully responsive, reviewed and approved earlier) was copied from the disposable `wireframe-reference` project into the real codebase at `client/src/pages/Home.tsx`, along with its shared `Wire`/`MicroLabel`/`Divider` primitives, relocated to `client/src/components/wireframe-primitives.tsx`.

**Error hit: same Fast Refresh warning again**, this time because `wireframe-primitives.tsx` mixed component exports (`Wire`, `MicroLabel`, etc.) with plain helper functions (`fmt`, `pct` — currency/percentage formatters).
Fix: same pattern as before — split the plain functions out into their own file, `wireframe-helpers.ts`.

**Two real bugs hit once the homepage rendered:**

1. **The "Shop Now" button was invisible.** Cause: it used a CSS variable (`--vermilion`) for its background color, which had only ever been defined in the *wireframe's* `index.css` — not in the real project's `index.css`. Since undefined CSS variables resolve to nothing, the button had no background color, and with white button text, it disappeared entirely against the white page background.
   Fix: added the missing variable definition to `client/src/index.css`:
   ```css
   :root {
     --vermilion: #E63312;
   }
   ```

2. **Branding still said "MARKT"** in the ported homepage — a leftover placeholder brand name from the original Figma Make wireframe. Renamed to the project's actual name, **Naija Mart**, across the header, `Login`, and `Register` pages.

**✅ Checkpoint 5 — fifth commit:**
```powershell
git add .
git status
git commit -m "Add Login/Register pages with auth context, wire up real Homepage from wireframe"
git push
```

At this point: real registration and login work end-to-end against the live backend + database, and the homepage renders using the reviewed wireframe design (still with placeholder product data, not yet connected to the database — that's the next stage).

---

## Stage 9: Products Feature — Backend CRUD + Role-Based Access

With auth and the homepage in place, the next step was letting the backend actually manage products — list them publicly, but restrict create/update/delete to admin users only.

### Auth middleware

Before writing product routes, a reusable middleware was needed to (1) verify a request carries a valid JWT, and (2) check the decoded user's role. Created `server/src/middleware/authMiddleware.ts` with two functions: `protect` (verifies the token, attaches `userId`/`userRole` to the request) and `isAdmin` (checks `userRole === 'admin'`, run *after* `protect` in the route chain).

**A cluster of TypeScript errors surfaced here, all from the same root cause: the project's `tsconfig.json` has `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` enabled (from Stage 3's cleanup), which make TypeScript flag anything that *could* theoretically be `undefined` — even values that are always present in practice.**

- **`jwt.verify(...)`'s return type didn't match the expected shape directly.** Fixed by casting through `unknown` first: `as unknown as { userId: string; role: string }`.
- **`process.env.JWT_SECRET` is typed `string | undefined`**, but `jwt.verify`/`jwt.sign` want a guaranteed `string`. Fixed by adding an explicit runtime check before using it:
  ```typescript
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return res.status(500).json({ message: 'Server misconfiguration: missing JWT secret' })
  }
  ```
- **`authHeader.split(' ')[1]` (extracting the token) is typed as possibly `undefined`** because of `noUncheckedIndexedAccess` (array access is never assumed "safe" by default). Fixed with an explicit guard: `if (!token) { return res.status(401)... }`.
- **`req.params.id` had the same "possibly undefined" issue**, and in some Express type versions is even typed as `string | string[]` (to account for repeated URL segments). Fixed by destructuring and guarding: `if (!id || Array.isArray(id)) { ... }` before using `id` in any Prisma query.

**General lesson from this stage:** with these strict tsconfig settings, *any* value pulled from `req.params`, `req.query`, or array/split results needs an explicit `undefined`/array check before use — this will keep coming up in every future controller.

### Product routes

Built `productController.ts` (full CRUD: `getProducts`, `getProductById`, `createProduct`, `updateProduct`, `deleteProduct`) and `productRoutes.ts`, mounting public routes (`GET /`, `GET /:id`) without middleware, and protected routes (`POST /`, `PATCH /:id`, `DELETE /:id`) behind both `protect` and `isAdmin`.

**On PUT vs PATCH vs OPTIONS vs HEAD:** decided to use `PATCH` (not `PUT`) for updates, since update requests will typically only send a few changed fields rather than the entire resource — `PATCH` is the semantically correct choice for partial updates. `OPTIONS` (CORS preflight) and `HEAD` don't need manual route handlers — `cors` middleware and Express handle those automatically.

**A Prisma-specific type error also came from `exactOptionalPropertyTypes`:** building an optional `where` filter like `{ where: category ? { category } : undefined, ... }` failed, because explicitly passing `undefined` to an optional property isn't the same as omitting it entirely under this setting. Fixed with a conditional spread instead, so the key is either present or fully absent from the object:
```typescript
const products = await prisma.product.findMany({
  ...(category ? { where: { category: category as string } } : {}),
  orderBy: { createdAt: 'desc' },
})
```

### Testing in Postman

Organized requests into a `Products` folder (sibling to `Auth`) inside the `naija-mart` collection.

**Error hit repeatedly: `Cannot POST /api/auth/products` (404).**
Cause: new requests were created by duplicating/copying from inside the `Auth` folder, which carried over a wrong base path. Folder placement in Postman doesn't fix a request's URL — the URL text itself has to be corrected.
Fix: manually corrected the URL field to `{{baseUrl}}/api/products` on each affected request.

**Attempted convenience that didn't pan out: auto-saving the JWT to a collection variable via a post-response script**, so future requests could reference `{{authToken}}` instead of pasting the token by hand each time. The script itself was correct (`pm.collectionVariables.set("authToken", response.token)`), attached at the collection level so it'd run after both Login and Register — but the saved variable never reliably showed up in Postman's UI, and troubleshooting it (checking Environment vs Collection variable scopes, console errors, save states) ate more time than it was worth for a project at this stage.
**Decision:** dropped the automation and just copy-pasted the token manually into each protected request's Authorization tab going forward — a perfectly fine tradeoff for a project with a handful of protected routes, not worth the fight to automate.

**Error hit: `500 Internal Server Error` on PATCH/DELETE tests.**
Cause: the request URL still had the literal placeholder text `{id}` in it (e.g. `{{baseUrl}}/api/products/{id}`) instead of a real product ID — Prisma tried to find a product with the literal string `"{id}"` and failed, which the generic `catch` block turned into a 500.
Fix: replaced `{id}` with an actual product ID copied from a prior `Create Product` response.

(Note for later: Postman supports real path variables via `:id` syntax in the URL, which then exposes an editable field under the Params tab — a nicer workflow than manually editing the URL each time, though not required.)

### Confirming the full chain

To test the admin-only routes, a test user's `role` was flipped from `"customer"` to `"admin"` directly in the database using **Prisma Studio** (`npx prisma studio`, opens a visual table browser at `localhost:5555`) — since nothing in the app itself creates admin users yet. A fresh login was required afterward, since a JWT's role claim is baked in at sign-in time and doesn't update retroactively when the database changes.

With an admin token, all four operations were confirmed working end-to-end against the live Neon database:
- `GET /api/products` → public, no auth, returns the product list
- `POST /api/products` → `201`, admin-only, creates a product with correct schema defaults applied
- `PATCH /api/products/:id` → `200`, admin-only, partial update applied correctly
- `DELETE /api/products/:id` → `200`, admin-only, deletion confirmed

**✅ Checkpoint 6 — sixth commit:**
```powershell
git add .
git status
git commit -m "Add Products CRUD routes with JWT auth + admin-only middleware"
git push
```

(One unrelated hiccup here: `git push` briefly failed with `Could not resolve host: github.com` — a local network/DNS issue, not a Git problem. Resolved itself on retry.)

---

## Stage 10: Connecting the Homepage to Real Product Data

With Products CRUD working on the backend, the homepage's hardcoded dummy `PRODUCTS` array was replaced with a real fetch to `/api/products`.

### The fetch

Added `useState`/`useEffect` inside the `Homepage` component to fetch products on mount:
```typescript
const [products, setProducts] = useState<Product[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  apiRequest('/products')
    .then(data => setProducts(data))
    .catch(() => setProducts([]))
    .finally(() => setLoading(false))
}, [])
```
Added a matching `Product` type near the top of the file (outside the component), and updated the category filter logic to read from `products` (state) instead of the old hardcoded constant. Deleted the old dummy `PRODUCTS` array once nothing referenced it anymore.

**Errors hit — all from partial-paste, not real bugs:**
Several TypeScript errors (`'PRODUCTS' is declared but never read`, `Cannot find name 'setProducts'`, `Parameter 'p' implicitly has an 'any' type`) all traced back to the same cause: pieces of the new code (the `Product` type, the `useState` declarations) hadn't actually been added yet — only the `useEffect`/filter logic had been pasted in isolation. Once all four pieces were confirmed in their correct locations (type outside the component, state + effect inside it near the top, old dummy array deleted), the errors cleared.
**Lesson:** when copying a multi-part code change, place *every* piece (types, state, effects, and any code that used the old version) before checking for errors — a partial paste produces confusing, seemingly-unrelated error messages.

### A real bug the test data exposed

Once real products loaded, some showed a `-Infinity%` discount badge. Cause: products created via Postman during backend testing hadn't included `originalPrice`, which defaults to `0` per the schema. The discount formula (`(1 - price / originalPrice) * 100`) divides by zero when `originalPrice` is `0`, producing `Infinity`, and `1 - Infinity` is `-Infinity`.

**Fix:** added a guard so the strikethrough price and discount badge only render when there's an actual valid discount:
```typescript
const hasDiscount = original > price
// ...
{hasDiscount && (
  <>
    <span className="line-through">{fmt(original)}</span>
    <span className="badge">-{pct(price, original)}%</span>
  </>
)}
```

This is a good example of test data surfacing a real edge case (a product with no discount configured) before it could cause a confusing bug with actual inventory later.

**✅ Checkpoint 7 — seventh commit:**
```powershell
git add .
git status
git commit -m "Connect homepage to real backend products, fix -Infinity% discount bug"
git push
```

---

## Stage 11: Real Product Detail Page + Grid Breakpoint Fix

With the homepage pulling live data, the next step was wiring up a real Product Detail page using the wireframe's `ProductDetail.tsx` as the layout reference, fetched by ID via routing.

### Porting and connecting

Copied the wireframe's `ProductDetail.tsx` into `client/src/pages/ProductDetail.tsx`, then replaced its hardcoded `PRODUCT` object with a real fetch using `useParams()` (to read the `:id` from the URL) and `apiRequest`:

```typescript
const { id } = useParams()
const [product, setProduct] = useState<Product | null>(null)
const [notFound, setNotFound] = useState(false)

useEffect(() => {
  if (!id) return
  apiRequest(`/products/${id}`)
    .then(data => setProduct(data))
    .catch(() => setNotFound(true))
}, [id])
```

Added the route in `App.tsx` (`<Route path="/products/:id" element={<ProductDetail />} />`) and made homepage product cards clickable by wrapping them in a `react-router-dom` `Link` pointing to `/products/${p.id}`.

**Errors hit — mostly incomplete find-and-replace passes, same class of mistake as Stage 10:**
- `Cannot find name 'PageShell'` — the import line only listed `Wire, MicroLabel, Divider`, missing `PageShell` (also exported from the same primitives file).
- `Property 'tag'/'reviews' does not exist on type 'product'` — leftover references to the old hardcoded object's field names (`PRODUCT.tag`, `PRODUCT.reviews`) that hadn't been renamed to match the real API's fields (`product.category`, `product.reviewCount`).
- **Lesson repeated from Stage 10:** when renaming fields across a pasted file, search for *every* occurrence of the old names before testing — a partial rename produces error messages that look unrelated to each other but share one root cause.

**A lint warning, not an error:** "Avoid calling setState() directly within an effect" on an explicit `setLoading(true)` call. Resolved by removing the separate `loading` boolean entirely and inferring loading state from `product` being `null` and `notFound` being `false` — one less state variable, and the pattern reads more naturally: "no product yet, and no failure yet" *is* the loading state, rather than needing to track it separately.

Also reused the same `hasDiscount` guard pattern from Stage 10 (`original > price`) here, since the same missing-`originalPrice` test data would otherwise cause the same `-Infinity%` bug on this page too.

### A responsive design gap it surfaced

While testing, viewing the homepage in a narrower browser (e.g., with a browser sidebar panel open eating into viewport width) showed 4 cramped, truncated product cards squeezed into too little space. Cause: the product grids used `grid-cols-2 sm:grid-cols-4` — a hard jump straight from 2 columns to 4 columns with no step in between, so any viewport width landing between roughly 640px and 1024px got stuck with 4-column density but not enough room for it.

**Fix:** added a middle breakpoint across all three product grids (Best Sellers, Flash Sale, New Arrivals):
```typescript
// Before
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
// After
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
```
This gives a proper 3-column "tablet zone" between mobile and full desktop, rather than jumping straight to the densest layout too early.

**Non-issue worth noting:** a grid with an item count not evenly divisible by its column count (e.g. 5 products in a 3-column grid) will naturally leave an empty trailing cell in the last row — this is expected grid behavior, not a bug, and resolves itself once there are more real products.

**✅ Checkpoint 8 — eighth commit:**
```powershell
git add .
git status
git commit -m "Add real Product Detail page wired to backend, fix homepage grid breakpoint gap"
git push
```

---

## Stage 12: Cart Feature + Shared Layout Refactor

With products browsable and viewable, the next step was letting users actually add items to a cart. Since the schema has no separate Cart table (a cart only becomes a real `Order` once checkout happens), this was built as pure client-side state, persisted to `localStorage`.

### Cart context

Built `CartContext` using the same 3-file split pattern established for `AuthContext` back in Stage 8 (`cart-context.ts` for types/context creation, `CartContext.tsx` for the `CartProvider` component, `useCart.ts` for the consumer hook) — avoiding the Fast Refresh warning from the start this time, rather than fixing it after the fact.

The provider tracks `items: CartItem[]` in state, syncs to `localStorage` via a `useEffect` on every change, and exposes `addToCart`, `removeFromCart`, `updateQty`, `clearCart`, plus derived `totalItems` and `subtotal`. Wrapped the app with `<CartProvider>` alongside the existing `<AuthProvider>` in `main.tsx`.

Wired "Add to Cart" on the Product Detail page to call `addToCart(...)` with a toast confirmation, and ported the wireframe's `Cart.tsx` into `client/src/pages/Cart.tsx`, replacing its hardcoded item list with the real `items` from context.

### The gap this exposed: no shared header across pages

Testing revealed the cart count only updated on the homepage — because **the header/nav was only ever written inside `Home.tsx`**, never extracted into something every page could share. `ProductDetail.tsx` and `Cart.tsx` had no header at all.

**Fix: extracted a shared `Layout` component** (`client/src/components/Layout.tsx`) holding the announcement bar, header (logo, search, account, cart count), mobile menu, and category nav — ending in a React Router `<Outlet />` where the active page renders. Routes were then nested under it in `App.tsx`:
```typescript
<Route element={<Layout />}>
  <Route path="/" element={<Home />} />
  <Route path="/products/:id" element={<ProductDetail />} />
  <Route path="/cart" element={<Cart />} />
</Route>
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
```
(`Login`/`Register` stay outside `Layout`, since they were designed as standalone centered cards without the storefront header.)

This refactor also meant moving `NAV_CATEGORIES` and the `activeNav` filter state out of `Home.tsx` into `Layout` (since the category nav buttons live there now) — while `Home.tsx` still needed to *read* `activeNav` to filter its product grid. Solved with React Router's `useOutletContext()`: `Layout` passes `<Outlet context={{ activeNav }} />`, and `Home.tsx` reads it back with `useOutletContext<{ activeNav: string }>()`.

### Errors hit during the refactor

This was the largest single refactor of the project so far, and produced a cluster of related mistakes worth detailing since they're common when restructuring an already-large component file:

- **Incomplete first attempt at extracting the header:** the first pass at `Layout.tsx` was missing the search bar, account/cart section, and mobile cart+hamburger controls entirely, and left a broken JSX comment (`{/* instructions ... */ ... }` never properly closed with `*/}`) which caused a stray `}` right before `<Outlet />`. **Lesson:** when moving a large block of JSX between files, move it as one complete, verified unit — don't retype or reconstruct it from memory/instructions, since it's easy to drop pieces silently.
- **Double-nested grid:** after adding the loading/empty/loaded ternary for the product grid, a leftover outer `<div className="grid ...">` still wrapped the whole ternary, while the "loaded" branch had its *own* grid div inside — producing a grid-inside-a-grid. Fixed by removing the outer wrapper, since the ternary's loaded branch already supplied its own grid container.
- **A genuinely hard-to-spot bug: a stray extra `</div>` with no matching opening tag**, left over after deleting surrounding code, silently unbalanced the whole file's JSX and produced a **blank white page** — no terminal error, since it was a runtime crash, not a build failure that Vite would catch and print clearly in every case.
  **Debugging approach that worked:** first checked the *wrong* terminal (the backend's, port 5000, showing no relevant errors) before realizing the frontend's own `npm run dev` terminal (port 5173) needed checking — a good habit to establish early: always confirm which terminal/process actually owns the error you're chasing.
- **A real runtime crash from the routing restructure itself:** `Home.tsx` called `useOutletContext()`, but `App.tsx` still had `Home` as a top-level route, not nested inside `<Route element={<Layout />}>` yet — so there was no `<Outlet>` providing that context, and destructuring `{ activeNav }` off `undefined` crashed the whole render, again producing a blank white page with no build-time error.
  **Debugging approach:** since the terminal showed no errors, the issue had to be a *runtime* JS exception — moved to the browser's own DevTools Console (not the terminal) to find it. **General lesson:** a clean terminal + a blank/broken page in the browser almost always means a runtime error, and the browser console (not the terminal) is where to look next.
- **A short-lived, ultimately unrelated `500` error** on `/api/products/1` — traced via the Network tab's "Initiator" info, but turned out to be a stale/transient request (literal ID `"1"`, which nothing in the current codebase actually requests) that resolved itself once the real routing bug above was fixed. **Lesson:** not every error visible in the console during active debugging is the one causing the symptom you're chasing — confirm an error is still reproducible before spending more time on it.

### A real infrastructure quirk, not a bug

Separately, a later `PrismaClientInitializationError: Can't reach database server` turned out to be **Neon's free-tier cold start** — after a period of inactivity, the database suspends, and the first request afterward can take several seconds (or fail once) while it wakes back up. Retrying after ~10 seconds resolved it. This is an expected constraint of Neon's free tier, not a bug to fix — worth remembering (and mentioning in project documentation/demos) that the very first request after any idle period may be slow or need a retry.

**✅ Checkpoint 9 — ninth commit:**
```powershell
git add .
git status
git commit -m "Add Cart feature with localStorage persistence, extract shared Layout with header/nav across all pages"
git push
```

---

## Stage 13: Checkout + Orders

With Cart working, the next step was turning a cart into a real order — backend first, then the Checkout UI.

### Backend: Orders API

Built `orderController.ts` with five endpoints: `createOrder` (any logged-in user), `getMyOrders` (the current user's own orders), `getOrderById` (owner or admin only — checked via `order.userId !== userId && req.userRole !== 'admin'`), `getAllOrders` (admin-only, every order), and `updateOrderStatus` (admin-only, appends to `statusHistory` rather than overwriting it). Mounted via `orderRoutes.ts` with the same `protect`/`isAdmin` middleware pattern established in the Products stage.

No new TypeScript errors this time — the `noUncheckedIndexedAccess`/`exactOptionalPropertyTypes` guard patterns from Stage 9 (checking `req.params.id` for `undefined`/array) were applied proactively from the start, since they were now a known, expected pattern rather than something to discover through trial and error.

**Tested thoroughly via Postman before touching the frontend** — a good habit reinforced from the Products stage: confirmed order creation, correct `total` calculation (subtotal + delivery + tax), correct `isPaid` logic (`false` only for "Pay on Delivery"), and all three access-control cases (owner viewing their own orders, admin viewing all orders, a regular customer correctly blocked from the admin-only list route) before writing any UI.

### Frontend: real Checkout page

Ported the wireframe's `Checkout.tsx`, connected it to `useCart()` (for items/subtotal), `useAuth()` (for the JWT token), and `POST /api/orders`. On success: clears the cart, shows a toast, and navigates to `/orders/:id`.

**Error hit: same missing-import pattern as Stage 11** — `Cannot find name 'PageShell'`, because the import line only listed `Wire, MicroLabel, Divider` again, omitting `PageShell`. **Lesson reinforced:** when porting any wireframe file, check which components it actually references before assuming the same three cover every file.

**Error hit: "Not authorized, no token provided"** despite the backend working correctly in Postman — cause was simply not being logged into the actual website in the browser (Postman's saved token and the browser's `localStorage` are completely separate; testing one doesn't log you into the other).

### A real UX/data-quality decision: state-dependent LGA dropdown

The original wireframe used a free-text city input. Since delivery tracking is scoped to specific LGAs across three states, a free-text field risked typos and unusable location data. Replaced it with a `CITIES_BY_STATE` lookup object and a dependent `<select>` that repopulates (and resets) whenever the state changes — so the city value is always a valid, known LGA rather than arbitrary text.

### Deliberate scope decisions: Promo Code and payment methods

Two features visible in the wireframe were deliberately left **decorative only**, not functional, after weighing the cost against the project's actual core scope:
- **Promo Code input** — a real implementation would need a new `Coupon` database model, admin management UI, and validation logic (expiry, usage limits, minimum order amount). Kept visually present per the wireframe design, but does nothing when used.
- **All three payment methods** ("Card (Paystack)", "Bank Transfer", "Pay on Delivery") — none currently process a real payment. The order records whichever method was selected and sets `isPaid` accordingly, but no payment gateway is connected. Real Paystack/Flutterwave integration (API keys, webhook confirmation) was deferred to its own dedicated future stage rather than bolted on here.

**Lesson:** not every visible UI element from a wireframe needs to be fully functional immediately — deciding what's cosmetic-for-now vs. what's core is itself a legitimate scoping decision worth documenting, not a shortcut to hide.

### Order Confirmation page

Built `OrderConfirmation.tsx` (`/orders/:id`), fetching the real order and displaying delivery address, itemized items, subtotal/delivery/total, and a paid/unpaid badge.

**Non-issue worth noting:** the Naira symbol (₦) renders with two horizontal strokes through the "N" as part of its actual character design (similar to € or ₹) — this can look like an accidental CSS `line-through` style at a glance, but it's correct, expected rendering, not a bug.

**✅ Checkpoint 10 — tenth commit:**
```powershell
git add .
git status
git commit -m "Wire real Checkout to orders API with state-based LGA dropdown, add Order Confirmation page"
git push
```

---

## Stage 13: Checkout + Orders

With Cart working, the next step was turning a cart into a real order — backend routes first, then the real Checkout page.

### Orders backend

Built `orderController.ts` with five endpoints: `createOrder` (logged-in users), `getMyOrders` (a user's own order history), `getOrderById` (with an ownership check — only the order's owner or an admin can view it), `getAllOrders` (admin-only), and `updateOrderStatus` (admin-only, appends to `statusHistory` rather than overwriting it). Mounted via `orderRoutes.ts` with the same `protect`/`isAdmin` middleware pattern established in Stage 9.

`isPaid` is derived automatically at creation: `paymentMethod !== 'Pay on Delivery'` — since Pay on Delivery genuinely isn't paid yet, while every other method is treated as paid immediately for now (no real payment gateway confirms this yet — see below).

Tested via Postman using two accounts: the existing admin account, and a freshly registered plain `customer` account (needed since the original test user had been flipped to admin back in Stage 9). Confirmed order creation, ownership-scoped fetching, and admin-only listing all worked correctly, including the `total` calculation (`subtotal + deliveryFee + tax`) and `isPaid` logic.

### Real Checkout page

Ported the wireframe's `Checkout.tsx`, connecting it to `useCart()` (for items/subtotal), `useAuth()` (for the JWT token), and `POST /api/orders`. On success: clears the cart, shows a toast, and navigates to `/orders/:id`.

**A state-dependent city/LGA fix:** the original wireframe used a free-text city input, which risked bad data for a feature (delivery tracking) that depends on knowing the delivery area precisely. Replaced it with a `<select>` populated from a `CITIES_BY_STATE` lookup (LGA lists for Osun, Lagos, and Oyo), reset whenever the state dropdown changes so a stale LGA from a different state can't linger.

**Two features deliberately left decorative, not functional, for now:**
- **Promo Code input** — kept visually in place (matches the wireframe), but does nothing. Building real promo codes would need a new database model, admin management, and validation logic — a meaningfully separate feature, not worth building before core order flow is solid.
- **Payment method selection** — all three options (Card/Paystack, Bank Transfer, Pay on Delivery) are selectable and stored on the order, but none actually process payment yet. Real Paystack/Flutterwave integration (redirect flow, webhook confirmation) is planned as its own future stage.

**A recurring debugging pattern repeated here:** a blank white page on `/checkout` after porting the wireframe file, same symptom as Stage 12's `Home`/`Layout` crash. This time, the browser console showed no visible error at all — worth noting as a real edge case: **absence of a console error doesn't always mean absence of a crash.** Diagnosed instead by inspecting `<div id="root">` directly in DevTools' Elements tab — finding it completely empty confirmed React had failed to render anything, even without a logged exception. The actual cause (this time) was a missing `PageShell` import, the same class of mistake as Stage 11 — a reminder that **every** ported wireframe file needs its imports checked against what it actually uses, not assumed from a previous file's import list.

### Order Confirmation page

Built `OrderConfirmation.tsx` (`/orders/:id`) — fetches the order by ID, and displays delivery address, itemized products, subtotal/delivery/total, and a paid/unpaid badge. (Note: Nigeria's Naira symbol, ₦, has two horizontal strokes built into the character glyph itself — this can look like a CSS strikethrough at a glance, but it's just the currency symbol rendering correctly, not a bug.)

**✅ Checkpoint 10 — tenth commit:**
```powershell
git add .
git status
git commit -m "Wire real Checkout to orders API with state-based LGA dropdown, add Order Confirmation page"
git push
```

---

## Stage 14: Delivery Tracking (Tier 1)

Before building, the feature was analyzed in two tiers: **Tier 1** (a static assigned location shown on a real map, no movement simulation) and **Tier 2** (Inngest-driven simulated courier movement along a route). Tier 1 was built first regardless of the final decision, since it's the same foundation either way — Tier 2 would only add a movement layer on top, not replace anything.

### Backend: coordinates, delivery partners, and assignment

Built a fixed **LGA-to-coordinates lookup** (`server/src/data/lgaCoordinates.ts`) covering all Local Government Areas across the four supported states (Osun, Ogun, Lagos, Oyo — Ogun added mid-project after a Chapter One scope discussion), plus a per-state "warehouse" starting coordinate. This avoids needing a real geocoding API call for every address — a fixed lookup is simpler, has no rate limits, and is accurate enough for map display purposes.

Built full `DeliveryPartner` CRUD (create, list, delete) and an `assignDeliveryPartner` order endpoint that sets `deliveryPartnerId`, generates a delivery OTP (initially 4 digits, later changed to 6 on request), sets `liveLocation` to the order's state warehouse coordinate, and updates order status.

**A scope correction worth noting:** the assignment endpoint originally jumped straight from assigning a partner to `"Out for Delivery"` status in one step. On review, this was wrong — the original plan explicitly listed *assigning* a partner and marking an order *out for delivery* as two separate admin actions. Fixed by introducing a distinct `"Assigned"` status between `"Confirmed"` and `"Out for Delivery"`, giving a proper five-stage flow (`Placed → Confirmed → Assigned → Out for Delivery → Delivered`), with `Cancelled` available as an admin-only terminal state outside that linear progression.

**Errors hit — a now-familiar pattern:** several strict-TypeScript errors (`P2002` duplicate-key handling for delivery partner emails, `P2025` for delete-not-found) were fixed using the same "catch the specific Prisma error code, return the correct HTTP status" pattern established back in Stage 9 — a `409 Conflict` for a duplicate email is more useful to an API consumer than a generic `500`, since it tells them *why* the request failed rather than implying something broke.

### Frontend: the Order Tracking page

Built a real tracking page with a Leaflet map, OTP display, delivery partner info, and a status timeline — polling the order every 5 seconds for near-live updates rather than using WebSockets (simpler, and visually indistinguishable from real-time at this interval).

**Tile provider saga — three providers tried before landing on one that worked reliably:**
1. **OpenStreetMap's own tile servers** — hit a one-off `ERR_CONNECTION_TIMED_OUT` on both `a.tile` and `b.tile` subdomains. Confirmed as a transient network issue (not a permanent block) by testing direct access to openstreetmap.org separately.
2. **CARTO's free tiles** — connected fine, but every tile rendered with a watermark reading "API KEY REQUIRED," since CARTO's anonymous free tier had been retired in favor of a key-gated one.
3. **Esri's World Street Map tiles** — worked cleanly with full map detail and no key required. Note the URL's tile-order convention is `{z}/{y}/{x}`, not the more common `{z}/{x}/{y}` — easy to get backwards.

**Two dead pins fixed with a design change:** initially, the map showed a "warehouse" marker and a "current position" marker — but since Tier 1 sets `liveLocation` directly to the warehouse coordinate, both markers sat exactly on top of each other, visually indistinguishable. Fixed by showing the **current position** and the **destination LGA** instead (connected by a dashed line) — a more meaningful pair of points to display given Tier 1 has no real movement yet.

**A resilient-polling bug, twice:**
- First version: a single failed poll (e.g. a Neon cold-start delay) immediately flipped the page to "Order not found," even though the *previous* successful fetch already had good data on screen. Fixed by only trusting a failure as genuine "not found" *after* at least one successful load — later polls that fail just silently keep showing the last known good data.
- This didn't cover failures during the *first* load though (before any success had happened yet) — exactly the scenario a Neon cold-start produces. Fixed with a small retry allowance (up to 4 attempts, spaced by the 5-second poll interval) before showing "not found," giving the database roughly 15-20 seconds to wake up.

**Lint note, not a bug:** adding a ref-tracked flag (`hasLoadedOnce`) to a `useEffect`'s dependency array would have caused the polling interval to restart on every successful fetch — refs are intentionally exempt from React's dependency-tracking rules for exactly this "remember something across renders without re-running the effect" use case.

### Timeline redesign — rounded cards + icons

The status timeline went through two rounds of styling, both intentional design changes:
1. Square, black-border icons matching the storefront's brand aesthetic (consistent with every other page built so far).
2. Switched to rounded, colored, icon-based steps (using `lucide-react` icons) after reviewing the grocery tutorial's own timeline component — including a distinct "current step" state (a pulsing ring via Tailwind's `animate-ping`, layered as a separate absolutely-positioned element behind the solid icon, since animating the ring itself isn't a built-in utility).

This intentionally makes the admin/tracking areas look visually distinct from the black-and-white storefront — a deliberate choice (common in real products, where admin tooling often has its own visual language), not an inconsistency.

**✅ Checkpoint 11 — commit:**
```powershell
git add .
git status
git commit -m "Add delivery tracking Tier 1: LGA coordinates, delivery partners, assignment, live map, OTP, status timeline"
git push
```

---

## Stage 15: Admin Dashboard

### Choosing a design source — two dead ends first

Two additional reference projects were uploaded and checked before settling on a design source:
- A "full-stack AI e-commerce" backend zip — genuinely backend-only (controllers, models, routes), no frontend or admin UI at all to reference.
- Its matching frontend zip — a real, complete customer-facing storefront (with an AI-powered product search feature using Gemini), but **no admin section whatsoever**.
- A third "ecommerce dashboard template" zip looked promising by name, but turned out to be an unfinished starter kit — nearly every meaningful component (`Dashboard`, `Orders`, `Header`, `Stats`, `SideBar`, `Users`, `Products`) was a literal empty stub (`return <></>`). Only its three product modals (Create/Update/View) had real, complete code.

**Lesson worth repeating:** a promisingly-named reference file isn't automatically a usable design source — each one needed actually opening and checking before deciding whether it contributed anything, and two out of three didn't.

The **grocery tutorial reference** remained the only genuinely complete, working admin design to draw from, and was adopted as the sole design source going forward: rounded cards, `lucide-react` icons, indigo accent colors — a different visual language from the storefront, deliberately.

### What got built

- **`AdminRoute`** — a route guard component redirecting non-admins away from `/admin/*` routes.
- **`AdminOrders`** — a table of all orders with a status dropdown (five statuses + Cancelled) and an "Assign Delivery Partner" modal (radio-select from existing partners), both wired to the real backend endpoints built in Stage 14.
- **`AdminProducts`** — a product table with Add/View/Edit/Delete actions, using a shared `ProductFormModal` (one component handling both create and edit, adapted from the unfinished dashboard template's modal pattern — but with Redux removed in favor of the project's existing `apiRequest`/`useAuth` pattern).

**A lint-pattern fix repeated from earlier stages:** `ProductFormModal`'s edit-mode form initially used a `useEffect` to populate form fields from the `product` prop after mount, triggering the same "avoid calling setState in an effect" warning seen back in `ProductDetail.tsx`. Fixed more cleanly this time by using `useState`'s lazy initializer function to compute the correct starting values directly, since the data was already available synchronously — no effect needed at all.

### Also decided: no AI customer-support chatbot

A detailed AI-support-agent proposal (RAG knowledge base, sentiment detection, confidence scoring, omnichannel sync, analytics) was reviewed and explicitly rejected as out of scope — each individual piece is roughly its own multi-week project, and combined they approach the scope of a commercial support platform, not an addition to a single-developer final year project. The original plan (human-to-human support chat via Stream Chat, JWT-authenticated) stays as-is. A much smaller, separate AI-assisted product search feature (using Gemini, modeled on a reference project's real working example) was noted as a possible later addition — kept entirely independent of customer support.

**✅ Checkpoint 12 — commit:**
```powershell
git add .
git status
git commit -m "Add admin dashboard: orders management, product management, role-gated routing"
git push
```

---

## Stage 16: Real Product Image Upload (Cloudinary)

With product upload set as the platform's top priority feature, the admin product form's plain "paste an image URL" field was replaced with genuine file upload — since a real small-scale seller has photos on their phone, not hosted image URLs.

Checked the grocery reference's own image-upload UI first: it had a nice file-input-with-live-preview pattern (using `URL.createObjectURL` for an instant preview before any upload completes), but its actual submit handler was empty — no real Cloudinary call anywhere. The preview pattern was adopted; the actual upload logic was built from scratch.

**Backend:** installed `cloudinary` + `multer` (both already anticipated in the original tech stack, just not wired up until now). Built a `POST /api/upload` route (admin-only) using Multer's in-memory storage to receive the file, then streamed the buffer to Cloudinary via `upload_stream`, returning the resulting `secure_url`.

**Error hit — same `process.env` pattern as `JWT_SECRET` back in Stage 9:** Cloudinary's `config()` call rejected `process.env.CLOUDINARY_*` values directly, since they're typed `string | undefined` under the project's strict tsconfig settings. Fixed with the same explicit-check pattern, this time throwing immediately at server startup if any credential is missing — a clearer failure than discovering it later when someone actually tries to upload an image.

**Frontend:** `ProductFormModal` now shows a file picker with a live thumbnail preview; on save, the image uploads to Cloudinary first (with its own "Uploading image…" loading state, distinct from "Saving…"), and the returned URL is what actually gets sent to the product create/update request. Editing a product without picking a new file correctly falls back to keeping its existing image URL.

---

## Stage 14: Delivery Tracking (Tier 1)

Before building, the feature was deliberately scoped into two tiers: **Tier 1** (static assigned location, real map, no simulated movement) and **Tier 2** (Inngest-driven simulated courier movement along a route, estimated at 370-580 lines and 2-4 working sessions). Tier 1 was built first regardless of which tier would ultimately be used, since it forms the same foundation either way.

### Backend

- **LGA coordinate lookup** (`server/src/data/lgaCoordinates.ts`) — approximate centroid coordinates for every LGA across all four supported states (Osun, Ogun, Lagos, Oyo), plus a `STATE_WAREHOUSE` lookup used as the dispatch origin point.
- **DeliveryPartner CRUD** — create, list, delete, with a proper `409 Conflict` (not a generic `500`) on duplicate email, using Prisma's `P2002` error code to distinguish "this specific thing already exists" from a genuine server error. The same fix was applied retroactively to `createProduct`.
- **`assignDeliveryPartner` endpoint** — sets `deliveryPartnerId`, generates a delivery OTP (initially 4 digits, later changed to 6 on request), sets `liveLocation` to the order's state's warehouse coordinate, and updates status.
- **A real design correction mid-build:** the endpoint originally jumped straight to `"Out for Delivery"` on assignment, but this collapsed two conceptually separate admin actions (assigning a partner vs. dispatching them) into one. Corrected to set status to `"Assigned"` instead, leaving "Out for Delivery" as a distinct, later admin action — matching the actual 5-action list (confirm, assign, out for delivery, delivered, cancel) the feature was scoped around from the start.

### Frontend tracking page

Built `OrderTracking.tsx` with a live-ish polling fetch (every 5 seconds) and a Leaflet map.

**The map tile provider took several attempts to get right:**
1. **OpenStreetMap's own tile servers** timed out (`ERR_CONNECTION_TIMED_OUT`) — a genuine network-level issue, confirmed by the fact that markers/lines rendered perfectly (Leaflet itself was fine) while only the tile *images* failed to load.
2. **CARTO's free tiles** loaded, but every tile was watermarked "API KEY REQUIRED" — their free anonymous tier now requires registration.
3. **Esri's World Street Map tiles** finally worked cleanly, with real street-level detail and no key required. Note Esri's tile URL uses a `{z}/{y}/{x}` ordering, not the more common `{z}/{x}/{y}` — easy to miss if copying a URL pattern from another provider.

**Two markers, not one:** initially only a single "current position" marker was shown, but since Tier 1 sets `liveLocation` to the *warehouse* coordinate (no real movement yet), a second marker showing the actual delivery *destination* (looked up via the same LGA coordinate table, duplicated in the frontend since `client` and `server` are separate projects) plus a dashed connecting line gives a much clearer "here it is, here's where it's going" picture without needing real simulated movement.

**A resilient-polling bug, twice:** the first fix (only show "Order not found" on the very first load, silently keep old data on later poll failures) didn't cover the case where the *first* several polls all fail before one succeeds — which happened for real during a Neon cold-start. Fixed by allowing a few retries (via a `useRef` counter, not `useState`, to avoid restarting the whole polling effect on every attempt) before giving up and showing "not found."

**✅ Checkpoint 11:** Tier 1 delivery tracking confirmed working end-to-end — real map, dual markers, OTP, live status, resilient polling.

---

## Stage 15: Admin Panel

Reviewed several uploaded reference projects specifically for admin dashboard design before building:
- A **grocery delivery tutorial app** — the only reference with genuinely complete, usable admin UI (Orders table, Delivery Partners management, a status timeline component, and product create/edit modals).
- Two separate **"fullstack ecommerce AI" reference zips** — turned out to be backend-only (no frontend at all) and a customer-storefront-only frontend (no admin section whatsoever), despite their names suggesting otherwise. Neither contributed anything usable for admin design.
- A **dedicated "ecommerce dashboard template"** — looked promising by name, but almost every component (`Dashboard`, `Orders`, `Header`, `Stats`, `SideBar`, `Users`, `Products`) was an empty stub (`return <></>;`), clearly an unfinished starter kit. Only its three product modals (`CreateProductModal`, `UpdateProductModal`, `ViewProductModal`) had real, complete code — genuinely useful as a *pattern* (modal-based product editing, file-input-with-live-preview for images) even though the app around it was unbuilt.

**Decision:** the grocery reference became the sole design source for the admin panel — rounded cards, `lucide-react` icons, indigo accents — deliberately different from the storefront's square black-and-white brand, since an admin dashboard serving a different audience is a legitimate case for its own visual system.

### Built

- **`AdminRoute`** — a route guard redirecting non-logged-in users to `/login` and non-admins to `/`, wrapping all admin routes.
- **`AdminOrders.tsx`** — orders table with a status dropdown (Placed/Confirmed/Assigned/Out for Delivery/Delivered/Cancelled) and an assign-delivery-partner modal, both wired to the real backend endpoints from Stage 14.
- **`AdminProducts.tsx`** — products table with create/edit/view modals, adapted from the dashboard template's modal pattern but with Redux stripped out (replaced with plain `apiRequest`/`useAuth`, consistent with the rest of the app).
- **Delivery progress timeline redesign** — rebuilt from the earlier square/numbered version into rounded icon circles (`lucide-react` icons per status) with a genuine current-step pulse animation, done with Tailwind's `animate-ping` layered behind the solid icon circle rather than animating the ring itself.

### Real image upload (Cloudinary)

The initial product form used a plain text field for the image URL — unrealistic for an actual small-scale seller, who has product photos on a phone, not a hosted URL. Since **product upload by the business owner was set as the platform's top priority feature**, this was corrected properly rather than left as a placeholder:

- Backend: `cloudinary` + `multer` (memory storage, 5MB limit), an admin-only `POST /api/upload` route that streams the uploaded file buffer to Cloudinary and returns the resulting `secure_url`.
- Same `process.env` strict-typing issue as `JWT_SECRET` came up again for the Cloudinary credentials — same fix (explicit presence check, throwing a clear startup error if any credential is missing, rather than a confusing type error or silent runtime failure).
- Frontend: the plain URL input was replaced with a real file picker plus an instant local preview (via `URL.createObjectURL`, a pattern borrowed from the unfinished dashboard template's one genuinely complete component), uploading on form submit and only falling back to the existing URL when editing a product without changing its image.

**✅ Checkpoint 12:** Admin panel functional end-to-end — order status/assignment management, full product CRUD with real image upload.

---

## Stage 16: Admin Panel Navigation, Account Menu, Delivery Partners

A few smaller but genuinely important fixes and additions rounded out the admin panel's usability.

### Category list update

Added "Grocery" and removed "Computing"/"Gaming" from the product category list, to better match the small-scale business focus (soft drinks, bread, yam, etc.) the project had just reoriented around in Chapter One. This list exists in two places that must be kept in sync manually — `ProductFormModal.tsx` (the admin create/edit form) and `Layout.tsx`'s `NAV_CATEGORIES` (the storefront's filter bar) — a small but real maintenance cost of not having a single shared source for this list.

### A real bug: homepage product cards never showed real images

Testing surfaced that uploaded product photos (working correctly in the admin table since Stage 15) never appeared on the customer-facing homepage — cards always showed the wireframe's gray placeholder box regardless of whether a product had a real image. Cause: `ProductCard` in `Home.tsx` was ported from the wireframe back in Stage 10 and connected to real *data* (name, price, category) at the time, but never updated to render a real `<img>` — the placeholder `<Wire label="PRODUCT IMAGE" />` was left in place the whole time. Fixed by adding an `image` prop and conditionally rendering a real image when one exists, falling back to the wireframe placeholder otherwise (useful for the still-dummy Flash Deals/New Arrivals sections).

### AdminLayout — a real sidebar, not standalone pages

Until this stage, `/admin/orders` and `/admin/products` were unconnected standalone pages with no shared navigation — reaching either required typing the URL manually. Built `AdminLayout.tsx` (sidebar with Dashboard/Products/Orders/Delivery Partners links, active-state highlighting via React Router's `NavLink`, an "Exit to Store" link) wrapping all admin routes via a nested `<Route element={<AdminLayout />}>`, matching the same nested-layout pattern established for the storefront back in Stage 12.

### A working Account menu, finally

The header's "Account → Sign In ▾" control had been purely decorative text since Stage 8 — clicking it did nothing. Built a real dropdown: shows the logged-in user's name and email, an "Admin Dashboard" link (shown only when `user.role === 'admin'`), and a working Sign Out button that calls the existing `logout()` from `AuthContext` and redirects home. This was also the fix for "how do I get to the admin panel without typing the URL" — it's now one click from the header, on both desktop and the mobile menu.

### Admin Delivery Partners page

Built `AdminDeliveryPartners.tsx` — a card grid (not a table, unlike Orders/Products, since a handful of delivery partners reads better as cards than rows) showing each partner's name, vehicle type, phone, email, and an active/inactive badge, with an add-partner modal and delete action, wired to the CRUD endpoints built back in Stage 14.

**✅ Checkpoint 13:** Full admin panel core complete — Orders (status + assign), Products (full CRUD + real image upload), Delivery Partners (create/delete), all reachable through a proper sidebar and account menu rather than manually-typed URLs.

---

## Stage 17: Admin Dashboard Overview

The last piece of the admin panel's original scope — a stats overview page — was built last on purpose, since its whole value depends on having real data already flowing through the system (by this point: real products, real orders across several statuses, a real delivery partner).

Rather than building a separate backend "stats" endpoint, the dashboard computes everything client-side from the three endpoints that already exist (`GET /api/products`, `GET /api/orders`, `GET /api/delivery-partners`) — total counts, out-of-stock count (`stock === 0`), and total revenue summed only across `isPaid` orders (since an unpaid Pay-on-Delivery order shouldn't count as realized revenue). A "Recent Orders" list shows the five most recently created orders with their status badge, linking through to the full Orders page.

This closes out the admin panel exactly as scoped back in Stage 15's planning: Dashboard, Orders, Products, Delivery Partners, reachable through a proper sidebar (Stage 16) and the account menu, no manual URL typing required anywhere.

**✅ Checkpoint 14:** Admin panel fully complete.

---

## Stage 18: Real-Time Customer Support Chat + A Routing Bug Cluster

### Stream Chat

Built the real-time support chat feature planned from the very beginning — one ongoing support channel per customer with the (single) admin, using Stream's Chat product (not their video product, which was explicitly out of scope).

**Backend:** `server/src/lib/stream.ts` (Stream server client, a `streamUserId()` helper prefixing IDs with `naijamart_` to keep them distinct from any other Stream app data, and a `streamDisplayName()` helper labeling the admin as "Support · <name>"), plus two endpoints: `GET /api/chat/token` (any logged-in user gets a Stream token, upserting their Stream identity along the way) and `GET /api/chat/support-agent` (looks up whichever user has `role: "admin"`, upserts *their* Stream identity too, and returns it — this matters because a customer can only add someone as a channel member if that person's Stream identity already exists, so the admin's identity needs to be creatable on demand, not just when the admin personally opens the chat).

**Frontend:** a `ChatContext` (same 3-file split pattern as Auth/Cart) that connects to Stream once a user is logged in, a floating `ChatWidget` (bottom-right, hidden entirely for admin accounts, who use a dedicated inbox instead) that creates/joins a deterministic `support-{userId}` channel, and an `AdminSupportInbox` page listing every conversation the admin is a member of, with a full Stream chat window for whichever one is selected.

**A real component-rename hunt:** `MessageInput`, referenced in Stream's own documentation and countless tutorials, didn't exist in the installed `stream-chat-react@14.12.0`. Rather than trust an unverified claim ("upgrade to 15.x for `MessageInputSmall`/`MessageInputFlat`"), the actual installed package's type declarations were traced by hand: the root `index.d.ts` turned out to be a pure re-export barrel (`export * from './components'`), which led into `components/index.d.ts` (another barrel), which led into a genuine `MessageComposer` folder — confirming the component had simply been renamed in this version, with no upgrade or internal-path import needed at all. **General lesson: when a package's root export doesn't have something you expect, check whether the root file is just a re-export barrel before concluding the thing doesn't exist** — the real declaration is often a few `export * from` hops deeper, and grep tools that only search one file (or search with too-specific a pattern) can produce a string of misleading "not found" results that look like the component is missing when it's actually just organized under a different name in a different folder.

### A cluster of duplicate-rendering bugs, all from the same underlying cause: two things trying to render the same route

Testing after the chat build surfaced three separate duplication bugs, all sharing one root explanation — **something was being mounted twice**, just via three different mechanisms:

1. **Admin pages showed the storefront header *and* the admin sidebar stacked.** Cause: in `App.tsx`, the `AdminRoute`/`AdminLayout` route block had been nested *inside* the storefront's `<Route element={<Layout />}>` block instead of being a sibling to it — so any `/admin/*` page rendered both layouts at once. Fixed by moving the entire admin route block out to sit alongside (not inside) the `Layout` block.
2. **Checkout, Order Confirmation, and Order Tracking were missing the storefront header entirely.** A smaller, opposite-direction version of the same class of mistake: these three routes had been left as bare top-level routes (siblings of `/login`) since the stages that built them, rather than nested inside `Layout` the way Cart and Product Detail were. Fixed by moving them inside `Layout`'s children.
3. **Cart, Product Detail, and Checkout each rendered their entire content twice**, stacked vertically. Cause, found by inspecting `Layout.tsx` directly: `<Outlet />` had accidentally been written twice in the file — since `<Outlet />` is where React Router injects whichever child route matched, having it appear twice means the matched page's whole component tree mounts twice. Fixed by deleting the duplicate.

**Two smaller, related fixes done in the same pass:** `PageShell` (from `wireframe-primitives.tsx`, used by Product Detail/Checkout/Tracking) was still rendering its own leftover fake logo/header bar — a holdover from when these were standalone wireframe screens with no real navigation — which visually looked like *another* duplication once the real `Layout` header existed above it. Simplified `PageShell` down to just a breadcrumb label and page title, removing the fake header entirely. Also added real product images (previously unconditional gray placeholder boxes, the same class of gap fixed on the homepage back in Stage 16) to `ProductDetail.tsx` and `Cart.tsx`.

**✅ Checkpoint 15:** Real-time chat working end-to-end (customer widget ↔ admin inbox), and a meaningful cluster of layout/routing bugs resolved.

---

## Stage 19: Going Live, Payment Integration, and a Major Scope Pivot

### Deploying to Vercel — the missing backend

Testing the freshly-deployed frontend (`naija-mart-five.vercel.app`) revealed that `/api/products` returned a `404` — the root cause was that Vercel's Root Directory setting had only ever been pointed at `client`, so the Express backend had never been deployed anywhere at all. Since Vercel doesn't run a traditional `app.listen()` server, deploying the backend meant restructuring it as a serverless function: an `api/index.ts` exporting the Express app (rather than calling `.listen()`, which now only runs when `NODE_ENV !== 'production'`), a `vercel.json` rewriting every request to that one function, and a `postinstall: "prisma generate"` script (without it, Vercel's dependency caching serves a stale Prisma Client — a documented, common gotcha).

The backend was deployed as a **second, separate Vercel project** from the same GitHub repo, with Root Directory set to `server`. Every backend secret (`DATABASE_URL`, `JWT_SECRET`, Cloudinary's three keys, Stream's two keys, `PAYSTACK_SECRET_KEY`) had to be re-added to *this* project's environment variables — they don't carry over from the frontend project, since Vercel scopes env vars per project, not per repo. The frontend's hardcoded `http://localhost:5000/api` was replaced with `import.meta.env.VITE_API_URL`, and CORS was tightened from wide-open to an explicit list of real origins.

**A worthwhile correction along the way:** an AI-generated suggestion claimed preview deployment URLs are "private unless shared" — checked against Vercel's actual current docs and found this overstated: they're unlisted (not search-indexed) but publicly reachable by anyone with the link, unless Vercel's free Authentication feature is explicitly turned on.

### Paystack integration, started

Scoped narrowly to the "Card (Paystack)" payment method only — Bank Transfer and Pay on Delivery stay as before. Corrected a latent bug this exposed: `isPaid` had been set to `true` immediately at order creation for any non-COD method, which was a fine placeholder before but is wrong once a real gateway exists — Card orders now correctly start unpaid until a `verifyPayment` endpoint confirms the transaction against Paystack's API and checks the paid amount matches the order total.

### A major scope pivot: single-vendor to marketplace

After reviewing a Jiji-style classifieds wireframe for card-layout ideas, a much bigger question surfaced: should customers be able to list their own products for sale, pending admin approval? This was initially proposed in a form that **was** a full multi-vendor marketplace in every meaningful sense (open listing submission, admin moderation, a paid listing fee) — worth pausing on, since it directly contradicted the single-vendor framing Chapter One had just been rewritten around, twice.

After weighing the tradeoffs explicitly (vendor onboarding, split checkout/delivery logic, a second payment flow, a third Chapter One rewrite), the decision was confirmed: **yes, pivot to a real marketplace** — but critically, **the admin stays the sole fulfillment operator**. Sellers either drop goods at the admin's warehouse or the admin sends a delivery partner to collect from the seller first — meaning the *existing* centralized Tier 1 delivery/tracking system (one fleet, one warehouse per state) stays fully intact; only the *sourcing* side of inventory changes, not the *fulfillment* side. This one clarification kept an otherwise very large pivot from requiring the delivery system to be rebuilt too.

**Category list revised** against the same shippability test used for the delivery-tracking discussion earlier: Jiji's own categories (Vehicles, Property, Business & Industry, live Animals, farm equipment) don't fit a cart-and-checkout model regardless of vendor count — nobody adds a house to a cart. Trimmed to seven categories with real subcategories, all genuinely stockable, shippable retail goods (Phones & Tablets, Electronics, Home/Furniture & Appliances, Fashion, Baby & Kids, Beauty & Personal Care, Food & Beverages).

### Migrating the schema for marketplace fields

Added to `Product`: `sellerId` (required, relation to `User` — every product has an owner, including the admin's own stock, which auto-approves), `status` (pending/approved/rejected), `negotiable`, `images` (a `String[]` gallery, keeping the original `image` field as the cover photo so nothing already built needed to change), `fulfillmentMethod` (dropoff/pickup) with seller location fields for pickup jobs, delivery-days/fee fields, and `listingFeePaid`/`listingFeeAmount` for the flat one-time posting fee.

**A genuinely tricky migration failure, worth detailing:** since `sellerId` is a required field, Prisma correctly refused to migrate while old test rows with no seller still existed. The fix (delete the old rows first) went wrong in an instructive way: a `migrate dev` attempt failed on a Neon cold-start (`P1001`), then the follow-up `prisma generate` failed separately with a Windows file-lock error (`EPERM`) — because Prisma Studio was still running and had the query engine file open. The combination left the **generated Prisma Client** expecting the new schema (`images`, `sellerId`, etc.) while the **actual database** still had the old columns — a state where Prisma Studio itself couldn't even load the `Product` table anymore, since opening it now required querying a column (`images`) that didn't exist yet. Studio couldn't fix Studio's own problem. Resolved by deleting the stale rows with **raw SQL directly through Neon's own SQL editor**, bypassing Prisma's tooling entirely, then re-running the migration cleanly against a genuinely empty table.

**General lesson from this whole stretch:** when a tool that depends on your schema (Prisma Studio) breaks *because* your schema and database are out of sync, don't keep trying to use that same tool to fix the mismatch — drop to a lower-level tool (raw SQL) that doesn't share the same dependency.

**✅ Checkpoint 16:** Live in production (frontend + backend both deployed and connected), Paystack verification endpoint in place, and the foundational schema for a real marketplace pivot migrated successfully.

---

## Stage 20: Seller Wallet, Manual Payouts, and a Security Pattern Worth Rejecting

With the marketplace schema in place, the next layer was giving sellers a simulated earnings balance and a way to withdraw it — plus letting the admin manually credit a seller once one of their listings actually sells.

### A design correction before any code: the "bank account password" idea

The original spec called for sellers to create a **separate password specifically for their linked bank account**, used later to authorize withdrawals. This was flagged and changed before building it, even though the money involved is entirely simulated: asking someone to "create a password for your bank account" is structurally identical to a common phishing pattern — no legitimate bank or payment processor ever asks for a password tied to an account number, because a bank account isn't authenticated by a password *you* invent. Building this pattern into a real, working app — even a demo one — normalizes a habit worth avoiding entirely.

**What replaced it:** withdrawal re-uses the seller's **existing login password** as a confirmation step (checked with `bcrypt.compare` against the same hash used for login) — a completely standard "step-up authentication" pattern real apps use for sensitive actions, with no second password concept needed at all.

### The listing-fee chicken-and-egg problem

A related design gap surfaced during planning: if the marketplace's listing fee is meant to be deducted from a seller's dummy balance, what happens to a brand-new seller posting their *first* listing, before they've ever earned anything? Their balance is `0` — there's nothing to deduct the fee from. Resolved by keeping the **listing fee as a real Paystack charge** (reusing the same verification pattern as checkout payments), while only *seller earnings and withdrawals* stay part of the simulated dummy-money system. This is also a more coherent story for a real deployment: real money in for listing fees, simulated payouts for a demo.

### Backend built

- **`User` schema additions:** `accountBalance`, `linkedBankAccountNumber`, `linkedBankName`, `isTrustedVendor`, `trustedVendorRequestStatus`.
- **Wallet endpoints:** `GET /api/users/me` (account details), `PATCH /api/users/bank-account` (link, once), `POST /api/users/withdraw` (re-auth via login password, requires a linked account, pays out the full balance in one go).
- **Manual per-item payout** (`PATCH /api/orders/:orderId/items/:productId/payout`, admin-only): computes `price × qty × (1 − 10% platform fee)`, credits the seller's balance, and sends an automated Stream chat message to their support channel — reusing the exact same chat infrastructure built in Stage 18, giving it a second genuine purpose beyond customer support.

**A real structural gap this exposed:** `Order.items` is stored as a flexible JSON blob, and once multiple different sellers' products can land in one buyer's single order, "credit the seller" isn't well-defined without each line item carrying its own `sellerId` at the time of purchase — not looked up afterward, in case a product's ownership or existence changes later. This meant threading `sellerId` all the way through: `Product.sellerId` → `CartItem.sellerId` (added to the cart's type and the `addToCart` calls) → each `Order.items` entry, plus a `payoutStatus` flag per item to prevent double-crediting the same sale twice.

**A related access-control gap, also fixed:** `getProductById` was fully public with no way to distinguish "a random visitor" from "the seller checking on their own pending listing." Added an `optionalAuth` middleware — reads a JWT if one is present, but never blocks the request if it's missing or invalid — letting the endpoint allow a seller or admin to view a non-approved listing by ID while the public still correctly gets a `404`.

**✅ Checkpoint 17:** Full payout loop confirmed working end-to-end via Postman — listing creation → admin approval → purchase by a different customer → manual payout → seller balance credited → chat notification received → a second payout attempt correctly blocked with `409`.

**Still queued (deferred to a frontend pass):** the actual two-page listing submission form, the "Sell on Naija Mart" link (still decorative), frontend enforcement of "can't buy your own listing," the Trusted Vendor apply/approve flow, a new Admin Users page (doesn't exist yet — a real gap surfaced by the "message trusted vendors" workflow), the new category/subcategory list wired into the actual UI, and the listing-fee Paystack charge itself.

---

## Stage 21: Checkout Hardening, Chat Notifications, and the Trusted Vendor Flow

### A stale-cart bug the payout testing exposed

Testing Phase C's payout flow turned up a real bug: an order's `items` array had `sellerId` on some entries but not others. Tracing it back, the missing-`sellerId` items were cart entries that had been sitting in `localStorage` since *before* the marketplace migration — added back when `addToCart` didn't yet carry `sellerId` at all, and never invalidated since checkout had never re-validated cart contents against the live database.

**Fixed by hardening Checkout** to re-fetch every cart item fresh from the backend immediately before order creation — price, `sellerId`, and existence all pulled live, not from whatever's cached. Any item that 404s (deleted, or no longer approved) gets removed from the cart with a toast explaining why, and checkout aborts so the customer can review and resubmit, rather than silently placing an order built on stale or incomplete data.

### A real debugging detour: two different failing endpoints, chased as one

A `500` on adding a product turned out to actually be **two separate issues on two different requests** (`/api/upload` and `/api/products`), initially conflated because both failed around the same user action. Untangling it required insisting on exact Network-tab evidence (which specific request, its real headers/payload) rather than continuing to reason from screenshots and pasted explanations — a useful reminder that when a bug report bounces between two plausible-sounding causes, the fastest path is isolating *which single request* is actually failing before touching any code.

### Chat notification badge

The floating `ChatWidget`, until now, only connected to Stream and watched the customer's channel **lazily**, the moment they clicked it open — meaning there was no way to know a new message (like a payout notification) had arrived while it was closed. Moved the channel-watching into `ChatContext` itself, running as soon as a customer logs in, with a `message.new` listener incrementing an `unreadCount` whenever a message arrives from someone other than themselves. The widget's floating button now shows a red count badge, clearing when opened via `channel.markRead()`.

### Trusted Vendor request/approval flow

Replaced the earlier "just handle it via chat, informally" idea (flagged back in Stage 19 as not being a real, trackable feature) with a proper request/decision pattern, matching the listing-approval pattern already established: `POST /api/users/trusted-vendor-request` (customer applies), `GET /api/users` with `pendingOnly`/`trustedOnly` query filters (admin reviews), `PATCH /api/users/:id/trusted-vendor-request` (admin approves or rejects). Built a new `AdminUsers.tsx` page — a filterable card grid, added to the admin sidebar — giving the admin the users-list visibility that didn't exist anywhere before this stage.

**A repeated `setState`-in-effect fix, done properly this time:** rather than reaching for the same "infer loading from data" workaround used in earlier stages, this was resolved with `useCallback` — wrapping the fetch function so it only gets recreated when its actual dependency (`token`) changes, letting it be listed honestly in the effect's dependency array instead of needing an `eslint-disable` escape hatch. Worth remembering as the more correct general-purpose fix for this whole recurring class of warning.

**✅ Checkpoint 18:** Checkout now resilient to stale/deleted cart data, chat usefully surfaces new messages without needing the widget open, and the Trusted Vendor flow is fully trackable end-to-end rather than living only in chat logs.

---

## Stage 21: Trusted Vendor Flow, Chat Badges, and Checkout Hardening

### Trusted Vendor: a real request/approval flow, not just a chat conversation

Built as planned back in Stage 19's pushback: `POST /api/users/trusted-vendor-request` lets a customer formally apply, `GET /api/users` (admin-only, filterable by `pendingOnly`/`trustedOnly`) lists customers for review, and `PATCH /api/users/:id/trusted-vendor-request` approves or rejects. A new `AdminUsers.tsx` page (rounded card grid, filter tabs, inline approve/reject buttons) was added to the admin sidebar — this also happened to be the first real **admin-facing customer list** in the whole project, a gap that had gone unnoticed until the "message trusted vendors" workflow specifically required it.

### Chat notification badge

The customer-facing `ChatWidget` only ever watched its Stream channel when actually opened — meaning there was no way to detect a new message (like an admin's payout notification) while it was closed. Fixed by moving channel-watching out of the widget and into `ChatContext` itself, connecting and subscribing to `message.new` events as soon as a customer logs in, tracking an `unreadCount` that displays as a red badge on the floating button and clears when opened.

### Checkout hardening — closing a real data-integrity gap

Testing the seller-payout flow surfaced a genuine bug: some cart items were missing `sellerId` entirely, causing the payout endpoint to correctly reject them — but investigating *why* revealed the real issue was upstream. Cart contents persist in `localStorage` indefinitely and are never re-validated against the live database; a couple of test products had been sitting in a cart since **before** the marketplace migration even ran (when `sellerId` didn't exist as a concept yet), and checkout blindly trusted that stale cached data all the way through to order creation.

**Fixed** by having `Checkout.tsx` re-fetch every cart item fresh from `GET /api/products/:id` immediately before placing the order — using the live price and `sellerId`, not whatever's cached — and automatically removing (with a toast) any item that's been deleted or is no longer approved, rather than letting a broken purchase go through silently.

### A confusing, ultimately resolved debugging session

Chasing a `500` on product creation took an unusually winding path, worth documenting honestly rather than smoothing over: the browser's Network tab was checked for the wrong request more than once (an `/api/upload` request was inspected when the actual failure was on `POST /api/products`, and vice versa), a stray unused `multerMiddleware.ts` file was created under the mistaken belief multer wasn't already configured (it was, in `uploadRoutes.ts`, since Stage 15), and a backend terminal's log was initially read from stale scrollback rather than a fresh, isolated repro. The eventual, pragmatic resolution: **Postman was used to send a minimal, known-correct request directly to the backend**, bypassing the frontend entirely — this is often the fastest way to split "is this a frontend problem or a backend problem" when a chain of dependent requests (upload → create) makes browser DevTools output easy to misread. The root cause (reported after the fact) traced to `updateProduct` accepting unvalidated fields from the request body, which Prisma rejected.

**General lesson reinforced here:** when a bug involves *two* chained network requests (upload, then create), always confirm *which specific request* is failing before reading its details — a Content-Type or payload from the wrong request in the list produces confusing, contradictory clues that look like a mystery but are really just a mismatched investigation target.

**✅ Checkpoint 18:** Trusted Vendor flow complete end-to-end, a real Admin Users page exists, chat notifications work while the widget is closed, and checkout no longer trusts stale cart data.

---

## Stage 21: Trusted Vendors, an Admin Users Page, Chat Notifications, and Hardening Checkout

### Trusted Vendor request/approval

Built a proper tracked request instead of the originally-proposed "decide informally over chat" approach: `POST /api/users/trusted-vendor-request` (a customer applies), `GET /api/users` with `pendingOnly`/`trustedOnly` filters (admin-only), and `PATCH /api/users/:id/trusted-vendor-request` to approve or reject. This surfaced a real, previously-missing piece: there was no admin page listing customers/users at all. Built `AdminUsers.tsx` — a filterable rounded-card grid matching the established admin visual language, with inline approve/reject buttons on pending requests — and added it to the sidebar.

### The chat widget's notification badge

Adding an unread-count badge required moving channel-watching out of the widget's on-click lazy-load and into `ChatContext` itself, so a channel is watched proactively the moment a customer logs in — not only once they've opened the widget. A `message.new` event listener increments an `unreadCount` whenever a message arrives from someone other than the customer themselves (i.e., the admin), displayed as a small red badge on the floating button, cleared via `channel.markRead()` when the widget opens.

### Checkout hardening against stale cart data

Testing the seller-payout flow surfaced a genuine data-integrity gap: two products still sitting in a browser's `localStorage` cart from *before* the marketplace migration had no `sellerId` at all, since they were added before that field existed — and nothing at checkout ever re-validated cart contents against the live database. `Checkout.tsx`'s submit handler now re-fetches every cart item fresh from `GET /api/products/:id` immediately before building the order: if an item 404s (deleted or no longer approved), it's automatically removed from the cart with a toast, and the order is built entirely from the freshly-fetched data (price, `sellerId`) rather than whatever the cart happened to be holding. This also incidentally fixes a second latent issue — a price change between add-to-cart and checkout is now always reflected, since the subtotal is recalculated from live prices rather than a cached total.

### Two more setState-in-effect fixes, and the case for `useCallback`

Both `AdminUsers.tsx` and a couple of earlier files hit the same lint warning (calling `setState` synchronously inside an effect body). The pattern used earlier — inferring a loading state from data being `null` versus populated, rather than tracking a separate boolean — was applied again here. But this file also introduced a cleaner general-purpose fix worth remembering: wrapping the fetch function itself in **`useCallback`** (keyed to its real dependency, e.g. `token`) turns it into a stable reference that can be honestly listed in the effect's dependency array — satisfying the lint rule properly, rather than reaching for an `eslint-disable` comment. `useCallback` is the more idiomatic tool whenever a function used inside an effect needs to be in that effect's dependency list without causing unnecessary re-runs on every render.

**✅ Checkpoint 18:** Trusted Vendor flow and Admin Users page complete; chat notifications working; checkout now resilient to stale/invalid cart data.

---

## Stage 21: Trusted Vendors, Chat Notifications, and Checkout Hardening

### Trusted Vendor flow + Admin Users page (Phase D)

Built the formal request/approval mechanism flagged as missing back in Stage 20 — rather than a status change happening invisibly inside a chat conversation, a customer now submits a real, trackable request (`POST /api/users/trusted-vendor-request`), which an admin reviews through a proper `AdminUsers.tsx` page (filterable: All Customers / Pending Requests / Trusted Vendors), approving or rejecting via `PATCH /api/users/:id/trusted-vendor-request`. This also closed the "admin needs to see which users are trusted vendors to message them" gap identified earlier — there was previously no admin page listing users at all.

**The same `setState`-in-effect warning surfaced again here**, and this time it was fixed properly rather than worked around: instead of tracking a separate `loading` boolean set directly in the effect body, the fetch function was wrapped in `useCallback` (stable across renders unless its own dependency, `token`, changes) and listed honestly in the effect's dependency array. This is the more correct fix than the earlier "infer loading from data being null" pattern used in `ProductDetail.tsx` and `AdminDashboard.tsx` — both are valid depending on the situation, but `useCallback` is the more general, reusable technique whenever a fetch function itself needs to be called from more than one place (here: on filter change *and* after an approve/reject action).

### Chat unread notification badge

The customer-facing `ChatWidget` only ever created/watched its Stream channel lazily, on click — meaning there was no way to detect a new message (like an admin's payout notification) while the widget stayed closed. Fixed by moving channel-watching into `ChatContext` itself, connecting proactively as soon as a customer logs in rather than waiting for a click, and subscribing to Stream's `message.new` event to increment a badge count for any message not sent by the user themselves. The badge clears when the widget is opened (calling Stream's `channel.markRead()`).

### Checkout hardening — closing the stale-cart-data gap

Investigating an earlier payout math question (Stage 20) surfaced a real, separate bug: cart items added to `localStorage` *before* the marketplace migration were missing `sellerId` entirely, and nothing at checkout ever caught this — the order was created straight from whatever the cart happened to contain, no matter how old or stale.

**Fixed properly, not patched around the specific missing field:** `Checkout.tsx` now re-fetches every cart item fresh from `GET /api/products/:id` immediately before order creation. Any item that 404s (deleted, or no longer approved) is automatically removed from the cart with an explanatory toast, and the order is built entirely from this fresh data — current price, current `sellerId` — rather than trusting anything cached. This closes off an entire category of future bugs (stale prices, deleted products, missing fields added by a later migration), not just the one that happened to surface this time.

**✅ Checkpoint 18:** Trusted Vendor flow complete end-to-end (request → admin review → approved/rejected), Admin Users page live in the sidebar, chat notifications working while the widget is closed, and checkout now self-healing against stale cart data.

---

## Key Lessons So Far (for beginners following along)

1. **Windows PowerShell isn't bash** — commands like `mkdir a b` or `dir /s /b` that work in tutorials written for Mac/Linux often need PowerShell-specific equivalents.
2. **Pin your versions.** Tools like Prisma and TypeScript sometimes install release candidates or previews by default via `npx`/`npm create`. Always check `--version` after installing anything critical, and pin with `--save-exact` if it matters.
3. **CommonJS vs ESM tsconfig settings don't mix.** If you copy tsconfig settings from a frontend (Vite/React) project into a backend project, you'll likely hit conflicts — frontend templates default toward ESM-style settings that Node/Express backends usually don't use.
4. **Never trust a copied connection string blindly** — check it has the full `user:password@host/db` shape before assuming it's broken on Prisma's end.
5. **Commit at every real checkpoint**, not just at the end — it gives you clean rollback points and a natural progress log.
6. **Using a reference/tutorial project as a scaffold is different from copying it.** Read every model or file you bring in and ask what actually fits your own project's scope — drop what doesn't apply, add what's missing, and rename things to match your own conventions. This is slower than copy-pasting but is what actually builds understanding.
7. **React Context files need to export only components, or Fast Refresh breaks.** Split any context into three pieces: a plain file for `createContext` + types, a component file for the Provider, and a plain file for the consumer hook. The same rule applies to any file mixing components with helper functions (like formatters) — separate them.
8. **Undefined CSS variables fail silently, not loudly.** If a design uses a custom CSS variable (like `--vermilion`) defined in one project's stylesheet, copying components into a different project without also copying that variable definition won't throw an error — the element just renders with no color at all, which can look like an invisible or "missing" element rather than an obvious bug.
9. **Strict TypeScript settings (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) catch real edge cases, but demand explicit guards everywhere.** Anything from `req.params`, `req.query`, array indexing, or split results needs an `undefined`/array check before use. This adds boilerplate but prevents a real class of runtime bugs (accessing a property that silently doesn't exist).
10. **Knowing when to stop automating is a real skill.** A Postman script to auto-save tokens between requests would have been a nice convenience, but debugging why it wasn't showing up in the UI cost more time than manually pasting a token a dozen times would. For a project with a handful of protected routes, the manual approach was the objectively better use of time — automation is a means, not a goal in itself.
11. **A partial copy-paste of a multi-part code change produces confusing errors that look unrelated to the real cause.** When adding new state, effects, and types together, place every piece before troubleshooting — errors like "declared but never used" alongside "cannot find name" in the same file are often the same root issue (an incomplete paste), not several separate bugs.
12. **Test data can accidentally expose real edge cases** — like a product with no discount configured causing a divide-by-zero display bug. Treat these as useful early warnings, not just "bad test data to ignore."
13. **A clean terminal (no build errors) plus a blank or broken page in the browser means a runtime error, not a build error.** The browser's own DevTools Console — not the terminal running `npm run dev` — is where to look next. It's also worth confirming *which* terminal (frontend vs. backend) actually owns the error being chased, if more than one dev server is running.
14. **When extracting a large block of JSX into a new file during a refactor, move it as one complete, verified unit.** Reconstructing it from memory or partial instructions makes it easy to silently drop pieces (a search bar, a button, a whole section) or leave a comment block unclosed, producing errors that look unrelated to the actual cause.
15. **A managed free-tier database (like Neon) can suspend after inactivity, and the first request afterward may be slow or fail once before succeeding.** This is expected behavior, not a bug — worth remembering when demoing the project after any idle period.
16. **A blank page with no visible console error is still possible** — the browser Console isn't a guaranteed source of truth for every crash. When it shows nothing, check the actual DOM directly (Elements tab, look inside `#root`) to confirm whether anything rendered at all before assuming the page is fine.
17. **Free map tile providers vary in reliability and licensing terms over time** — a provider that works today may add a key requirement, or a region's network may block another entirely. Worth having a fallback in mind rather than assuming the first choice is permanent.
18. **A specific Prisma error code (like `P2002` for unique-constraint violations, or `P2025` for record-not-found) can and should be checked explicitly, to return a precise HTTP status instead of a generic 500.** A `500` should mean "we don't know what went wrong" — anything identifiable deserves its own status code.
19. **Not every uploaded reference file contains what its name suggests.** A file named for its purpose ("dashboard template", "fullstack ecommerce") can turn out to be backend-only, missing the relevant section entirely, or an unfinished stub with empty components — always verify a reference's actual content before planning to build from it.
20. **When a package's root export doesn't have something you expect, check whether the root file is just a re-export barrel (`export * from './x'`) before concluding the thing doesn't exist.** The real declaration may be several hops deeper in a differently-named file or folder — a component can be renamed between versions without disappearing.
21. **Content that renders twice, stacked, almost always means something is mounted twice — not that the component itself has a bug.** Check, in order: is the route matched by two separate `<Route>` definitions (nesting mistake), is `<Outlet />` written more than once in a shared layout, or is the app's root render call itself duplicated. The component rendering the duplicated content is usually innocent.
22. **A claim about a platform's current behavior (a hosting provider's privacy defaults, a package's export names) is worth verifying against the actual source before relying on it** — an unverified explanation "sounds right" far more often than it turns out to be fully accurate.
23. **When a tool that depends on a resource's current state (Prisma Studio depending on the database schema) breaks because that resource is in an inconsistent state, don't keep trying to use the same tool to fix it.** Drop to a lower-level tool with fewer assumptions (raw SQL, directly through the database provider's own console) that doesn't share the same dependency on the broken state.
24. **A major scope pivot deserves an explicit tradeoffs conversation before any code changes**, even when the person is confident going in — laying out concretely what breaks, what needs rebuilding, and what stays intact turns a vague "let's pivot" into a scoped, informed decision (in this case: marketplace listings, yes; rebuilding the whole delivery system, no, because fulfillment stayed centralized).
25. **A feature spec can encode a real-world anti-pattern without anyone intending it** — asking a user to "create a password for their bank account" mirrors a classic phishing tactic, even when the money behind it is entirely simulated. Worth pausing on and swapping for a legitimate equivalent (re-authenticating with an existing credential) rather than building it as specified just because the underlying data isn't real.
26. **There are two valid fixes for the "setState called synchronously in an effect" warning, and which one fits depends on whether the fetch function needs to be reused.** If a loading flag is only ever set by one effect, inferring "loading" from the data itself being `null` (no separate boolean) is simplest. If the same fetch logic needs to be triggered from elsewhere too (a button's `onClick`, not just the initial effect), wrapping it in `useCallback` and listing it honestly as a dependency is the more correct, reusable fix.
26. **When a function used inside a `useEffect` needs to be in that effect's dependency array, wrap it in `useCallback` rather than reaching for an `eslint-disable` comment.** A stable, correctly-memoized function reference lets the dependency array be honest and complete, instead of manually asserting "trust me, this doesn't need to be listed."
26. **When debugging two chained network requests (an upload, then a create), always confirm which specific request in the Network tab is actually failing before reading its headers or payload.** Inspecting the wrong request's details produces clues that look contradictory or mysterious, when the real explanation is just a mismatched investigation target. When a chain like this gets confusing, sending a single, minimal, known-correct request directly via Postman — bypassing the frontend and the chain entirely — is often the fastest way to split "frontend problem" from "backend problem."

---

*(To be continued as the project progresses — next up: expanding the Prisma schema for Products, Orders, Addresses, and Delivery Partners.)*
