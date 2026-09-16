# FieldTrack Pro

FieldTrack Pro is a React and Express application for field staff attendance, GPS tracking, visit verification, route playback, leave management, duty rosters, and payroll reporting.

For production preparation and rollout, see [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md).

The automated GitHub deployment workflow is documented under [GitHub Actions deployment](#github-actions-deployment).

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

## GitHub Actions deployment

The workflow in `.github/workflows/deploy.yml` validates the application, publishes a Docker image to GitHub Container Registry, and deploys it to a Linux server over SSH after a push to `main`. Pull requests only run validation and the production build.

### Server requirements

- A Linux server with Docker installed
- A deployment user with permission to run Docker
- SSH access from GitHub-hosted runners
- A reverse proxy sending the production domain to `127.0.0.1:3001`
- HTTPS configured at the reverse proxy

The workflow runs only one container because the current JSON database does not support concurrent application writers. Its persistent Docker volume is named `fieldtrack-pro-data`.

### Repository secrets

Configure these under **GitHub repository → Settings → Secrets and variables → Actions → Secrets**:

| Secret | Description |
| --- | --- |
| `DEPLOY_HOST` | Server hostname or IP address |
| `DEPLOY_PORT` | SSH port; normally `22` |
| `DEPLOY_USER` | SSH deployment username |
| `DEPLOY_SSH_KEY` | Private SSH key for the deployment user |
| `DEPLOY_KNOWN_HOSTS` | Trusted server host-key entry generated with `ssh-keyscan -H your-server` and verified by the server administrator |
| `GHCR_USERNAME` | GitHub username that can read the container package |
| `GHCR_TOKEN` | GitHub token with `read:packages` permission |

### Repository variables

Configure these under **Actions → Variables**:

| Variable | Description | Example |
| --- | --- | --- |
| `APP_URL` | Public HTTPS URL used for the final health check | `https://fieldtrack.example.com` |
| `APP_PORT` | Private host port used by the reverse proxy | `3001` |

Create a GitHub environment named `production`. Add required reviewers to that environment if deployments need manual approval.

The workflow can also be started manually from **GitHub → Actions → Validate, Build, and Deploy → Run workflow**.
