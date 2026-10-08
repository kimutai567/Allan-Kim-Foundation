# Allan Kim Foundation

A React website and Express API for the Allan Kim Foundation. Visitors can learn about the foundation's programs, submit donation details after paying externally, send partnership requests, and contact the foundation. Administrators can review submissions and maintain program and payment information.

## Requirements

- Node.js 22.5 or later. The API uses Node's built-in `node:sqlite` module.
- npm

## Local setup

From the repository root, install the server and client dependencies:

```sh
npm run setup
```

The API requires three environment variables. Set them in the same terminal used to start the app. For example, in PowerShell:

```powershell
$env:JWT_SECRET = "replace-with-a-long-random-secret"
$env:ADMIN_EMAIL = "admin@example.org"
$env:ADMIN_PASSWORD = "replace-with-a-strong-password"
npm run dev
```

The root `dev` script starts both services:

- Website: http://localhost:5173
- API: http://localhost:4000

The Vite development server proxies `/api` requests to the API on port 4000.

On first API startup, the server creates the SQLite schema, seeds the initial admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`, and inserts three example programs if the corresponding tables are empty. Changing those environment variables later does not replace an already-created admin account; use **Admin → Account** to change its password.

The SQLite database defaults to `server/foundation.db`. To use a different file, set `DB_FILE` before starting the API. The database file is local application data and is excluded from Git.

### Reset a forgotten admin password

From the repository root, run:

```powershell
npm --prefix server run reset-admin-password
```

The command displays the admin email for the selected account and asks for a new password without echoing it. Enter it twice. It updates the password hash in the configured SQLite database; it does not reveal or change the admin email. If `DB_FILE` is set for the API, set it to the same value in this terminal before running the reset command.

## Main features

- Public pages: home, programs, donation instructions/form, partnership form, and contact form.
- Donation records are submitted as **pending** after the donor pays outside the site. An administrator must verify and confirm or reject each record; this app does not initiate or process payments.
- Admin dashboard at `/admin`: donation review, partnership status management, contact-message inbox, program editing, payment settings, and password change.
- Confirmed KES donations update the selected program's raised total. Public donation statistics count confirmed donations; the raised total includes all confirmed currencies, so it should not be interpreted as a KES-only figure when crypto donations are present.
- Data is stored in SQLite on the API host.

## Important before accepting donations

The API seeds the payment instructions configured in `server/index.js`; existing databases that still contain the original sample values are updated to the configured details on startup. An administrator should sign in to `/admin`, open **Payment Settings**, and verify every number, account name, bank detail, wallet address, and network before publishing the site or accepting donations. Check the Donate page afterward. Payment instructions can be changed in the admin dashboard without editing code.

## Useful commands

Run these from the repository root:

```sh
npm run dev
npm --prefix client run build
npm --prefix client run lint
```

The client can also be run on its own with `npm --prefix client run dev`; the API must still be started separately for data-backed features.

## Project layout

- `client/` — React 19, React Router, and Vite website.
- `server/index.js` — Express API, SQLite schema/seeding, public routes, and authenticated admin routes.
- `server/foundation.db` — default local database, created at runtime and not committed.
