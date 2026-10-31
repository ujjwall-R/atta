# Atta

Atta is a personal Eisenhower matrix where urgency changes with time. Task importance stays fixed until you change it. Deadline urgency is calculated in the browser from a sigmoid curve; no urgency values are written back to the database.

## Local development

Requirements: Node.js 22.12 or newer and npm.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Commit the generated `package-lock.json` after the first install so local and CI installs use the same dependency versions.

Without Supabase environment variables, Atta runs in local mode and saves tasks and sessions in this browser's `localStorage`. Add the Supabase values below to `.env.local` to enable email and Google sign-in and cross-device sync. Never put a service-role key in a `VITE_` variable.

Useful commands:

```sh
npm test          # Vitest unit tests
npm run typecheck # strict TypeScript check
npm run build     # production build
```

## Supabase setup

1. Create a free Supabase project.
2. In **Project Settings → API**, copy the Project URL and the publishable key (or legacy `anon` key) into `.env.local`:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   ```

3. In the Supabase SQL Editor, run the SQL files in `supabase/migrations/` in filename order. Run [`20261029000100_initial_schema.sql`](supabase/migrations/20261029000100_initial_schema.sql) first, then [`20261029000200_task_effort_buffer.sql`](supabase/migrations/20261029000200_task_effort_buffer.sql). They create the schema and add the per-task effort buffer. Each user can only read and change rows whose `user_id` matches their authenticated user ID.
4. Under **Authentication → URL Configuration**, set the Site URL to `https://atta.ujjwalraj.com`. Add these Redirect URLs:
   - `https://atta.ujjwalraj.com/*`
   - `http://localhost:5173/*`
5. For email/password sign-in, enable the **Email** provider. New accounts require email confirmation by default; configure custom SMTP for reliable confirmation emails, or disable **Confirm email** for a private personal app where users do not need verified addresses.
6. For Google sign-in, enable **Google** under **Authentication → Providers**. Create OAuth credentials in Google Cloud Console. Add the Supabase callback URL shown in the provider setup (usually `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`) to Google’s authorized redirect URIs. Add `https://atta.ujjwalraj.com` and `http://localhost:5173` as authorized JavaScript origins. Paste the Google client ID and secret into Supabase, then save.

The frontend only needs the project URL and publishable/anon key. RLS is the data access boundary; do not disable it and do not use a service-role key in the browser.

## Deployment to GitHub Pages

For the manual Supabase, GitHub Actions, OAuth, and DNS checklist, see [DEPLOYMENT.md](DEPLOYMENT.md).

This repository is intended to be deployed independently from `www.ujjwalraj.com`. The Pages artifact includes `public/CNAME` for `atta.ujjwalraj.com`; Vite uses `base: '/'`, and the app uses hash-based routing so refreshes work on Pages.

1. Push this repository to GitHub with a `main` branch.
2. In **Settings → Pages**, choose **GitHub Actions** as the build and deployment source.
3. In **Settings → Secrets and variables → Actions**, add:
   - Variable `VITE_SUPABASE_URL` — your Supabase project URL.
   - Secret `VITE_SUPABASE_ANON_KEY` — your Supabase publishable/anon key.
4. Ensure the repository’s Pages deployment environment is named `github-pages`. The workflow in `.github/workflows/deploy.yml` builds the app and deploys `dist` on pushes to `main`.
5. At your DNS provider, create a **CNAME** record with host/name `atta` and target `<your-github-username>.github.io` (for this domain, likely `ujjwalraj.github.io`). Keep the existing `www` record unchanged. If your DNS provider requires a trailing dot, use `ujjwalraj.github.io.`.
6. In **Settings → Pages → Custom domain**, enter `atta.ujjwalraj.com` and save. Wait for DNS verification, then enable **Enforce HTTPS** when GitHub offers it.
7. Add `https://atta.ujjwalraj.com/*` to Supabase redirect URLs and configure the Google OAuth origin/callback as described above.

DNS changes can take time to propagate. The existing `www.ujjwalraj.com` site is not modified by this repository or its workflow.

## Product notes

- Urgency uses UTC timestamps and day-based sigmoid growth. The curve midpoint is the latest safe start: deadline minus estimated effort and the task's effort buffer. Effort defaults to 60 minutes and the editable effort buffer to 30 minutes. The selected starting urgency is the curve's lower baseline; deadline urgency rises from it toward 100. Open overdue tasks are set to 100 urgency.
- Tasks without deadlines use their saved starting urgency as a stable manual value. Completed tasks stop being treated as overdue.
- Urgency recalculates in memory every minute while the app is open; it is never persisted as a changing database value.
- On desktop, drag matrix markers to adjust importance and manual urgency. Dragging a deadline-driven task along urgency opens a choice to reschedule its deadline or review urgency settings. On smaller screens, the matrix becomes quadrant cards.
- The batch view groups lower-importance tasks into a focused session and uses each task’s estimated effort (or 15 minutes when none is set) for a quick duration estimate.

## Keyboard shortcuts

- `N` — add a task
- `⌘/Ctrl + K` — quick add a task
- `/` — focus search in Task list
- `Esc` — close the current dialog

## Structure

```text
src/features/       auth, task, matrix, and batch flows
src/lib/            urgency, validation, Supabase, and persistence
src/components/ui/  small accessible UI primitives
supabase/           SQL schema and RLS migration
.github/workflows/  GitHub Pages build and deploy
```
