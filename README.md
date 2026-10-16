# Tiny Defense

Tower defense 2D em pixel art feito com Next.js (App Router), TypeScript, Tailwind CSS e Canvas 2D.
O plano de desenvolvimento e o andamento estão em [`ROADMAP.md`](ROADMAP.md).

## Executar localmente

Requisitos: Node.js 20+ e npm.

```bash
npm install
npm run dev        # http://localhost:3000
```

Nenhuma chave de API, backend ou login é necessário.

## Comandos

| Comando             | Descrição                              |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento            |
| `npm run build`     | Build de produção                      |
| `npm run start`     | Servir o build de produção             |
| `npm run lint`      | ESLint                                 |
| `npm run typecheck` | Verificação de tipos com `tsc`         |

## Estrutura

- `src/app/` — rotas e layout (fonte Fredoka via `next/font/google`, tokens em `globals.css`).
- `src/lib/assets.ts` — caminhos tipados dos sprites principais.
- `src/game/` — simulação em TypeScript puro (constantes do mundo em `config/constants.ts`).

## Assets

- Sprites em `public/assets/` (servidos em `/assets/...`):
  - `game/` — torres, inimigos, castelos, projéteis e cenário.
  - `ui/travelbook/` — interface (ícones, painéis, molduras).
  - `meta/sprite-manifest.json` — dimensões e quadros dos 46 sprites de gameplay.
- Documentação e licenças em `docs/` (`ASSETS_README.md`, `LICENSE_UI.txt`).

## Créditos e licenças

- UI: **Complete UI Book Styles Pack**, por Crusenho Agus Hennihuno —
  <https://crusenho.itch.io/complete-ui-book-styles-pack> (ver `docs/LICENSE_UI.txt`).
- Gameplay: pacote **Simple Tower Defense** — licença ainda não verificada.
  **Pendência bloqueadora para publicação**, não para desenvolvimento local.
