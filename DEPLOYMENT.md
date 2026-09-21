# Deployment

## Render backend

Create a Render Web Service from this repository. The included `render.yaml` uses
`geomatrix_v2` as the service root and starts FastAPI with the Render-provided
`PORT`.

Set these Render environment variables:

- `DATABASE_URL`: Render PostgreSQL connection string.
- `FRONTEND_URL`: deployed Vercel URL, for example `https://geomatrix.vercel.app`.
- `CORS_ORIGINS`: comma-separated allowed browser origins. Include the Vercel URL
  and any custom domain.
- `GEMINI_API_KEY`: only if Gemini explanations are enabled.

Verify `https://<render-service>.onrender.com/health` returns
`{"status":"ok"}` before configuring Vercel.

## Vercel frontend

Import the repository as a Next.js project. The included `vercel.json` uses
`npm ci` and `npm run build`.

Set these Vercel environment variables for Production, Preview, and Development
as appropriate:

- `MODEL_API_URL`: public Render API URL, without a trailing slash.
- `NEXT_PUBLIC_API_URL`: same public Render API URL. The browser API client uses
  this value so Vercel requests reach FastAPI instead of local/demo Next.js
  routes.
- `NEXT_PUBLIC_APP_URL`: deployed Vercel URL.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth client ID, if Google login is used.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: server-side Google OAuth values,
  if configured.
- `GEMINI_API_KEY`: only if the Vercel-side explanation route is enabled.

After deployment, test `/login`, `/projects`, `/data`, `/model`, and
`/api/model/status`. Never commit `.env.local` or production credentials.
