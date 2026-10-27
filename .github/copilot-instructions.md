# GitHub Copilot Instructions

## Project

**Малки ГИС изследователи (Little GIS Explorers)** is an educational GIS application for
primary-school students in grades 1–4. It helps children explore Bulgaria, discover
literary landmarks, develop geographical knowledge, and practise digital and spatial
thinking.

## Verified workspace context

- Before making changes, inspect the current workspace and repository rather than
  assuming that a technology, directory, feature, table, or configuration exists.
- At the time these instructions were created, the workspace contained `.mcp.json` and
  `.gitignore`, but no application source files, package manifest, migration files, or
  other implementation files were present.
- `.mcp.json` contains HTTP MCP configurations for the Supabase project. Treat its
  project reference and connection details as configuration, not as permission to
  expose credentials or bypass project security.
- When application source, manifests, migrations, or schema documentation are added,
  update this understanding from the files that actually exist.

## Architecture and implementation

- Follow the architecture, technologies, conventions, naming, formatting, and scripts
  already established by the project. Inspect relevant files before modifying them.
- Make small, focused changes and preserve working functionality. Do not delete or
  replace existing features without explicit authorization.
- Keep the application accessible, responsive, maintainable, and suitable for children
  in grades 1–4.
- Preserve the Bulgarian-language user experience, including existing localization,
  terminology, labels, and content conventions.
- Prefer clear, type-safe, secure implementations and reuse existing helpers and
  patterns instead of duplicating logic.
- Surface errors explicitly using the project's established logging and user-notification
  patterns. Do not hide failures behind broad catches or silent fallbacks.

## External GIS resource

The project includes the following published external educational resource:

- Name: `Вергиния чете – Вълшебно литературно пътешествие през България`
- URL: https://www.arcgis.com/apps/instant/nearby/index.html?appid=5e8bd330b9ae4519be093bd70132b790
- Integration: embed the resource on a dedicated `literary-journey.html` page using a
  responsive iframe.
- Language: preserve the ArcGIS application's Bulgarian and English language support.

Reference embed markup:

```html
<iframe src="https://www.arcgis.com/apps/instant/nearby/index.html?appid=5e8bd330b9ae4519be093bd70132b790" width="400" height="600" frameborder="0" style="border:0" allowfullscreen>iFrames не се поддържат на тази страница.</iframe>
```

When implementing this integration:

- Keep the ArcGIS application external and do not copy, rewrite, or duplicate its map.
- Provide a responsive iframe container suitable for desktop, tablet, and mobile devices;
  do not rely on the reference dimensions as fixed dimensions.
- Provide a direct external link as a fallback.
- Handle iframe loading failures or unavailable external content with an explicit,
  accessible error message and a retry or open-in-new-tab option.
- Preserve the ArcGIS application's existing bilingual behavior and do not overwrite its
  language configuration.
- Before implementation, verify iframe embedding, browser and mobile behavior,
  fullscreen support, accessibility, network-failure behavior, deployment `frame-src`
  policy, and the continued availability of the public URL.
- Do not treat the external ArcGIS resource as a replacement for Supabase data,
  authentication, authorization, Storage, or RLS.

## Database and Supabase migrations

Keep DB migrations in sync.

For files matched by the Supabase-specific workspace instructions, also follow
[supabase.instructions.md](instructions/supabase.instructions.md).

The mandatory migration workflow is:

1. **First create local SQL files to hold migrations.**
2. **Run the DB migration to Supabase.**

Preserve these two steps for every schema change. Before creating a migration:

- Inspect existing migration files and the current database schema.
- Inspect existing tables, columns, relationships, database functions, authentication
  settings, and Row Level Security (RLS) policies before modifying database behavior.
- Verify that tables, columns, functions, and policies exist in the available project
  context; do not infer them from names or documentation alone.
- Avoid duplicate migrations and undocumented schema changes.
- Keep local migration files synchronized with the intended Supabase database schema.
- Use read-only inspection when diagnosing the database unless the user explicitly
  authorizes a change.
- Never apply destructive database changes without explicit authorization.
- Never expose database credentials, API secrets, or service-role keys in source code,
  logs, documentation, or commits.
- Follow the security and access conventions already established by the project.

## Git and GitHub

- Work in the existing repository and current branch unless the user explicitly requests
  otherwise.
- Preserve project files and commit history.
- Do not delete branches, rewrite Git history, force-push, or create another repository
  without explicit authorization.
- Before finishing, explain which files were modified and why.

## Working with the user

- Follow the user's explicit instructions and requested workflow.
- Give practical, step-by-step guidance when it is useful and explain important
  technical decisions clearly.
- Identify uncertainties and missing project context instead of inventing details.
- Ask for authorization before destructive or externally visible actions.

## Verification

- Use the project's existing linters, formatters, builds, and tests when they exist.
- Run the smallest relevant validation for the change; escalate only when necessary.
- Verify that changes preserve existing behavior and do not modify unrelated files.
- When the ArcGIS resource is implemented, verify the dedicated page on desktop, tablet,
  and mobile viewports, including successful loading, fallback behavior, external linking,
  and preservation of Bulgarian and English language support.
- For database work, verify both the local migration files and the intended Supabase
  schema state after the authorized migration.
