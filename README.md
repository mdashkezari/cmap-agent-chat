[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.19456099.svg)](https://doi.org/10.5281/zenodo.19456099)

# CMAP Chat UI (React SPA)

This repository is the frontend for the CMAP Agent API hosted at:

- API (prod): https://agent.simonscmap.ai

Application domains:

- https://simonscmap.ai
- https://chat.simonscmap.ai (redirect → https://simonscmap.ai)



## What the current version does (not exhaustive)
- Paste/save API key (sent as `X-API-Key`)
- Start a **new chat** (clears local state)
- List threads via `GET /threads` (sidebar)
- Load a thread via `GET /threads/{thread_id}/messages`
- Send a message to `POST /chat`
- Render assistant messages
- Render tool trace
- Render artifacts (inline images + downloads)
- Render returned code snippets (shown as Python) with a Copy button
- Show Examples (clickable prompt cards) loaded from `src/data/examples.json`

## Editing the built-in examples

Examples are bundled with the app in:

- `src/data/examples.json`

To add/remove examples, edit that JSON file and redeploy.

## Local development

### 1) Prereqs
- Node.js 18+ (tested with Node 22)
- npm

### 2) Configure environment
Copy `.env.example` to `.env.local` and edit as needed:

```bash
cp .env.example .env.local
```

### 3) Install + run
```bash
npm install
npm run dev
```


## Production build
```bash
npm run build
npm run preview
```

## Frontend version / build number

Every release publishes build metadata into the deployed static site:

- `https://simonscmap.ai/build-info.json` (machine readable)

The JSON includes fields like `version`, `build`, `git_sha`, `build_time`, and `version_text`.

This is written during `scripts/release.sh` and uploaded with `scripts/deploy_s3_cloudfront.sh`.

### Version bump policy
`scripts/release.sh` **refuses to deploy** unless `package.json` version is bumped compared to the version currently deployed.

Use one of:

```bash
npm version patch
npm version minor
npm version major
```

Then run:

```bash
./scripts/release.sh
```

## Deployment (AWS) – S3 + CloudFront

We host the SPA on **simonscmap.ai** while keeping the API separate at **agent.simonscmap.ai**.

1) Provision the static hosting stack (S3 private bucket + CloudFront + SPA routing)
   - CloudFormation template: `infra/cloudformation/s3-cloudfront-spa.yml`
   - Helper script: `scripts/provision_s3_cloudfront.sh`

2) Deploy the built assets
   - Script: `scripts/deploy_s3_cloudfront.sh`

### Keep the API accessible
API and docs live on a different subdomain:
- API root: https://agent.simonscmap.ai
- Docs: https://agent.simonscmap.ai/docs

As long as we **do not change the DNS/ALB for `agent.simonscmap.ai`**, hosting the SPA on `simonscmap.ai` will not affect API access.


