# Tiny Defense - Assets preparados para Next.js

Extraia o conteúdo deste ZIP **na raiz do projeto Next.js**, mantendo a pasta `public/assets/`.

## Origem
- `Simple Tower Defense.rar` (fornecido pelo usuário): 46 arquivos PNG para o jogo.
- `Complete_UI_Book_Styles_Pack_Free.7z` (fornecido pelo usuário): 67 sprites UI, 45 quadros PNG de animações de UI, 3 spritesheets.

## Pastas
- `public/assets/game/enemies/` — 9 spritesheets horizontais de inimigos.
- `public/assets/game/environment/` — terreno, tiles e decoração.
- `public/assets/game/buildings/towers/` — 6 torres de combate.
- `public/assets/game/buildings/castles/` — 3 spritesheets de castelos.
- `public/assets/game/buildings/decorative-towers/` — 6 spritesheets de torres decorativas.
- `public/assets/game/projectiles/` — 6 sprites de projéteis.
- `public/assets/ui/travelbook/` — sprites de interface, animações e spritesheets.
- `public/assets/meta/sprite-manifest.json` — metadados de dimensões e recortes.

## Renderização
- Inimigos: 4 quadros horizontais, **exceto Ghost: 8 quadros**.
- Castelos e torres não ofensivas: 4 quadros horizontais.
- Torres de combate: sprites estáticos individuais.
- `spr_tile_set_ground.png` e `spr_tile_set_stone.png`: atlas 48x48, correspondendo a uma matriz 3x3 com tiles de 16x16 (a selecionar por retângulo de origem).
- Renderizar com `image-rendering: pixelated` / `imageSmoothingEnabled = false` e respeitar proporções originais.

## Fontes e licença
- O pacote de UI inclui `docs/LICENSE_UI.txt`: permite uso em projetos comerciais e não comerciais e exige atribuição ao autor Crusenho Agus Hennihuno; leia a licença integral antes de publicar. Página: https://crusenho.itch.io/complete-ui-book-styles-pack.
- O arquivo `Simple Tower Defense.rar` não continha licença. Verifique a licença da página original antes de distribuir ou comercializar o jogo.
- O ZIP contém **apenas os assets enviados pelo usuário** reorganizados e os metadados gerados; não substitui os termos de licença originais.

## Exemplo de uso em Next.js
```tsx
<img src="/assets/game/buildings/towers/spr_tower_archer.png" alt="Torre arqueira" style={{ imageRendering: 'pixelated' }} />
```
