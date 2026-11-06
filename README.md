# ELVXCHANGE frontend

React, TypeScript, Vite and Bootstrap. Application entry: `index.html` -> `src/main.tsx`.

From this folder:

```powershell
npm.cmd install
npm.cmd run dev
```

Run the backend in a second terminal from `../backend` with `npm.cmd run dev`.
Open http://127.0.0.1:5173. Vite proxies `/api` and `/socket.io` to http://127.0.0.1:3001.

```powershell
npm.cmd run build
npm.cmd test
```

The build is written to `dist/`; the backend serves it in production.
Keep credentials in `../backend/.env`. The frontend currently needs no environment variables.

See [folder structure](docs/STRUCTURE.md) and the [application workflow](../backend/docs/WORKFLOW.md).

## Frontend-only client preview

Run `npm.cmd run dev:demo` to explore the existing UI without starting the backend.
Use **Explore as** on the sign-in screen to enter as Admin, Buyer or any existing staff role. Sign out to choose another role. The selected role survives refresh in the current browser tab; signing out clears it.

The preview uses synthetic linked users, auctions, vehicles, results, payments and credit balances. It preserves navigation, filters, dialogs and client-side validation. Submissions show a preview-only message and never save changes or send files. Inventory preview displays prepared sample rows, regardless of the selected file; it does not parse the workbook. Document/template/report links open a clearly labelled placeholder, not a generated business document.

### Build and deploy

1. In `frontend/`, run `npm.cmd ci` if dependencies are not installed.
2. Run `npm.cmd run build:demo`.
3. Publish the resulting `dist/` directory to your static host. For a repository-connected host, set the root directory to `frontend`, build command to `npm run build:demo`, and publish directory to `dist`.
4. For a local check of that build, run `npm.cmd run preview`.

No API, database, Socket.IO service or secrets are needed. The default hosting location is the domain root. Existing hash URLs support refreshing and direct links without server routing rules. A direct link opened before choosing a demo role shows sign-in; selecting a role continues to that link. Signing out returns to the live-auction list for the next role.

`.env.demo` enables `VITE_DEMO_MODE=true` only for demo builds. `npm.cmd run build` retains normal API-backed behavior unless that flag is explicitly enabled in the environment. Do not set the demo flag for the real application.

### Suggested walkthrough

- Admin: Users and account status -> Schedule Auction / grouped scheduling -> upcoming event details -> live event and inventory controls -> closed results -> Sale / Operations -> Payment MIS -> RSD & Limits -> reports, bulk operations, insurers and notifications.
- Buyer: public auctions -> demo entry -> auction terms -> vehicle details / bid confirmation -> watchlist -> My Results -> My Wins & Payments -> personal information.
- Staff: sign out and select each role to review its existing permitted menus.

Prepared records illustrate different stages; form submissions do not move records between stages. No bids, uploads, notifications, payments or persistent business changes occur. Sample images are local illustrations. Browser/mobile walkthrough and hosted acceptance checks remain required before client handoff.
