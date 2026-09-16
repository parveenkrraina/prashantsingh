# FieldTrack Pro

FieldTrack Pro is a React and Express application for field staff attendance, GPS tracking, visit verification, route playback, leave management, duty rosters, and payroll reporting.

For production preparation and rollout, see [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md).

The Hostinger deployment process is documented under [Hostinger deployment](#hostinger-deployment).

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

## Hostinger deployment

Docker is not required when using Hostinger's managed Node.js Web App hosting. Hostinger connects directly to GitHub, installs dependencies, builds the application, and deploys new commits.

### Supported plan

Use a Hostinger Business Web Hosting or Cloud Hosting plan with Node.js Web App support. A Hostinger VPS follows a different, self-managed deployment process.

### GitHub validation

The workflow in `.github/workflows/deploy.yml` runs on pull requests and pushes to `main`. It performs:

1. `npm ci`
2. `npm run lint`
3. `npm run build`
4. Verification of `dist/server.cjs` and `dist/index.html`

Protect the GitHub `main` branch and require this workflow to pass before a pull request can be merged. Once the validated change reaches `main`, Hostinger's GitHub integration performs the deployment.

### Connect the repository in Hostinger

1. Open **hPanel → Websites → Add Website**.
2. Select **Node.js Web App** or **Deploy Web App**.
3. Select **Import Git Repository**.
4. Authorize GitHub and select this repository.
5. Select the `main` branch.
6. Confirm the build configuration.

Use these build settings when Hostinger does not detect them automatically:

| Setting | Value |
| --- | --- |
| Node.js version | `22` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Start command | `npm start` |
| Entry file, if requested | `app.js` |
| Output directory, if requested | `dist` |

Add these environment variables in hPanel rather than committing them:

```env
NODE_ENV=production
APP_URL=https://your-domain.example
```

Hostinger supplies the application port. The server already reads `process.env.PORT`, so do not hard-code the public port.

### Production data warning

The application currently stores all server data in `data/database.json`. Hostinger creates versioned deployment directories and switches the live release after a successful deployment. Files inside a release must not be treated as durable application storage.

Before using the application with real production data, migrate the JSON database to Hostinger MySQL, Supabase PostgreSQL, or another managed database. Otherwise a redeployment can lose or replace user, attendance, GPS, payroll, and configuration data.

### Deployment verification

After Hostinger reports a successful deployment, verify:

```text
https://your-domain.example/api/health
```

Then test administrator login, staff login, GPS permission, camera permission, offline synchronization, and the manager dashboard over HTTPS.
