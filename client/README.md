# Allan Kim Foundation website

This folder contains the React website. It shows foundation programs and donation instructions, and provides donation, partnership, and contact forms. The forms need the API in `server/` to be running.

## Run the website locally

Requirements: Node.js 22.5 or later and npm.

1. Open a terminal in the repository root (the folder containing `package.json`).
2. Install dependencies for both the website and API:

   ```sh
   npm run setup
   ```

3. Start the API in a terminal. In PowerShell, set its required environment variables and run it:

   ```powershell
   $env:JWT_SECRET = "replace-with-a-long-random-secret"
   $env:ADMIN_EMAIL = "admin@example.org"
   $env:ADMIN_PASSWORD = "replace-with-a-strong-password"
   npm --prefix server start
   ```

4. Open a second terminal in the repository root and start the website:

   ```sh
   npm --prefix client run dev
   ```

5. Open the local URL printed by Vite, usually http://localhost:5173.

The website sends `/api` requests to `http://localhost:4000` through the Vite development proxy. Keep the API terminal running while using forms, donation data, or the admin dashboard. To start both services together instead, set the three environment variables in PowerShell as above, then run `npm run dev` from the repository root.

## Build and lint

Run these commands from the repository root:

```sh
npm --prefix client run build
npm --prefix client run lint
```

The production build is written to `client/dist/`. These commands only build or check the website; they do not start the API.

## Payment details

The Donate page displays payment instructions returned by the API. Before using the site for real donations, an administrator must sign in at `/admin`, open **Payment Settings**, and verify that every number, account name, bank detail, wallet address, and network is correct. Donations are recorded for manual review; the website does not process payments.
