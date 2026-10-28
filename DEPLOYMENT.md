# Atta deployment checklist

Use this checklist to configure Supabase, deploy Atta with GitHub Pages, and connect `atta.ujjwalraj.com`. Atta is a separate site and repository from `www.ujjwalraj.com`.

## 1. Create the Supabase project and copy its public client values

1. Create a project in [Supabase](https://supabase.com/dashboard).
2. Open the project's **Connect** dialog, or go to **Project Settings → API Keys**. Copy the **Project URL** and the **publishable key** that starts with `sb_publishable_`.
3. For local development, copy `.env.example` to `.env.local` and fill in:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_YOUR_KEY
   ```

   The environment variable keeps its `ANON_KEY` name for compatibility with the app, but use the publishable key value. Never use a Supabase secret or `service_role` key in frontend code. The publishable key is included in the browser bundle; Row Level Security protects the data.

4. Open the Supabase **SQL Editor** and run the SQL files in `supabase/migrations/` in filename order. If you already ran the initial schema migration, run the next migration file once to add the effort buffer column.

Supabase's [API key guide](https://supabase.com/docs/guides/getting-started/api-keys) explains where to find the values and why publishable keys belong in browser apps.

## 2. Configure email and Google sign-in

1. In Supabase, open **Authentication → URL Configuration**.
2. Set **Site URL** to:

   ```text
   https://atta.ujjwalraj.com
   ```

3. Add these **Redirect URLs**:

   ```text
   https://atta.ujjwalraj.com/*
   http://localhost:5173/*
   ```

4. Under **Authentication → Sign In / Providers**, enable the **Email** provider. Atta uses email and password. If email confirmation is enabled, account creation still requires an email; configure custom SMTP for reliable delivery.
5. Google sign-in is optional. To enable it:
   - In Google Cloud Console, create an OAuth client with application type **Web application**.
   - Add these **Authorized JavaScript origins**:
     - `https://atta.ujjwalraj.com`
     - `http://localhost:5173`
   - Add the exact Supabase callback URL shown on its Google provider settings page as an **Authorized redirect URI**. It usually looks like `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
   - Paste the Google client ID and client secret into the Supabase Google provider settings and enable the provider.

See Supabase's [Google sign-in setup](https://supabase.com/docs/guides/auth/social-login/auth-google) for the current provider steps.

## 3. Create a GitHub repository and push Atta

1. Create a new GitHub repository for Atta. On GitHub Free, use a **public** repository for GitHub Pages.
2. If this local repository does not have an `origin` remote yet, add yours:

   ```sh
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/atta.git
   ```

3. Stage and commit the project if it has not been committed already:

   ```sh
   git add -A
   git commit -m "Build Atta dynamic Eisenhower matrix"
   ```

4. Push the `main` branch:

   ```sh
   git push -u origin main
   ```

The workflow at `.github/workflows/deploy.yml` runs the urgency tests, builds the app, and deploys it on pushes to `main`.

## 4. Add the Supabase build values to GitHub Actions

In the Atta repository, open **Settings → Secrets and variables → Actions** and add:

- Under **Variables**, create `VITE_SUPABASE_URL` with your Supabase Project URL.
- Under **Secrets**, create `VITE_SUPABASE_ANON_KEY` with your Supabase publishable key (`sb_publishable_...`).

The workflow reads these two names at build time. Although the key is stored as a GitHub secret for the workflow, a publishable key is public once bundled into the website. Do not enter a Supabase secret or service-role key.

## 5. Enable GitHub Pages and connect the domain

1. In the Atta repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.
2. In the Pages **Custom domain** field, enter `atta.ujjwalraj.com` and save it **before changing DNS**.
3. At your DNS provider, add this record:

   | Type | Host/name | Target/value |
   |---|---|---|
   | CNAME | `atta` | `YOUR_GITHUB_USERNAME.github.io` |

   Use your GitHub username in the target, without the repository name. Leave the existing `www` record unchanged.

4. Wait for DNS to propagate and for GitHub to issue the certificate, then enable **Enforce HTTPS** in **Settings → Pages**.
5. The repository includes `public/CNAME` as requested. For this GitHub Actions deployment, GitHub's Pages setting is authoritative; its custom-workflow documentation says a `CNAME` artifact is not required. See [GitHub's custom-domain setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) and [custom-domain troubleshooting](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages).

## 6. Verify the deployment

1. Open the repository's **Actions** tab and wait for **Build and deploy to GitHub Pages** to finish successfully.
2. Visit `https://atta.ujjwalraj.com` and test email sign-in. If Google is enabled, test that too.
3. If Auth redirects fail, re-check the Supabase Site URL and Redirect URLs from step 2, and the Google authorized redirect URI from step 2.5.

For local development, run `npm install` and `npm run dev`. Without `.env.local`, Atta opens in local mode and stores tasks in the current browser.
