# Deploy kristiansalmeron.com to Render

## What you own

This folder is the complete source repository: Next.js frontend, Express API, shared contracts, local photographs, fonts, design assets, and documentation. It is not tied to ChatGPT hosting. The existing chatgpt.site address is a review deployment; `.openai/hosting.json` is only its deployment metadata and is ignored by Render.

The Git repository root is `outputs/portfolio` within the original task folder. Push this folder as its own repository, not the parent task folder. The companion `portfolio-v1-source.zip` contains the source without installed dependencies or generated builds.

## Services

`render.yaml` defines two independently deployed services from the same repository, following CareIQ's separation of frontend and API:

| Service               | Render type                     | Output / startup               |
| --------------------- | ------------------------------- | ------------------------------ |
| kristian-salmeron-web | Static Site                     | `apps/web/out`                 |
| kristian-salmeron-api | Node Web Service, free instance | `node apps/api/dist/server.js` |

The website is fully interactive React even though its pages are exported to static files. Its navigation, photographs, and Wind Study work without the API. The API currently provides health and project summaries; no database, Clerk account, API keys, or browser API URL is needed. The free API instance may sleep when idle; that does not delay the website. If only the website is needed, deploy just the Static Site manually using the first service's settings.

## 1. Put the source in your GitHub account

Create an empty repository named `kristiansalmeron.com` (a private repository works with a connected Render GitHub account). Do not initialize it with a README because this project already has Git history.

From this portfolio folder, add the repository URL GitHub provides as `origin`, then push `main`:

```sh
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace the URL placeholder with your actual repository URL. If `origin` already exists, inspect `git remote -v` first. GitHub Desktop's Add Local Repository / Publish Repository flow is an alternative. Source ZIP users should extract it and initialize a repository first; the ZIP does not include `.git` history.

## 2. Create the Render services

1. Open your existing Render account and select New → Blueprint.
2. Connect the new GitHub repository and select `main`.
3. Use `render.yaml` at the repository root. Leave Root Directory blank: both services need the pnpm workspace and lockfile at the root.
4. Review the website and API services, then deploy. The API explicitly selects the free instance; review any account usage charges shown by Render.
5. Wait for both deployments to succeed. Render installs the pinned pnpm version, installs development dependencies needed for compilation, then builds each service with its workspace dependencies.

The web service has no start command because Render serves its exported files. Do not add a catch-all rewrite to `/index.html`: this is a multi-page Next.js export, and each route has its own HTML. The API reads Render's supplied `PORT`; do not hardcode the local port 3211.

## 3. Verify before connecting the domain

Use the exact `onrender.com` addresses Render assigns (service names do not guarantee the final hostname).

- Open the homepage, `/work/`, `/work/gen-ui/`, `/about/`, and a field note directly; refresh a nested page.
- Check photographs, mobile navigation, the Wind Study, and external links.
- Open an unknown page and confirm the 404.
- Open the API service's `/api/v1/health` and `/api/v1/projects` and confirm successful JSON responses.

## 4. Connect kristiansalmeron.com

In the **web Static Site**, open Settings → Custom Domains and add `kristiansalmeron.com`. Render will also handle the matching `www` domain and redirect configuration. Follow the DNS records shown in that service's dashboard at your current DNS provider, then click Verify. Keep unrelated email/MX and TXT records intact. Use Render's current instructions for conflicting web records instead of guessing an IP address.

Render provisions HTTPS after verification. Check both `https://kristiansalmeron.com` and `https://www.kristiansalmeron.com`, including a nested page. The domain belongs on the frontend, not the API. An API custom domain is unnecessary for this v1.

## Future updates and recovery

Push changes to `main` to trigger automatic deployments. Keep the lockfile committed. If a build fails, read the failed service's build log; verify Node 22.23.2, repository-root builds, and that development dependencies were installed. Use Render's deployment history to roll back a bad release. If the API is later used from browser code, implement an explicit CORS policy and frontend API URL as part of that feature.

## Handoff status

The Render configuration and source archive are prepared locally. No GitHub repository, Render service, or DNS change has been created by this handoff. The previous review deployment remains separate.

## Local verification

Both service build commands (using the already installed, pinned pnpm) passed: the API and shared contracts compiled, and Next.js exported all pages successfully. The output directory and API entrypoint exist. Installation on Render and the Blueprint itself still need validation in the connected Render account; no hosted deployment is claimed.

## Official references

- [Render Blueprint specification](https://render.com/docs/blueprint-spec)
- [Monorepo support](https://render.com/docs/monorepo-support)
- [Static Sites](https://render.com/docs/static-sites)
- [Custom domains and DNS setup](https://render.com/docs/custom-domains)
- [Node version configuration](https://render.com/docs/node-version)
