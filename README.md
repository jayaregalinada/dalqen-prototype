# Dalqen Prototype

Standalone React prototype for the Dalqen core operations flow. Vite produces a static site for GitHub Pages; Supabase provides optional shared demo persistence without an application server to operate.

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open the URL printed by Vite. Without Supabase environment variables, the prototype still runs in local-preview mode but workflow changes do not synchronize across browsers.

## Shared demo setup

1. Create a Supabase project for fictional prototype data only.
2. Run `supabase db push` to apply the migrations in [`supabase/migrations`](supabase/migrations).
3. Copy the project URL and publishable key into `.env.local`:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
   ```

4. Restart `pnpm dev`. The status control should show **Shared demo · Live**.

The demo intentionally has one publicly readable and writable row. Never put customer, employee, production, or other sensitive data in it. Workflow changes use optimistic updates and realtime synchronization; simultaneous edits are last-write-wins. Navigation, filters, and visual variants remain local to each visitor. Anyone can use **Reset** to delete all entered job orders and restore the blank first-time workspace.

## User personas

Click the profile button (top-right or header) to switch between users. Each user sees only the job orders and projects assigned to them, filtered to their relevant production stages.

| User | Persona | Initials | Sees |
|------|---------|----------|------|
| **Workspace Owner** | Owner | `WO` | Full workspace — all stages |
| **Jamie Reyes** | Artist | `JR` | Layout → Sizing stages |
| **Maya Santos** | Artist | `MS` | Layout → Sizing stages |
| **Elena Cruz** | Sewer | `EC` | Sewing stage |
| **Marco Diaz** | Sewer | `MD` | Sewing stage |
| **Rosa Lim** | Heatpress | `RL` | Heatpress stage |
| **Tomas Aquino** | Heatpress | `TA` | Heatpress stage |
| **Nina Bautista** | Quality Control | `NB` | QC stage |
| **Carlos Vega** | Quality Control | `CV` | QC stage |

The active user is preserved in the URL (`?user=jamie`). Only the **Workspace Owner** can create job orders, assign team members, advance stages, and release projects. QC users can record QC passes. Team members are assigned via the Owner's project workspace — click **Assign team member** and pick from the available users.

## Variants

- `?variant=A` — Dispatch Board
- `?variant=B` — Ops Console
- `?variant=C` — Digital Job Jacket

Use the floating switcher or left/right arrow keys to compare variants. Screen and queue selections stay in the URL for sharing.

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds and deploys every push to `main`.

1. Add these GitHub repository Actions secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
2. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` or run the workflow manually.
