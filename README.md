# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Deploy in produzione

Il target di build è Cloudflare Workers (via Nitro, configurato in `@lovable.dev/vite-tanstack-config`).
Nessun deploy automatico è collegato: la CI (`.github/workflows/ci.yml`) esegue solo
lint/typecheck/test/build, mai la pubblicazione. Il deploy è manuale, in due passaggi:

```sh
bun run build          # genera .output/ (include .output/server/wrangler.json)
npx nitro deploy --prebuilt
```

Il secondo comando richiede un account Cloudflare autenticato. Due modalità:

- **Da una macchina di sviluppo (prima volta)**: `npx wrangler login` apre il browser per
  autenticarti una volta sola; le credenziali restano salvate localmente per i deploy successivi.
- **Non interattivo (CI o server)**: imposta le variabili d'ambiente `CLOUDFLARE_API_TOKEN` e
  `CLOUDFLARE_ACCOUNT_ID` (crea un token con permesso "Edit Cloudflare Workers" dal dashboard
  Cloudflare, sezione "My Profile → API Tokens") — nessun login interattivo richiesto.

Da verificare/decidere prima del primo deploy reale (non ancora confermato in questo repository):

- un account e un progetto Cloudflare Workers effettivamente collegati;
- un dominio personalizzato puntato al Worker (altrimenti resta il sottodominio `*.workers.dev`);
- se automatizzare il deploy in CI aggiungendo uno step `npx nitro deploy --prebuilt` dopo la
  build su push a `main`, una volta aggiunti `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` come
  secret del repository GitHub.
