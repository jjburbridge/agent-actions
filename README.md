# Content Review

Sanity Studio for market/product content sections, with custom tools for exploring, editing, commenting on, exporting, and comparing content.

## Setup

```bash
cp .env.example .env.local
# Set SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET
yarn
yarn dev
```

Studio runs at the URL printed by `sanity dev` (typically `http://localhost:3333`).

## Content model

| Type | Role |
| --- | --- |
| `section` | Hierarchical section tree (`parent`, `products`) |
| `contentSection` | Market-specific content for a section (`title`, Portable Text `content`, `section`, `market`) |
| `market` | Market dimension for content |
| `product` | Product dimension for sections |
| `summary` | Summary documents |
| `instructions` | Instruction documents |
| `exportHistory` | Snapshots from Content Explorer exports (used by Content Compare) |

`contentSection.content` is Portable Text (`array` of `block`).

## Custom tools

Registered in `sanity.config.ts`:

### Content Explorer

Browse sections by product and market, edit content inline, comment, and export.

- Filter by product and market
- Section tree with content availability
- Edit `title` and Portable Text `content` via Studio form APIs (saves as draft)
- Studio-style inline comments on content:
  - Yellow highlights for existing text comments
  - Floating **Add comment** on text selection → compose panel below
  - Comment icon above the editor opens all threads and a new-comment field
- Export current market content as JSON or PDF (writes `exportHistory`)

### Content Compare

Diff exported history against current content (or between exports).

- Pick exports from `exportHistory`
- Shows only changed `contentSection` documents
- In-place Portable Text / string diffs using Sanity’s diff UI (`DiffString` and related)

## Scripts

| Command | Description |
| --- | --- |
| `yarn dev` | Local Studio |
| `yarn build` | Production Studio build |
| `yarn deploy` | Deploy Studio |
| `yarn start` | Serve a built Studio |

## Layout

```
schemaTypes/          Document schemas
components/           Shared rendering (Portable Text)
lib/                  Portable Text helpers
tools/
  contentExplorer/    Explore / edit / comment / export
  contentCompare/     Diff exports vs current content
```
