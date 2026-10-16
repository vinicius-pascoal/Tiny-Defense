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
| `npm test`          | Testes unitários da simulação (Vitest) |

## Estrutura

- `src/app/` — rotas (`/` menu, `/play` partida, `/creditos`) e layout (fonte Fredoka via
  `next/font/google`, tokens e escala de pixel `--px` em `globals.css`).
- `src/components/ui/` — design system em pixel art: `PixelButton`, `PixelPanel`, `PixelIcon`, `PixelSprite`.
- `src/components/menu/` — cenário animado do menu e diálogo "Como jogar".
- `src/lib/assets.ts` — caminhos tipados dos sprites, ícones e molduras 9-slice da UI.
- `src/lib/spriteManifest.ts` — leitura tipada do manifesto de sprites de gameplay.
- `src/game/` — simulação em TypeScript puro (`config/constants.ts` e `config/balance.ts`).

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
