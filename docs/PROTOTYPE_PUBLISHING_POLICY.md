# Product Workbench Publishing Policy

## Single official public entry

The only official ITDP dashboard/public workbench entry is:

`https://industrialtagdiscovery.netlify.app/`

GitHub Pages is no longer a supported dashboard or prototype deployment target.

## Source model

- Dashboard source repository: `jisuxingchen/industrial-tag-discovery-dashboard`.
- Netlify publishes this repository.
- `dashboard.html` reads live `progress.json` from the dashboard repository.
- The Product Workbench is published under the same Netlify site at `prototype/workbench/`.
- Private product development remains in `jisuxingchen/industrial-tag-discovery`; the public `prototype/workbench/` directory is only a reviewed release mirror.

## Publishing rules

1. Routine project-status updates may change only `progress.json`; Netlify may skip a production build because the live dashboard reads that file directly from GitHub raw.
2. Changes to dashboard shell/navigation, `index.html`, `dashboard.html`, or Netlify configuration trigger a Netlify deploy.
3. Changes to `prototype/workbench/**` also trigger a Netlify deploy so the single official Netlify entry always serves the current published prototype.
4. Do not add or restore a GitHub Pages deployment workflow.
5. Historical snapshots under `history/` are versions of the same Netlify dashboard, not independent status authorities.

## Authority

The dashboard is a derived visualization only. Live GitHub Issues / Pull Requests / Actions and the private repository truth remain authoritative for lifecycle, merge authorization, CI, field-execution authorization and evidence classification.

Never Write remains absolute.
