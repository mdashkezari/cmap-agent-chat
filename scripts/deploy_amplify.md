# Deploy via AWS Amplify Hosting (recommended for fastest iteration)

Amplify Hosting typically expects the project to be in a Git repo (GitHub/GitLab/Bitbucket).

High-level steps:
1) Put this repo on GitHub (private is fine).
2) AWS Console → Amplify → "New app" → "Host web app"
3) Connect repo + branch.
4) Build settings:
   - Build command: `npm ci && npm run build`
   - Output directory: `dist`
5) Add custom domain:
   - simonscmap.ai (apex)
   - chat.simonscmap.ai (redirect → apex)

SPA routing:
- Add a rewrite rule so all routes serve `/index.html`.

See AWS docs:
- Custom domains
- Rewrites and redirects

Note:
- For an apex domain (simonscmap.ai), we usually manage DNS in Route 53 or our registrar.
