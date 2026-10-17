# Tiny Defense

Tower defense 2D em pixel art feito com Next.js (App Router), TypeScript, Tailwind CSS e Canvas 2D.
Uma partida completa tem 10 ondas, um mapa fixo, três torres e um chefe final, e funciona no
desktop e no celular. O plano de desenvolvimento e o andamento estão em [`ROADMAP.md`](ROADMAP.md).

## Instalação e execução

Requisitos: Node.js 20+ e npm. Nenhuma chave de API, backend ou login é necessário.

```bash
npm install
npm run dev        # http://localhost:3000
```

## Comandos

| Comando                | Descrição                                                        |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento                                      |
| `npm run build`        | Build de produção (servido com `npm run start`)                  |
| `npm run start`        | Servir o build de produção                                       |
| `npm run build:static` | Site 100% estático em `out/`, para qualquer hospedagem de arquivos |
| `npm run lint`         | ESLint                                                           |
| `npm run typecheck`    | Verificação de tipos com `tsc`                                   |
| `npm test`             | Testes unitários da simulação (Vitest)                           |

## Como jogar

- **Objetivo:** impedir que os inimigos cheguem ao castelo durante 10 ondas. Você começa com
  20 vidas e 150 moedas.
- **Construir:** escolha uma torre no painel e toque/clique numa casa livre fora da estrada.
- **Melhorar e vender:** toque numa torre construída. Cada torre vai até o nível 3 (mais dano e
  alcance); vender devolve 60% de tudo o que foi investido nela.
- **Ondas:** toque em **Iniciar onda** quando estiver pronto. Cada onda concluída paga um bônus
  (20 + 5 × número da onda) e os inimigos ficam mais resistentes a cada onda. A 10ª traz o King Slime.
- **Controles:** pausa/retomada, velocidade 1×/2× e Esc para cancelar a construção ou a seleção.
  O jogo pausa sozinho ao trocar de aba ou de aplicativo.

| Torre      | Custo | Papel                                          |
| ---------- | ----: | ---------------------------------------------- |
| Archer     |    50 | Flechas rápidas em um alvo                     |
| Cannon     |    90 | Explosão lenta em área                         |
| Ice Wizard |    75 | Pouco dano, deixa os inimigos lentos           |

| Inimigo     | Vida base | Velocidade | Recompensa | Dano ao castelo |
| ----------- | --------: | ---------: | ---------: | --------------: |
| Normal Slime |       32 |         16 |         10 |               1 |
| Goblin       |       22 |         25 |         12 |               1 |
| Skeleton     |       50 |         17 |         15 |               1 |
| Big Slime    |       95 |         12 |         22 |               1 |
| King Slime   |      420 |          9 |        120 |               3 |

A vida base é multiplicada pela onda (1× na onda 1 até 5,5× na onda 10). Os números de
balanceamento ficam em `src/game/config/balance.ts`, `src/game/data/waves.ts` e
`src/game/data/enemies.ts`.

## Recordes e preferências

O jogo salva neste navegador (`localStorage`, chave `tiny-defense:save`, versionada) a maior onda
alcançada, vitórias, derrotas e a velocidade preferida; os recordes aparecem no menu inicial.
Storage bloqueado ou corrompido usa os valores padrão sem erro. Partidas em andamento **não** são
salvas (fora do escopo do MVP).

## Estrutura

- `src/app/` — rotas (`/` menu, `/play` partida, `/creditos`) e layout (fonte Fredoka, tokens e
  escala de pixel `--px` em `globals.css`).
- `src/components/ui/` — design system em pixel art (`PixelButton`, `PixelPanel`, `PixelIcon`, `PixelSprite`).
- `src/components/menu/` — cenário animado, "Como jogar" e recordes.
- `src/components/game/` e `src/components/layout/GameShell.tsx` — HUD, painéis, canvas e diálogos da partida.
- `src/game/` — simulação em TypeScript puro: `engine/GameEngine.ts` (passo fixo, comandos validados),
  `systems/` (caminho, construção, combate, economia, ondas), `engine/GameRenderer.ts` (Canvas 2D).
- `src/hooks/` — ponte React ↔ engine (snapshot via `useSyncExternalStore`), sprites, recordes.
- `src/lib/storage.ts` — armazenamento local versionado.
- `src/tests/unit/` — testes da simulação, economia, ondas, velocidade e armazenamento.

## Deploy

Todas as rotas são estáticas e não há backend próprio:

- `npm run build` + `npm run start` em qualquer ambiente Node.js; ou
- `npm run build:static` e publicar a pasta `out/` em qualquer hospedagem de arquivos (o servidor
  deve resolver `/play` para `play.html`). Nesse modo Cache Components fica desligado, então sair
  de `/play` encerra a partida em vez de preservá-la pausada.

Depois de carregada, a partida continua funcionando sem internet; navegar entre telas offline não
é garantido (modo offline/PWA é pós-MVP). O jogo não tem áudio.

## Assets

- Sprites em `public/assets/` (servidos em `/assets/...`):
  - `game/` — torres, inimigos, castelos, projéteis e cenário.
  - `ui/travelbook/` — interface (ícones, painéis, molduras).
  - `meta/sprite-manifest.json` — dimensões e quadros dos sprites de gameplay.
- Documentação e licenças em `docs/` (`ASSETS_README.md`, `LICENSE_UI.txt`).
- Ícones do site em `src/app/` (`favicon.ico` 16/32/64, `icon.svg`, `apple-icon.png` 180×180):
  a torre Archer sobre a grama do jogo, montados pixel a pixel a partir dos sprites originais.

## Créditos e licenças

- UI: **Complete UI Book Styles Pack**, por Crusenho Agus Hennihuno —
  <https://crusenho.itch.io/complete-ui-book-styles-pack> (ver `docs/LICENSE_UI.txt`).
- Gameplay: pacote **Simple Tower Defense** — licença ainda não verificada.
  **Pendência bloqueadora para publicação**, não para desenvolvimento local.
- Fonte: Fredoka (SIL Open Font License), via Google Fonts.
