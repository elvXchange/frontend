# ELVXCHANGE frontend

React, TypeScript, Vite and Bootstrap. Application entry: `index.html` -> `src/main.tsx`.

From this folder:

```powershell
npm.cmd install
npm.cmd run dev
```

Run the backend in a second terminal from `../server` with `npm.cmd run dev`.
Open http://127.0.0.1:5173. Vite proxies `/api` and `/socket.io` to http://127.0.0.1:3001.

```powershell
npm.cmd run build
npm.cmd test
```

The build is written to `dist/`; the backend serves it in production.
Keep credentials in `../server/.env`. The frontend currently needs no environment variables.

See [folder structure](docs/STRUCTURE.md) and the [application workflow](../server/docs/WORKFLOW.md).
