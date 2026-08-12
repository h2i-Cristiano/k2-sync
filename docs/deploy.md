# Deploy e CI/CD

## Ambientes

| Ambiente | URL | Branch |
|----------|-----|--------|
| Producao | https://k2-sync.vercel.app | main |
| Preview | Automatico via PR | PR branch |
| Local | http://localhost:3001 | qualquer |

## Vercel

### Configuracao

| Config | Valor |
|--------|-------|
| Framework | Next.js |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Node.js | 22 |

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

> [!warning] Root Directory
> O Root Directory DEVE estar configurado como `frontend` no painel do Vercel.
> Configuracoes: Settings > General > Root Directory > `frontend`

### Variaveis de Ambiente (Vercel)

| Variavel | Descricao | Onde usar |
|----------|-----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon JWT do Supabase | Client + Server |

### Deploy Automatico

O deploy e disparado automaticamente a cada push na branch `main`:

1. Push para `main`
2. Vercel detecta mudanca
3. Roda `npm install` + `npm run build`
4. Deploy em producao

### Deploy Manual

```bash
# Via CLI
npx vercel --prod --force --scope arena-resenha

# Via Git
git push origin main
```

## GitHub Actions (CI/CD)

### Pipeline

```
Push/PR para main
    │
    ▼
┌─────────────────────┐
│   lint-and-test     │
│  ├── npm ci         │
│  ├── npm run lint   │
│  ├── tsc --noEmit   │
│  └── playwright test│
└─────────┬───────────┘
          │ (apenas push para main)
          ▼
┌─────────────────────┐
│      deploy         │
│  ├── npm ci         │
│  ├── vercel link    │
│  └── vercel --prod  │
└─────────────────────┘
```

### Secrets (GitHub)

| Secret | Descricao |
|--------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon Supabase |
| `VERCEL_TOKEN` | Token de acesso Vercel |

### Arquivo: `.github/workflows/ci-cd.yml`

```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npx playwright install chromium --with-deps
      - run: npx playwright test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  deploy:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm install -g vercel
      - run: vercel link --yes --project k2-sync --token ${{ secrets.VERCEL_TOKEN }}
      - run: vercel --prod --yes --token ${{ secrets.VERCEL_TOKEN }}
```

## Variaveis de Ambiente (Local)

### frontend/.env.local

```ini
NEXT_PUBLIC_SUPABASE_URL=https://fdphsumvqokygyxbguqy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...sua-chave-anon...
```

### Como obter

1. Acesse https://supabase.com/dashboard/project/fdphsumvqokygyxbguqy
2. Va em Settings > API
3. Copie `Project URL` e `anon public` key

## Troubleshooting

### Build falha: "Couldn't find any pages or app directory"

**Causa:** Root Directory nao configurado como `frontend`
**Solucao:** Settings > General > Root Directory > `frontend`

### Build falha: "lockfile missing swc dependencies"

**Causa:** Lockfile sem dependencias nativas SWC
**Solucao:** Rodar `npm run build` localmente para patch automatico

### Deploy nao dispara

**Causa:** Branch errada ou commit sem push
**Solucao:** Verificar se o push foi para `main`

### Erro 401 no Supabase

**Causa:** Variavel de ambiente incorreta
**Solucao:** Verificar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
