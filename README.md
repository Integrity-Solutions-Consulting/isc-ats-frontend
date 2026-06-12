# Integrity Solutions — Portal RH (ATS)

Portal interno de Talento Humano para Integrity Solutions. Monorepo:
`frontend/` (Next.js), `backend/` (FastAPI, pendiente), `infra/`, `docs/`.

Fase actual: **arranque del frontend**.

## Para empezar (humano o agente)
1. Lee `CLAUDE.md` (raíz) — brief y reglas duras.
2. Revisa `docs/`:
   - `00_contexto_producto.md` — qué hace cada pantalla.
   - `01_arquitectura.md` — decisiones + revisión.
   - `02_frontend_convenciones.md` — estructura y reglas de código.
   - `03_design_tokens.md` — sistema visual (color/tipografía).
   - `04_base_de_datos.md` — esquema para modelar.
3. Prototipos de UI en `docs/prototypes/` (wireframes lo-fi: layout/IA, **no**
   diseño visual final).
4. Esquema PostgreSQL en `docs/database/schema.sql`.
5. Tokens listos en `frontend/globals.css` (Tailwind v4, CSS-first).

## Estructura
```
integrity-ats/
├── CLAUDE.md
├── README.md
├── docs/
│   ├── 00_contexto_producto.md
│   ├── 01_arquitectura.md
│   ├── 02_frontend_convenciones.md
│   ├── 03_design_tokens.md
│   ├── 04_base_de_datos.md
│   ├── prototypes/*.html
│   └── database/schema.sql
└── frontend/
    ├── CLAUDE.md
    ├── globals.css
    ├── postcss.config.mjs
    └── public/brand/logo_integrity.png
```
