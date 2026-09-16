# FieldTrack Pro

FieldTrack Pro is a React and Express application for field staff attendance, GPS tracking, visit verification, route playback, leave management, duty rosters, and payroll reporting.

## Requirements

- Node.js 20 or later
- npm
- A modern web browser

## Install dependencies

Open PowerShell in the project directory and run:

```powershell
npm install
```

## Run locally on port 3001

Port `3001` is used here so that an existing application on port `3000` can continue running.

### Development mode

Development mode enables Vite hot reload:

```powershell
$env:PORT = "3001"
npm run dev
```

Open <http://localhost:3001> in a browser. Press `Ctrl+C` in the terminal to stop the server.

### Production mode

Build the frontend and server first:

```powershell
npm run build
```

Then run the compiled application:

```powershell
$env:NODE_ENV = "production"
$env:PORT = "3001"
node dist/server.cjs
```

Open <http://localhost:3001> in a browser.

## First-time setup

On a new installation, opening the application displays the Setup Wizard. Use it to create the company and administrator account. Application data is stored in `data/database.json`.

Do not commit real passwords, API keys, or production database contents to source control.

## Validation commands

Run the TypeScript check:

```powershell
npm run lint
```

Create a production build:

```powershell
npm run build
```

Check the running server:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

A healthy server returns a response with `status` set to `ok`.

## Environment variables

| Variable | Purpose | Local value |
| --- | --- | --- |
| `PORT` | HTTP port used by Express | `3001` |
| `NODE_ENV` | Enables production static-file serving | `production` |
| `GEMINI_API_KEY` | Gemini API key, if AI features are used | Configure locally; never commit it |
| `APP_URL` | Public application URL used by hosted deployments | `http://localhost:3001` for local use |

Copy `.env.example` to `.env.local` if you need the optional application environment settings. Keep `.env.local` private.

## Troubleshooting

### Port already in use

Choose another available port and use it consistently:

```powershell
$env:PORT = "3002"
npm run dev
```

Then open <http://localhost:3002>.

### Production server starts in development mode

Set `NODE_ENV` before running the compiled server:

```powershell
$env:NODE_ENV = "production"
node dist/server.cjs
```

### Reset PowerShell environment variables

Variables set with `$env:` apply to the current PowerShell session. Remove them when they are no longer needed:

```powershell
Remove-Item Env:PORT -ErrorAction SilentlyContinue
Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
```
