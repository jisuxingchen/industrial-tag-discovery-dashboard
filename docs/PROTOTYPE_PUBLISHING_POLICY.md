# Product Workbench Publishing Policy

## Purpose

The clickable Product Workbench is developed in the private ITD repository at
`prototype/workbench/`. The copy in this public dashboard repository is a **release mirror**, not
the development source of truth.

The goal is to keep the Netlify dashboard linked to the prototype without consuming a Netlify
production-deploy credit for every prototype iteration.

## Publishing model

1. Routine prototype development happens only in:
   `jisuxingchen/industrial-tag-discovery/prototype/workbench/`.
2. Do **not** mirror every prototype commit into this repository.
3. Sync the four static workbench files into
   `industrial-tag-discovery-dashboard/prototype/workbench/` only at a meaningful review,
   demo, acceptance, or release checkpoint.
4. The Netlify dashboard shell links the Product Workbench to the GitHub Pages URL:
   `https://jisuxingchen.github.io/industrial-tag-discovery-dashboard/prototype/workbench/`.
5. GitHub Pages deploys when `prototype/**` changes.
6. Netlify skips a production deploy when a commit changes only:
   - `progress.json`; and/or
   - `prototype/**`.
7. Changes to the Netlify shell/navigation itself still deploy normally.

## Result

- project-status-only update → GitHub-hosted live data / no Netlify production deploy;
- prototype-only release sync → GitHub Pages / no Netlify production deploy;
- dashboard shell or navigation change → normal Netlify production deploy.

This is a publishing/cost-control rule only. It does not change ITDP product authority, field
evidence, PDX-001, Phase 9, or Never Write semantics.
