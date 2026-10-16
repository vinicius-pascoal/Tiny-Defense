# Tiny Defense — ROADMAP de desenvolvimento

> **Documento de execução para um agente de programação (Codex ou equivalente).**
>
> **Status inicial:** planejamento concluído; implementação não iniciada.
> **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + React + Canvas 2D.
> **Fonte:** [Fredoka — Google Fonts](https://fonts.google.com/specimen/Fredoka), via `next/font/google`.
> **Plataformas:** navegador desktop e mobile, com interação por mouse, toque e teclado onde fizer sentido.
> **Direção visual:** pixel art medieval/fantasia, usando exclusivamente os assets fornecidos para o cenário, personagens, torres e elementos da interface.

---

## 0. Instruções obrigatórias para o agente

Este é o **plano de implementação**, não apenas uma lista de sugestões. Trabalhe **uma etapa por vez**, na ordem definida, e somente marque um item como concluído quando existir código funcional e a validação especificada tiver sido executada.

### Regras de trabalho

1. **Examine o repositório antes de alterar arquivos.** Se o projeto já existir, preserve as decisões compatíveis com este roadmap e não recrie o app desnecessariamente.
2. **Use os sprites reais.** Nunca substitua os assets do usuário por imagens externas, emojis ou placeholders na versão final de uma etapa. Placeholders temporários são tolerados apenas durante o desenvolvimento e devem ser removidos antes do aceite.
3. **Não reimplemente o gameplay dentro dos componentes React.** A simulação deve ficar em TypeScript puro, independente da árvore de componentes. React gerencia telas, HUD, menus, comandos e estado para apresentação.
4. **Mantenha todas as mecânicas desacopladas:** engine, renderização, input, entidades, ondas, economia, combate e persistência.
5. **Evite adicionar dependências desnecessárias.** O Canvas 2D nativo é suficiente para o MVP. Não instalar Phaser, banco de dados, ORM, autenticação ou backend de gameplay sem necessidade comprovada.
6. **Adote designs responsivos e acessíveis.** Nenhuma funcionalidade essencial pode depender exclusivamente de hover, botão direito ou teclado.
7. **Não avance com erros conhecidos.** Ao fim de cada etapa, execute lint, testes e build disponíveis, corrija os problemas e registre brevemente o resultado.
8. **Atualize este `ROADMAP.md` ao concluir cada etapa:** marque os checkboxes, informe arquivos alterados, validações executadas, pendências e o ponto de retomada.
9. **Não altere o escopo silenciosamente.** Ajustes locais podem ser realizados quando necessários, mas devem ser documentados; mudanças de gameplay relevantes exigem uma justificativa.
10. **Não declare uma etapa pronta só porque compila.** O comportamento e os critérios de aceite também devem estar funcionando.
11. **Não mexa em tarefas de etapas futuras enquanto uma etapa anterior estiver incompleta**, exceto ajustes pontuais indispensáveis para mantê-la funcional.
12. **Nenhum dado externo deve ser necessário para iniciar ou jogar:** o MVP deve rodar localmente após instalar as dependências, sem chave de API, serviço online ou login.

### Entrega esperada ao final de cada etapa

Registre ao final de cada implementação:

```text
ETAPA CONCLUÍDA: [número — nome]
IMPLEMENTADO:
- ...
ARQUIVOS PRINCIPAIS:
- ...
VALIDAÇÃO:
- npm run lint: ...
- npm run build: ...
- testes relevantes: ...
PENDÊNCIAS / RISCOS:
- ...
PRÓXIMA ETAPA:
- ...
```

> **Comando de continuidade para o agente:** “Leia o `ROADMAP.md`, identifique a primeira etapa com critérios de aceite pendentes, implemente somente essa etapa, valide, atualize os checkboxes e apresente o resumo de conclusão.”

---

## 1. Visão do jogo

### 1.1. Conceito

**Tiny Defense** é um tower defense 2D compacto, em pixel art, em que o jogador posiciona torres ao redor de uma estrada para impedir que inimigos alcancem seu castelo. Os inimigos surgem em ondas; cada eliminação concede moedas, que podem ser utilizadas para construir, melhorar ou adaptar a defesa.

### 1.2. Objetivo da primeira versão (MVP)

Entregar **uma partida completa e rejogável**, com 10 ondas, um mapa fixo, três torres utilizáveis, quatro tipos de inimigos comuns e um chefe final. A experiência precisa funcionar em desktop e dispositivos móveis.

### 1.3. Escopo obrigatório do MVP

- Menu inicial, botão **Jogar**, instruções básicas e acesso aos créditos.
- Tela de jogo com cenário real em pixel art, caminho fixo e castelo.
- Canvas 2D adaptado à área disponível, preservando proporção e nitidez dos pixels.
- Inimigos com movimento ao longo da estrada e animações a partir das spritesheets.
- Construção de torres apenas em células permitidas.
- Torres **Archer**, **Cannon** e **Ice Wizard**, com comportamentos distintos.
- Projéteis, escolha de alvo, dano, área de efeito e efeito de lentidão.
- Moedas, custo de construção, recompensas, melhorias e venda de torres.
- Dez ondas, painel de informações, controle de início da onda e avanço condicionado à sua conclusão.
- Pausa, continuação, velocidade `1×/2×` e reinício de partida.
- Vidas do castelo, vitória, derrota e opção de jogar novamente.
- Interface adaptada a mouse/toque, legível e operável em telas pequenas.
- Recorde local e configurações locais simples.

### 1.4. Fora do MVP

- Multiplayer, rankings remotos, contas, partidas online e sincronização na nuvem.
- Editor de mapas, geração procedural de caminhos e campanha com dezenas de fases.
- Todas as seis torres e todos os nove inimigos desde o início.
- Compras, anúncios, skins pagas, loja online e monetização.
- Salvamento/restauração completa de uma partida em andamento.
- Backend, API própria, banco de dados ou painel administrativo.

### 1.5. Valores iniciais de balanceamento

Valores **iniciais para testes**, não regras imutáveis. Centralize-os em arquivos de configuração; não espalhe números mágicos no código.

| Parâmetro | Valor inicial |
| --- | ---: |
| Vidas do castelo | 20 |
| Moedas iniciais | 150 |
| Quantidade de ondas | 10 |
| Multiplicadores de velocidade | 1× e 2× |
| Nível máximo das torres | 3 |
| Tamanho lógico de tile | 16 × 16 unidades |
| Grade de jogo | 20 colunas × 12 linhas |
| Resolução lógica do mapa | 320 × 192 unidades |
| Duração-alvo da partida | Cerca de 8–12 minutos, a verificar por testes |

**Regras econômicas:** inimigos eliminados concedem recompensa; inimigos que chegam ao castelo reduzem 1 vida (chefe: 3, a testar); construir e melhorar gastam moedas; a venda devolve 60% do total já investido na torre, arredondado para baixo. Nunca permitir saldo negativo.

---

## 2. Pacotes de assets e uso correto

### 2.1. Pacote já organizado

O usuário possui o arquivo `Tiny-Defense-Assets-NextJS.zip`, derivado de:

- `Simple Tower Defense.rar` — **46 PNGs do gameplay**.
- `Complete_UI_Book_Styles_Pack_Free.7z` — **67 sprites de interface, 45 quadros separados de animação e 3 spritesheets da UI**.

Extraia o conteúdo do ZIP **na raiz do projeto**. O ZIP já contém as pastas `public/assets/` e `docs/`. **Não crie uma pasta `public/public` e não altere nomes de arquivos sem atualizar as referências.**

O arquivo `public/assets/meta/sprite-manifest.json` descreve as dimensões e o número de quadros dos **46 sprites de gameplay**; ele não é um inventário completo de todos os sprites da UI.

### 2.2. Diretórios existentes no pacote

```text
public/assets/
├── game/
│   ├── buildings/
│   │   ├── castles/
│   │   ├── decorative-towers/
│   │   └── towers/
│   ├── enemies/
│   ├── environment/
│   │   ├── decoration/
│   │   ├── grass/
│   │   └── tiles/
│   └── projectiles/
├── meta/
│   └── sprite-manifest.json
└── ui/
    └── travelbook/
        ├── animated/
        ├── sprites/
        └── spritesheets/

docs/
├── ASSETS_README.md
└── LICENSE_UI.txt
```

### 2.3. Nomes exatos a utilizar no MVP

| Elemento | Arquivo em `public/assets/` |
| --- | --- |
| Torre arqueira | `game/buildings/towers/spr_tower_archer.png` |
| Torre de canhão | `game/buildings/towers/spr_tower_cannon.png` |
| Torre de gelo | `game/buildings/towers/spr_tower_ice_wizard.png` |
| Projétil arqueiro | `game/projectiles/spr_tower_archer_projectile.png` |
| Projétil canhão | `game/projectiles/spr_tower_cannon_projectile.png` |
| Projétil gelo | `game/projectiles/spr_tower_ice_wizard_projectile.png` |
| Slime comum | `game/enemies/spr_normal_slime.png` |
| Slime grande | `game/enemies/spr_big_slime.png` |
| Goblin | `game/enemies/spr_goblin.png` |
| Esqueleto | `game/enemies/spr_skeleton.png` |
| Chefe King Slime | `game/enemies/spr_king_slime.png` |
| Castelo verde | `game/buildings/castles/spr_castle_green.png` |
| Tiles de terreno | `game/environment/tiles/spr_tile_set_ground.png` |
| Tiles de pedra | `game/environment/tiles/spr_tile_set_stone.png` |
| Ícone moeda | `ui/travelbook/sprites/UI_TravelBook_IconCoin01a.png` |
| Ícone vida | `ui/travelbook/sprites/UI_TravelBook_IconHeart01a.png` |
| Ícone pause | `ui/travelbook/sprites/UI_TravelBook_IconPause01a.png` |
| Ícone play | `ui/travelbook/sprites/UI_TravelBook_IconPlay01a.png` |
| Ícone reiniciar | `ui/travelbook/sprites/UI_TravelBook_IconRestart01a.png` |
| Painel popup | `ui/travelbook/sprites/UI_TravelBook_Popup01a.png` |
| Moldura | `ui/travelbook/sprites/UI_TravelBook_Frame01a.png` |
| Slot | `ui/travelbook/sprites/UI_TravelBook_Slot01a.png` |
| Barra | `ui/travelbook/sprites/UI_TravelBook_Bar01a.png` |

**Atenção:** os nomes acima são caminhos **relativos a `public/assets/`**. No código, suas URLs começarão com `/assets/`.

### 2.4. Regras de renderização dos sprites

- Spritesheets dos inimigos: **4 quadros horizontais**, exceto **Ghost: 8**; usar valores do manifesto, nunca presumir um padrão universal.
- Castelos e torres decorativas: **4 quadros horizontais**.
- Torres ofensivas no MVP: sprites estáticos; animação de ataque pode ser representada por projéteis e efeitos procedurais.
- `spr_tile_set_ground.png` e `spr_tile_set_stone.png`: **48×48 px**, cada um representando atlas **3×3 de tiles 16×16**. Desenhar recortes específicos com `drawImage`, nunca desenhar o atlas inteiro como se fosse um tile.
- Desenhar mantendo proporção. Sprites de diferentes tamanhos devem ter suas bases alinhadas às células; não esticar todos para `16×16`.
- Canvas: `ctx.imageSmoothingEnabled = false`.
- HTML/CSS: `image-rendering: pixelated` quando apropriado.
- A escala visual deve ser constante e coerente; no Canvas, mapear corretamente tamanho CSS, `devicePixelRatio` e coordenadas dos ponteiros.
- Carregar imagens uma única vez, por meio de um cache; não instanciar imagens durante cada frame.
- Exibir estado de carregamento até todos os assets essenciais da partida estarem disponíveis.
- Se um recurso falhar, registrar erro e oferecer feedback legível, em vez de lançar exceções dentro do loop.

### 2.5. Licenças e créditos

- A UI exige atribuição a **Crusenho Agus Hennihuno**, com link à página: <https://crusenho.itch.io/complete-ui-book-styles-pack>.
- A licença completa da UI está em `docs/LICENSE_UI.txt`; conservar essa documentação e ler suas condições sobre redistribuição dos assets, especialmente antes de publicar.
- O pacote `Simple Tower Defense.rar` não veio acompanhado de licença. **Verificar a origem e a permissão de distribuição antes do lançamento público ou comercial**; não inventar uma licença.
- Incluir seção de créditos no jogo. Se a licença do pacote de gameplay não estiver esclarecida, registrar essa pendência como **bloqueadora de publicação**, mas não como bloqueio para desenvolvimento local.

---

## 3. Arquitetura proposta

### 3.1. Princípio de separação

```text
Next.js / React / Tailwind
       |
       | envia comandos, lê snapshots (HUD)
       v
GameController / React hook de integração
       |
       v
GameEngine (simulação TypeScript puro)
  |    |      |        |         |
  |    |      |        |         +--> EconomySystem
  |    |      |        +------------> WaveSystem
  |    |      +---------------------> CombatSystem
  |    +----------------------------> Entities / PathSystem
  +---------------------------------> GameState
       |
       v
GameRenderer (Canvas 2D; leitura do estado)
       |
       v
SpriteLoader / SpriteAnimator
```

O Canvas não deve decidir regras do jogo; ele apenas desenha o estado. React não deve executar física, projéteis e cálculo de dano. O motor não deve importar componentes de React nem acessar elementos HTML diretamente.

### 3.2. Estrutura final sugerida

```text
tiny-defense/
├── public/
│   └── assets/                        # preservado do ZIP
├── docs/
│   ├── ASSETS_README.md               # preservado do ZIP
│   └── LICENSE_UI.txt                 # preservado do ZIP
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx                    # menu principal
│   │   └── play/page.tsx              # página de partida
│   ├── components/
│   │   ├── game/
│   │   │   ├── GameCanvas.tsx
│   │   │   ├── GameHUD.tsx
│   │   │   ├── TowerSelector.tsx
│   │   │   ├── TowerDetails.tsx
│   │   │   ├── WaveControls.tsx
│   │   │   └── GameOverDialog.tsx
│   │   ├── layout/
│   │   │   └── GameShell.tsx
│   │   └── ui/
│   │       ├── PixelButton.tsx
│   │       ├── PixelPanel.tsx
│   │       └── PixelIcon.tsx
│   ├── game/
│   │   ├── config/
│   │   │   ├── balance.ts
│   │   │   └── constants.ts
│   │   ├── data/
│   │   │   ├── enemies.ts
│   │   │   ├── towers.ts
│   │   │   ├── levels.ts
│   │   │   └── waves.ts
│   │   ├── engine/
│   │   │   ├── GameEngine.ts
│   │   │   ├── GameRenderer.ts
│   │   │   ├── SpriteLoader.ts
│   │   │   └── SpriteAnimator.ts
│   │   ├── entities/
│   │   │   ├── Enemy.ts
│   │   │   ├── Tower.ts
│   │   │   └── Projectile.ts
│   │   ├── systems/
│   │   │   ├── PathSystem.ts
│   │   │   ├── WaveSystem.ts
│   │   │   ├── CombatSystem.ts
│   │   │   ├── EconomySystem.ts
│   │   │   └── PlacementSystem.ts
│   │   ├── types/
│   │   │   ├── game.ts
│   │   │   └── entities.ts
│   │   └── utils/
│   │       ├── geometry.ts
│   │       └── math.ts
│   ├── hooks/
│   │   └── useGameController.ts
│   ├── lib/
│   │   ├── assets.ts
│   │   └── storage.ts
│   └── tests/
│       ├── unit/
│       └── e2e/
├── ROADMAP.md
├── package.json
├── tsconfig.json
└── README.md
```

**Essa é uma referência**, não uma exigência de criar arquivos vazios antecipadamente. Criar os arquivos conforme forem necessários em cada etapa.

### 3.3. Contratos de dados básicos

O agente pode adaptar os nomes, mas a organização conceitual deve ser equivalente:

```ts
type GamePhase = 'preparing' | 'running' | 'victory' | 'defeat';
type TowerType = 'archer' | 'cannon' | 'iceWizard';
type EnemyType = 'normalSlime' | 'goblin' | 'skeleton' | 'bigSlime' | 'kingSlime';
type SpeedMultiplier = 1 | 2;

type GridPosition = { col: number; row: number };
type Vector2 = { x: number; y: number };

type GameSnapshot = {
  phase: GamePhase;
  paused: boolean;
  speed: SpeedMultiplier;
  lives: number;
  gold: number;
  currentWave: number;
  totalWaves: number;
  activeEnemies: number;
  pendingEnemies: number;
  selectedTowerId: string | null;
  selectedBuildType: TowerType | null;
};
```

- A engine possui **uma única fonte de verdade** para ouro, vidas, entidades e ciclo das ondas.
- A interface lê um `GameSnapshot` imutável ou um mecanismo de assinatura com snapshots para evitar inconsistências.
- O Canvas desenha usando o estado interno da engine; o HUD não precisa renderizar a 60 FPS. Publicar atualizações de HUD por eventos/alterações ou frequência moderada.
- Comandos públicos: `startWave`, `pause`, `resume`, `setSpeed`, `selectBuildType`, `placeTower`, `selectTower`, `upgradeTower`, `sellTower`, `restart`.
- Cada comando valida pré-condições dentro da engine e retorna sucesso/erro estruturado. **Não confiar apenas na desativação de botões da interface.**
- Os IDs das entidades devem ser únicos durante a partida; remover entidades mortas/expiradas sem mutar arrays durante uma iteração problemática.
- O loop da engine deve ser destruído no desmontar do componente; evitar listeners duplicados, RAF simultâneos e vazamentos de memória.

### 3.4. Loop e tempo

- Um único `requestAnimationFrame` controla a execução visual.
- Simulação com **passo fixo** recomendado de `1/60 s`; usar acumulador de tempo.
- Limitar o delta real por frame (por exemplo, `100 ms`) e o número de passos por renderização para evitar explosões após retornar de abas inativas.
- Velocidade 2× deve multiplicar o **tempo de simulação**, afetando movimento, cooldown, spawn e animações relacionadas ao jogo. Não criar outro loop RAF.
- Em pausa, não progredir cooldowns, inimigos, ondas nem projéteis.
- Ao perder foco ou ocultar a aba, pausar automaticamente, evitando mortes enquanto o jogador não acompanha a tela; mostrar opção de retomar.
- Limpeza de recursos, eventos e loops ao navegar entre telas ou reiniciar.

---

## 4. Configuração visual e UX

### 4.1. Identidade visual

- Tipografia: Fredoka para títulos, botões e interface geral.
- Cenário: pixel art real dos pacotes enviados; tiles verdes/terra/pedra e decoração discreta.
- HUD: painéis e ícones do pack TravelBook, com boa legibilidade sobre o mapa.
- Paleta: tons naturais (verde, marrom, bege), realces em dourado/moedas e azul/efeitos de gelo.
- Não usar gradientes futuristas, emojis como ícones finais nem ilustrações alheias ao estilo do pacote.
- Priorizar legibilidade, contagem de vidas/ouro, estado da onda e clareza da seleção de torres.

### 4.2. Organização da tela

**Desktop:** cabeçalho com nome, vidas, moedas e onda; mapa central com largura prioritária; seleção de torres em painel lateral; controles de onda/pausa/velocidade; painel contextual da torre selecionada.

**Mobile:** cabeçalho compacto; mapa proporcional ocupando toda largura disponível; seleção de torres em barra abaixo do canvas (com rolagem horizontal se necessário); painel contextual tipo gaveta ou painel inferior; todos os controles sem necessidade de hover.

**Interação principal:** escolher torre pela interface → apontar/tocar célula válida → confirmar posicionamento com clique/toque. Selecionar torre construída → ver informações e botões de melhorar/vender. Clique/toque fora pode limpar seleção. Mostrar prévia do alcance e validade da célula, sem exigir segundo toque para completar ações simples.

### 4.3. Requisitos de responsividade

- Testar pelo menos em viewport **390×844**, **768×1024** e **1366×768**.
- Nenhum controle essencial deve sair da viewport; permitir rolagem vertical da página no mobile quando necessária.
- Área de toque de botões pelo menos aproximadamente **44×44 CSS px**.
- Canvas com proporção lógica fixa `320:192`, escalado para caber no espaço disponível **sem distorcer a imagem**.
- Evitar que touch/scroll/zoom acidental cause construção involuntária; `touch-action` deve ser aplicado somente à região interativa apropriada.
- Tratar `devicePixelRatio` e mapeamento entre coordenadas de tela (CSS) e espaço lógico de jogo.
- Considerar `prefers-reduced-motion` para efeitos não essenciais de interface; manter feedback suficiente para jogar.

---

## 5. Mapa inicial e caminho

### 5.1. Mapa inicial

- Grade: **20×12**.
- Cada célula equivale a **16 unidades** no mundo.
- Mundo lógico: **320×192**.
- Caminho ortogonal pré-definido, sem mudanças dinâmicas.
- Entrada à esquerda; castelo e ponto final próximos ao lado direito.
- Construção bloqueada nas células de caminho e nas células reservadas para o castelo.
- Decorações (árvores/pedras/cogumelos) não devem cobrir o caminho nem esconder entidades e controles. Preferencialmente, posicioná-las em células reservadas para decoração, que não permitam construção.

### 5.2. Waypoints sugeridos

Lista inicial de células, na ordem do percurso:

```ts
const PATH_WAYPOINTS: GridPosition[] = [
  { col: 0, row: 2 },
  { col: 5, row: 2 },
  { col: 5, row: 7 },
  { col: 12, row: 7 },
  { col: 12, row: 3 },
  { col: 16, row: 3 },
  { col: 16, row: 9 },
  { col: 19, row: 9 },
];
```

- Expandir cada segmento em células contíguas; **evitar duplicar as células dos cantos**.
- Inimigos percorrem **centros das células**, interpolando entre pontos em coordenadas do mundo.
- O castelo é um elemento visual no final do trajeto, ajustado para não ser cortado pelo limite do Canvas. O ponto de entrada do castelo determina quando o inimigo escapa.
- Renderizar as curvas do caminho usando combinações apropriadas do atlas, ou compor o solo/estrada de modo que as quinas fiquem visualmente conectadas.
- Qualquer ajuste visual do mapa deve preservar a coerência entre **caminho renderizado, caminho lógico e áreas bloqueadas para construção**.

### 5.3. Estratégia de seleção de torres

- Ao escolher uma torre para construir, desenhar indicação verde/vermelha da célula apontada e círculo de alcance com transparência.
- Transformar coordenadas de mouse/toque em célula utilizando retângulo real do Canvas e escala do desenho.
- Validação de construção deve verificar: dentro do grid, não é caminho, não é área do castelo, não contém decoração impeditiva, não está ocupada, há moedas e a fase permite construção.
- Se houver falha, **não gastar moedas nem criar torre**; mostrar motivo de forma breve.
- Construção permitida durante preparação e durante onda ativa. Bloqueada quando pausado, após vitória ou derrota.
- Uma célula suporta no máximo uma torre.

---

## 6. Torres, inimigos e ondas — especificação do MVP

### 6.1. Torres

Todos os valores abaixo estão sujeitos a ajustes após o teste da partida completa. Distância em unidades do mundo lógico; cooldowns são medidos em **segundos de simulação**.

| Torre | Custo | Dano inicial | Intervalo de ataque | Alcance | Efeito especial |
| --- | ---: | ---: | ---: | ---: | --- |
| Archer | 50 | 9 | 0,80 s | 66 | Projétil rápido de alvo único |
| Cannon | 90 | 20 | 1,80 s | 62 | Explosão em área de raio 24 |
| Ice Wizard | 75 | 4 | 0,85 s | 75 | Lentidão de 40% por 1,7 s |

**Regras comuns:**

- Prioridade de alvo: o inimigo **mais avançado no caminho** dentre os inimigos vivos ao alcance.
- Ataques devem respeitar cooldown; não atacar inimigos fora do alcance no instante do disparo.
- Projéteis podem buscar o alvo vivo enquanto voam; se o alvo desaparecer, remover projéteis de alvo único. Para canhão, a explosão pode ocorrer no último destino válido conhecido.
- Dano e efeitos devem ser aplicados pela engine, nunca pelo renderer.
- Ice: lentidão não acumula multiplicativamente; um novo impacto pode atualizar a duração. Ao expirar, velocidade retorna ao normal.
- Cannon: danificar cada inimigo atingido **uma vez por explosão**.
- Proibir `NaN`, dano negativo, intervalos iguais a zero e multiplicadores inválidos.

**Melhorias:** níveis 1, 2 e 3. Proposta inicial: custo para subir do nível 1 ao 2 = `ceil(0.75 × custoBase)`; nível 2 ao 3 = `ceil(1.2 × custoBase)`. Cada melhoria aumenta o dano em aproximadamente 40% em relação ao nível anterior e alcance em 8 unidades; manter cadência da torre. Centralizar a fórmula e arredondamentos. Nível 3 é máximo, sem botão de melhoria adicional.

**Venda:** ressarcir `floor(0.6 × (custoBase + upgradesPagos))`. Impedir vender duas vezes, vender torre inexistente ou devolver valor superior ao investido.

### 6.2. Inimigos

| Inimigo | Vida inicial | Velocidade (unid./s) | Recompensa | Dano ao castelo |
| --- | ---: | ---: | ---: | ---: |
| Normal Slime | 32 | 16 | 10 | 1 |
| Goblin | 22 | 25 | 12 | 1 |
| Skeleton | 50 | 17 | 15 | 1 |
| Big Slime | 95 | 12 | 22 | 1 |
| King Slime (chefe) | 420 | 9 | 120 | 3 |

- Todo inimigo possui `id`, `type`, posição, `health/maxHealth`, velocidade base, progresso no caminho, estado de efeito e estado de animação.
- Ao chegar ao ponto final, reduzir vidas e remover inimigo **uma única vez**.
- Ao morrer, remover inimigo e conceder recompensa **uma única vez**.
- Inimigo morto não pode causar dano ao castelo, receber ataques novos nem bloquear o encerramento da onda.
- Mostrar barra de vida discreta após sofrer dano; chefe pode ter barra sempre visível.
- Ghost, Bat, Zombie e Demon ficam reservados para expansões posteriores, assim como Crossbow, Poison Wizard e Lightning Tower.

### 6.3. Plano das 10 ondas

Especificação inicial de composição; o `WaveSystem` pode programar grupos com intervalos de spawn diferentes.

| Onda | Composição | Objetivo |
| --- | --- | --- |
| 1 | 6 Normal Slimes | Aprender construção e alcance |
| 2 | 8 Normal Slimes | Exigir posicionamento eficiente |
| 3 | 6 Normal Slimes + 4 Goblins | Introduzir inimigos rápidos |
| 4 | 7 Goblins + 5 Normal Slimes | Testar priorização |
| 5 | 5 Skeletons + 6 Normal Slimes | Introduzir maior resistência |
| 6 | 6 Skeletons + 5 Goblins | Exigir evolução das torres |
| 7 | 4 Big Slimes + 8 Normal Slimes | Introduzir unidades com muita vida |
| 8 | 5 Big Slimes + 7 Goblins | Combinar tanques e velocidade |
| 9 | 6 Big Slimes + 6 Skeletons + 6 Goblins | Pico de intensidade |
| 10 | 1 King Slime + 6 Big Slimes + 8 Goblins | Chefe final |

**Spawn:** utilizar filas de eventos e intervalos configuráveis por grupo (ponto de partida: `0,8–1,3 s`). Evitar spawn simultâneo de todos os inimigos. Permitir ajustes para partidas dentro da duração desejada.

**Bônus ao finalizar uma onda:** proposta `20 + (5 × númeroDaOnda)` moedas, pago uma única vez. A 10ª onda encerra em vitória e pode dispensar um bônus sem utilidade; manter o comportamento coerente e documentado.

### 6.4. Regras de transição de onda

1. Nova partida começa em `preparing`, com **onda atual 0/10**, 20 vidas e 150 moedas.
2. O botão **Iniciar onda** avança para 1 e dá início ao primeiro grupo.
3. Durante `running`, não permitir iniciar outra onda.
4. Quando `pendingEnemies == 0`, todos os grupos da onda foram gerados **e** `activeEnemies == 0`, considerar a onda concluída; não finalizar cedo só porque o campo está vazio entre dois spawns.
5. Após as ondas 1–9, pagar bônus e retornar a `preparing`, permitindo ao jogador reorganizar sua defesa.
6. Após a onda 10, se restarem vidas, entrar em `victory`.
7. Se vidas chegarem a zero em qualquer momento, entrar imediatamente em `defeat`, cancelar geração pendente e impedir interações de combate.
8. Ao reiniciar, restaurar todos os valores iniciais e descartar entidades e timers anteriores sem duplicação de listeners/loops.

---

# 7. Etapas de execução

> **Orientação:** execute as etapas na ordem. Cada etapa entrega algo observável, verifica sua qualidade e deixa o projeto executável. Marque `- [x]` apenas após passar nos critérios de aceite.

## ETAPA 01 — Inicialização, estrutura e dependências

**Objetivo:** criar uma base Next.js limpa, com TypeScript, Tailwind, fonte Fredoka e assets acessíveis.

**Tarefas**

- [ ] Conferir se já existe projeto; se não existir, criar com App Router, TypeScript, ESLint, Tailwind e pasta `src/`.
- [ ] Configurar alias `@/*` apontando para `src/*`.
- [ ] Configurar importação da fonte `Fredoka` em `src/app/layout.tsx` com `next/font/google`, pesos necessários e fallback.
- [ ] Aplicar Fredoka globalmente, com normalização de CSS e tokens básicos de cores e espaçamentos.
- [ ] Extrair `Tiny-Defense-Assets-NextJS.zip` na raiz, se ainda não extraído.
- [ ] Conferir a existência de `public/assets/meta/sprite-manifest.json` e dos três PNGs das torres iniciais.
- [ ] Criar um módulo com constantes tipadas para caminhos de sprites principais.
- [ ] Criar a estrutura inicial de componentes e game, sem gerar arquivos vazios ou classes fictícias.
- [ ] Configurar scripts adequados para `dev`, `build`, `start`, `lint` e, quando instalados, `test` e `test:e2e`.
- [ ] Criar `README.md` mínimo com execução local e localização dos assets.

**Aceite**

- [ ] `npm install` e `npm run dev` funcionam em ambiente limpo.
- [ ] `npm run lint` e `npm run build` executam com sucesso.
- [ ] Fonte Fredoka aparece no navegador.
- [ ] URLs reais `/assets/...` das torres e UI carregam sem erro 404.
- [ ] Não há dependências de backend/serviços externos.

**Dependência:** nenhuma.

---

## ETAPA 02 — Design system, menu inicial e navegação

**Objetivo:** criar a identidade visual do jogo antes de iniciar a lógica de combate.

**Tarefas**

- [ ] Criar componentes reutilizáveis `PixelButton`, `PixelPanel` e `PixelIcon` com assets TravelBook.
- [ ] Configurar estados visualmente distintos de botão: padrão, foco, pressionado e desativado.
- [ ] Criar tela inicial (`/`) com título **Tiny Defense**, subtítulo curto, cenário decorativo com sprites reais e botões **Jogar**, **Como jogar** e **Créditos**.
- [ ] Criar diálogo/instruções explicando: inimigos, moedas, construção, upgrades, venda, ondas e vidas.
- [ ] Criar tela de créditos com atribuição da UI e aviso de licença pendente do gameplay quando pertinente.
- [ ] Configurar navegação `Jogar → /play` e retorno ao menu.
- [ ] Manter espaçamentos, tipografia e escala consistentes em mobile/desktop.
- [ ] Usar tags semânticas e controles acessíveis (`button`, foco visível e descrições quando necessárias).

**Aceite**

- [ ] Todas as ações do menu funcionam de verdade.
- [ ] Não há botões decorativos sem ação, imagens quebradas nem áreas de interface sobrepostas.
- [ ] Em `390×844` e `1366×768`, o menu é legível e navegável.
- [ ] Os créditos existem e apontam para a origem da UI.
- [ ] Build e lint passam.

**Dependência:** Etapa 01.

---

## ETAPA 03 — Cena de jogo, HUD e layout responsivo

**Objetivo:** montar a estrutura visual da partida, ainda sem combate completo.

**Tarefas**

- [ ] Criar `/play` com shell de jogo e área central de Canvas.
- [ ] Criar `GameHUD` com vidas, moedas, onda atual/total e indicadores visuais usando sprites reais.
- [ ] Criar `TowerSelector` mostrando Archer, Cannon e Ice Wizard com custo e estado disponível/indisponível.
- [ ] Criar área para `TowerDetails`, que será preenchida por dados reais em etapa futura.
- [ ] Criar `WaveControls` com Iniciar onda, Pausar/Retomar e Velocidade, mantendo apenas as ações já implementadas habilitadas.
- [ ] Definir disposição desktop com barra lateral e mobile com barra inferior.
- [ ] Fazer Canvas responsivo, mantendo proporção `320:192` e mapeamento preparado para mouse/toque.
- [ ] Estabelecer mensagens de feedback não intrusivas (falta de moedas, célula indisponível, etc.).
- [ ] Apresentar carregamento dos sprites até a cena estar pronta.

**Aceite**

- [ ] Layout não quebra em `390×844`, `768×1024` e `1366×768`.
- [ ] HUD visível sem cobrir o mapa.
- [ ] Botões possuem área adequada para toque.
- [ ] Não há controles falsamente funcionais: ações ainda indisponíveis ficam desativadas.
- [ ] Fonte, ícones, painéis e botões combinam com a identidade visual.

**Dependência:** Etapa 02.

---

## ETAPA 04 — Canvas, carregamento e renderização do mapa

**Objetivo:** trocar o Canvas vazio por um cenário funcional com tiles e decorações.

**Tarefas**

- [ ] Implementar `SpriteLoader` com cache, carregamento assíncrono e tratamento de falhas.
- [ ] Ler o manifesto de sprites do gameplay e tipar suas informações principais.
- [ ] Criar `GameRenderer` desacoplado da simulação.
- [ ] Definir dimensões lógicas (`20×12`, `16 px`) e tratamento correto do tamanho CSS e `devicePixelRatio`.
- [ ] Usar tiles recortados dos atlas `spr_tile_set_ground.png` e `spr_tile_set_stone.png`.
- [ ] Desenhar o caminho sugerido com curvas, continuidade visual e área de chegada.
- [ ] Posicionar o castelo verde na saída, sem cortes ou distorções.
- [ ] Renderizar árvores, pedras, cogumelos e grama com parcimônia, sem cobrir o caminho.
- [ ] Implementar tratamento de `resize` e transformação de coordenadas de pointer para mundo lógico.
- [ ] Implementar ordem de desenho adequada: terreno → caminho → decorações de fundo → unidades/torres → efeitos → elementos contextuais.

**Aceite**

- [ ] O mapa é renderizado **com PNGs reais**, sem uso de retângulos de cor como terreno definitivo.
- [ ] Não existem linhas de tile desconectadas nem caminhos visualmente diferentes dos lógicos.
- [ ] Pixel art permanece nítida e proporcional.
- [ ] O mapa cabe na tela sem deformação em desktop/mobile.
- [ ] Um teste manual de pointer identifica corretamente células de cantos e centro após redimensionar.
- [ ] Não há recarregamento das mesmas imagens a cada frame.

**Dependência:** Etapa 03.

---

## ETAPA 05 — Engine, estado da partida e movimentação de inimigos

**Objetivo:** permitir uma onda de teste com inimigos animados percorrendo todo o mapa.

**Tarefas**

- [ ] Implementar `GameEngine` com estado de partida, entidades e atualização por passo fixo.
- [ ] Implementar `PathSystem`, expandindo waypoints em células consecutivas e centros em coordenadas do mundo.
- [ ] Criar entidade `Enemy` com posição, movimento, progresso, vida, tipo e animação.
- [ ] Criar `SpriteAnimator` com recortes de spritesheets baseados no manifesto, incluindo suporte a 4 e 8 quadros.
- [ ] Usar Normal Slime como primeiro inimigo de teste.
- [ ] Fazer o inimigo entrar no primeiro waypoint, avançar pelos segmentos e desaparecer no castelo.
- [ ] Ao escapar, descontar a vida correspondente **apenas uma vez**.
- [ ] Integrar a engine ao Canvas por meio de controller/hook, com ciclo de montagem e desmontagem seguro.
- [ ] Implementar pausa/resume para a simulação e pausa automática ao ocultar a página.
- [ ] Criar testes unitários de caminho, avanço por delta e evento de chegada ao castelo.

**Aceite**

- [ ] Slime se move continuamente e acompanha corretamente todas as curvas.
- [ ] A animação do Slime reproduz frames válidos sem mostrar partes erradas do atlas.
- [ ] Pausar congela movimento e animação baseada na simulação; retomar não teleporta unidades.
- [ ] Chegada ao castelo reduz exatamente a quantidade esperada de vidas.
- [ ] Reiniciar/navegar não cria múltiplos loops.
- [ ] Testes relevantes, lint e build passam.

**Dependência:** Etapa 04.

---

## ETAPA 06 — Construção, seleção e economia

**Objetivo:** dar ao jogador controle sobre a posição e a aquisição das torres.

**Tarefas**

- [ ] Implementar configuração tipada das torres com nome, custo, sprite, dano, alcance e velocidade de ataque.
- [ ] Implementar `PlacementSystem` e ocupação da grade.
- [ ] Fazer os três cards de torre selecionarem o tipo a construir.
- [ ] Renderizar prévia da torre selecionada, marcação de posição válida/inválida e círculo de alcance.
- [ ] Construir ao clicar/tocar em célula válida; deduzir custo atomicamente da engine.
- [ ] Impedir construção no caminho, na área do castelo, sobre outra torre, em decoração bloqueada e sem moedas suficientes.
- [ ] Permitir cancelar modo de construção ou trocá-lo por outra torre.
- [ ] Clicar/tocar em torre existente seleciona-a em vez de criar outra.
- [ ] Integrar HUD de moedas à economia real; não manter valores duplicados em React.
- [ ] Mostrar feedback textual quando a construção for inválida.
- [ ] Criar testes para custos, ocupação, construção inválida e seleção.

**Aceite**

- [ ] Archer, Cannon e Ice Wizard aparecem com seus **sprites reais**, ancorados ao tile.
- [ ] Nenhum toque pode construir sobre caminho/castelo/torre existente.
- [ ] Ouro diminui exatamente uma vez após uma construção válida.
- [ ] Clique/touch inválido não altera ouro nem cria unidade.
- [ ] Construção e seleção funcionam em desktop e mobile, inclusive após `resize`.
- [ ] Testes, lint e build passam.

**Dependência:** Etapa 05.

---

## ETAPA 07 — Combate, projéteis e efeitos das três torres

**Objetivo:** tornar as torres efetivamente capazes de defender o mapa.

**Tarefas**

- [ ] Implementar `CombatSystem`: detecção de alvo dentro do raio, priorização por progresso e cooldown.
- [ ] Implementar entidade `Projectile` com posição, velocidade, alvo/destino e efeito na colisão.
- [ ] Renderizar os PNGs de projéteis associados a cada torre.
- [ ] Implementar Archer: dano individual e maior frequência de ataque.
- [ ] Implementar Cannon: intervalo mais lento, dano elevado e explosão em área.
- [ ] Implementar Ice Wizard: dano moderado e aplicação de slow com duração configurada.
- [ ] Implementar morte, remoção, barra de vida e recompensa em ouro por inimigo eliminado.
- [ ] Impedir dano e recompensa duplicados em mortes simultâneas por múltiplos projéteis.
- [ ] Ajustar ordem de eventos para não ocorrer ataque a inimigo que já escapou.
- [ ] Testar com múltiplos inimigos e múltiplas torres simultaneamente.
- [ ] Adicionar efeitos visuais discretos para acerto, explosão e gelo sem substituir sprites.

**Aceite**

- [ ] Archer causa dano em apenas um alvo por projétil.
- [ ] Cannon pode danificar mais de um inimigo na mesma explosão, uma vez por alvo.
- [ ] Ice reduz temporariamente a velocidade e o efeito expira corretamente.
- [ ] Inimigos morrem ao atingir 0 de HP e desaparecem.
- [ ] Mortes concedem recompensa exatamente uma vez; escapes não concedem recompensa.
- [ ] Sem erros no console com dezenas de projéteis/inimigos simultâneos.
- [ ] Testes de dano, área, slow, alvo e morte passam.

**Dependência:** Etapa 06.

---

## ETAPA 08 — Melhorias, venda e painel contextual

**Objetivo:** permitir que o jogador adapte sua estratégia sem precisar reconstruir toda a defesa.

**Tarefas**

- [ ] Completar `TowerDetails` com nome, tipo, nível, dano, intervalo, alcance e custo próximo upgrade.
- [ ] Implementar níveis 1–3, fórmulas de custo e evolução de atributos no motor.
- [ ] Atualizar atributos e círculo de alcance imediatamente após o upgrade.
- [ ] Bloquear upgrade sem moedas e quando já está no nível máximo.
- [ ] Implementar venda com reembolso calculado sobre o gasto histórico.
- [ ] Ao vender, remover torre da engine, liberar célula e desmarcar seleção com segurança.
- [ ] Criar confirmação simples de venda **se necessária para evitar toque acidental**, sem tornar o fluxo excessivamente lento.
- [ ] Impedir venda/upgrade enquanto o jogo estiver pausado ou encerrado.
- [ ] Criar testes de níveis, custos, reembolso e prevenção de exploração da economia.

**Aceite**

- [ ] Upgrade altera efetivamente o desempenho da torre, não apenas o número exibido.
- [ ] Nível 3 não permite nível 4.
- [ ] Venda devolve o valor correto, libera a célula e não pode ocorrer duas vezes.
- [ ] Botões indisponíveis exibem estado visual e justificativa.
- [ ] Operações mantêm ouro consistente em HUD e engine.
- [ ] Testes, lint e build passam.

**Dependência:** Etapa 07.

---

## ETAPA 09 — Ondas, progressão, chefe e fim de jogo

**Objetivo:** completar um ciclo inteiro de partida: preparar → defender → melhorar → vencer/perder.

**Tarefas**

- [ ] Implementar `WaveSystem` por meio da configuração `waves.ts`, com filas de spawn e grupos.
- [ ] Configurar as 10 ondas previstas na seção 6.3.
- [ ] Adicionar Goblin, Skeleton e Big Slime usando spritesheets reais e atributos próprios.
- [ ] Adicionar King Slime como chefe da onda 10.
- [ ] Fazer o botão **Iniciar onda** funcionar apenas em `preparing` e enquanto houver próxima onda.
- [ ] Tratar corretamente o intervalo entre spawns: nenhum término antecipado se ainda existem inimigos pendentes.
- [ ] Adicionar bônus de conclusão, exibindo feedback visual.
- [ ] Exibir onda atual e quantidade de inimigos ativos/pendentes (se útil para a interface).
- [ ] Ao zerar vidas: encerrar a simulação em derrota e abrir `GameOverDialog` com reiniciar/voltar ao menu.
- [ ] Ao limpar a onda 10 com vidas restantes: encerrar em vitória, com mensagem e reinício.
- [ ] Garantir que morte do chefe, morte dos últimos inimigos e derrota no mesmo frame não gerem estados contraditórios.
- [ ] Criar testes de transição das 10 ondas, vitória, derrota, bônus e fila vazia.

**Aceite**

- [ ] Uma partida pode ser jogada da onda 1 até a onda 10 sem qualquer operação no console.
- [ ] As cinco classes de inimigos têm comportamento e animação adequados.
- [ ] Próxima onda não pode começar antes da conclusão da atual.
- [ ] A onda nunca termina enquanto houver spawns pendentes.
- [ ] Vida `<= 0` sempre derrota; concluir a onda 10 com vidas `> 0` sempre vence.
- [ ] Reiniciar repõe valores e permite jogar outra partida completa.
- [ ] Testes, lint e build passam.

**Dependência:** Etapa 08.

---

## ETAPA 10 — Pausa, velocidade, acessibilidade e experiência mobile

**Objetivo:** consolidar a experiência para controles por toque e diferentes dispositivos.

**Tarefas**

- [ ] Conectar botões de pausa, retomar e `1×/2×` aos comandos reais do motor.
- [ ] Confirmar que velocidade multiplica simulação de movimento, geração de inimigos e cooldown sem mudar física relativa.
- [ ] Garantir que pausa não concede ouro nem faz avançar ondas.
- [ ] Revisar áreas de clique/toque, bordas do Canvas, seleção e feedback em smartphones.
- [ ] Evitar scroll horizontal e interferência de gestos do navegador na área de interação.
- [ ] Criar estado de foco visível e labels para botões importantes.
- [ ] Mostrar informações equivalentes no mobile, sem recursos exclusivos de hover.
- [ ] Revisar orientação retrato; sem exigir paisagem para jogar.
- [ ] Confirmar pausa ao ocultar aba/alternar aplicativo e retomada explícita.
- [ ] Reduzir re-renderizações React desnecessárias e evitar atualização do HUD a cada frame.
- [ ] Testar início/fim de partida após alternar muitas vezes entre 1×/2× e pause/resume.

**Aceite**

- [ ] Partida pode ser concluída em `390×844` usando apenas toque.
- [ ] Não há toque desalinhado no mapa após rotação/resize.
- [ ] Pausa congela toda a lógica; 2× acelera o jogo sem duplicar eventos.
- [ ] Não há controles fora da viewport ou botões inacessíveis.
- [ ] Teclado navega pelos menus e ações de interface; construção permanece possível por pointer/touch.
- [ ] Testes, lint e build passam.

**Dependência:** Etapa 09.

---

## ETAPA 11 — Persistência, polimento, teste completo e entrega

**Objetivo:** preparar o MVP para uso contínuo local e para publicação quando as licenças estiverem resolvidas.

**Tarefas**

- [ ] Implementar armazenamento local versionado para recordes e preferências, com `try/catch` e valores padrão.
- [ ] Salvar pelo menos: maior onda alcançada, vitórias, derrotas e preferência de velocidade (caso faça sentido).
- [ ] Não prometer retomada de partida em andamento: **essa funcionalidade está fora do MVP**.
- [ ] Criar uma seção simples de recordes/estatísticas no menu inicial ou no resultado.
- [ ] Adicionar feedback visual em construção válida, compra inválida, melhoria, morte, escape e resultado, sem poluir a tela.
- [ ] Implementar áudio somente se houver assets apropriados ou geração Web Audio simples; se não for feito, remover qualquer botão de som inoperante.
- [ ] Revisar o carregamento de imagens, erros de assets e comportamento offline após carregar a página.
- [ ] Revisar a seção de créditos e pendências de licenciamento.
- [ ] Executar lint, build, suíte de testes, teste manual desktop/mobile e uma partida completa.
- [ ] Identificar problemas de balanceamento: dificuldade, excesso/falta de ouro, viabilidade de torres e duração da partida.
- [ ] Ajustar números em `balance.ts` e `waves.ts` sem alterar a arquitetura.
- [ ] Atualizar `README.md` com instalação, execução, comandos, mecânicas e créditos.
- [ ] Garantir que o deploy como app Next.js estático/sem backend próprio seja viável, desde que a configuração do projeto seja compatível.

**Aceite**

- [ ] Testes, lint e build passam em ambiente limpo.
- [ ] Uma partida completa termina sem erro e pode ser repetida.
- [ ] Recordes e preferências persistem após atualização da página.
- [ ] Dispositivos alvo exibem jogo e controles adequadamente.
- [ ] Créditos presentes; pendência de licença do gameplay devidamente sinalizada antes de publicação.
- [ ] README e ROADMAP refletem o estado real do projeto.

**Dependência:** Etapa 10.

---

## 8. Estratégia mínima de testes

### 8.1. Ferramentas sugeridas

- **Vitest**: testes unitários da simulação, especialmente por ela ser TypeScript puro.
- **Playwright**: fluxos críticos de navegação, carregamento de assets e interações básicas em viewports desktop e mobile.
- **ESLint + TypeScript + `next build`**: verificação estática e de integração de build.

Adicionar ferramentas conforme a etapa pedir; priorizar testes de regras de negócio que podem rodar sem navegador.

### 8.2. Casos de teste obrigatórios

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| T01 | Construir Archer com ouro suficiente | Torre criada e ouro reduzido em 50 |
| T02 | Construir torre sem ouro suficiente | Não cria, não altera ouro |
| T03 | Construir em tile do caminho | Rejeita sem alterar estado |
| T04 | Construir sobre torre existente | Rejeita sem alterar estado |
| T05 | Eliminar um inimigo | Recompensa paga uma única vez |
| T06 | Inimigo chega ao castelo | Vida reduzida uma única vez |
| T07 | Canhão explode com 3 inimigos no raio | Cada inimigo sofre um acerto da explosão |
| T08 | Dois efeitos de gelo no mesmo inimigo | Sem acúmulo indevido de lentidão; duração atualizada |
| T09 | Pausar jogo durante movimento | Posições e cooldowns mantidos durante pausa |
| T10 | Alternar velocidade para 2× | Movimento e timers aceleram proporcionalmente |
| T11 | Último inimigo morre enquanto há spawn pendente | Onda continua, sem bônus antecipado |
| T12 | Concluir onda 1 | Bônus uma vez; habilita onda 2 |
| T13 | Vender torre nível 2 | Reembolso correto e tile livre |
| T14 | Melhorar torre nível 3 | Bloqueia upgrade; não gasta ouro |
| T15 | Vidas chegam a zero | Derrota, spawns e combate interrompidos |
| T16 | Limpar onda 10 com vidas restantes | Vitória, sem iniciar onda 11 |
| T17 | Reiniciar depois de vitória ou derrota | Estado inicial limpo, sem RAF/listeners duplicados |
| T18 | Clicar/tocar após resize | Seleção corresponde à célula visual |
| T19 | Carregar jogo com storage inválido | Usa valores padrão sem travar |
| T20 | Abrir `/` e `/play` em mobile | Sem overflow ou controles inacessíveis |

### 8.3. Teste manual de partida completa

Execute ao menos estes percursos após a Etapa 09:

1. Partida focada em Archer; medir se dá para sobreviver às primeiras ondas.
2. Partida utilizando Cannon + Ice; verificar se efeitos táticos são percebidos.
3. Partida com construção, upgrade e venda; conferir economia.
4. Partida deixando alguns inimigos escapar; conferir danos ao castelo e derrota.
5. Partida até King Slime; confirmar possibilidade realista de vitória com decisões razoáveis.
6. Partida em mobile, com toque, pausa, retomada e rotação de tela.

Se a vitória for impossível ou trivial, ajustar balanceamento mantendo as identidades das torres e a quantidade de ondas.

---

## 9. Qualidade, desempenho e prevenção de bugs

**Requisitos técnicos:**

- TypeScript com tipos explícitos nos contratos principais; evitar `any` nos componentes e sistemas críticos.
- Não importar `window`, `document`, `Image` ou `localStorage` em código executado no servidor sem proteção; Canvas e engine integrada ao navegador devem ficar em componentes client apropriados.
- Não utilizar `setInterval` para um segundo sistema independente de movimento/spawn; todos os timers de gameplay devem acompanhar a simulação.
- Não criar `Image()` e não recalcular tiles estáticos dentro de loops desnecessários de frame.
- Usar o manifesto para recorte e animação, sem assumir tamanho único de sprite.
- Evitar alocar objetos pesados no caminho quente de atualização/renderização.
- Manter tempo de simulação separado de tempo de UI e do relógio real.
- Cuidar das referências de alvos removidos, operações de arrays e possíveis atualizações duplas.
- Definir precedência de estados de vitória/derrota e idempotência dos eventos (morte, escape, bônus, venda).
- Em caso de perda de contexto do Canvas, permitir reconstrução ou oferecer mensagem clara de erro.
- Usar sprites reais em toda a experiência; bordas/círculos/partículas programáticos podem servir apenas como indicadores/efeitos auxiliares.
- Não esconder regras cruciais somente por cores (verde/vermelho), incluir texto ou ícone quando necessário.

**Critério geral de desempenho:** jogabilidade fluida em navegador moderno, sem queda sustentada de FPS em ondas comuns. Use profiling apenas se necessário; não otimizar prematuramente sacrificando clareza do código.

---

## 10. Mapa de dependências

```text
01 Fundação e assets
   ↓
02 Design system e menu
   ↓
03 HUD e layout responsivo
   ↓
04 Canvas e mapa
   ↓
05 Engine e inimigos
   ↓
06 Construção e economia
   ↓
07 Combate e efeitos
   ↓
08 Upgrades e venda
   ↓
09 Dez ondas e fim de jogo
   ↓
10 Pausa/velocidade/mobile
   ↓
11 Persistência e polimento
```

**Marcos principais:**

- **M1 — Fundação visual:** Etapas 01–04: menu e mapa utilizáveis com os assets reais.
- **M2 — Protótipo jogável:** Etapas 05–07: inimigos andam, torres são construídas e combatem.
- **M3 — Jogo completo:** Etapas 08–09: progressão, 10 ondas e conclusão da partida.
- **M4 — MVP pronto:** Etapas 10–11: experiência mobile, qualidade e persistência.

---

## 11. Ideias para depois do MVP (não implementar agora)

| Prioridade futura | Evolução | Observações |
| --- | --- | --- |
| P1 | Crossbow Tower | Dano elevado de alvo único e ataque lento |
| P1 | Poison Wizard | Dano ao longo do tempo |
| P1 | Lightning Tower | Dano em cadeia entre inimigos próximos |
| P1 | Bat, Ghost, Zombie e Demon | Novas características táticas, evitando tornar unidades injustas |
| P1 | Seleção de mapas | Novos percursos construídos com os tiles fornecidos |
| P2 | Sistema de estrelas | Avaliar conclusão por vidas restantes e desempenho |
| P2 | Missões diárias locais | Objetivos sem necessidade de servidor |
| P2 | Modos infinito/desafio | Ondas escalonadas, recordes e replay |
| P2 | Efeitos sonoros/música | Apenas com recursos licenciados ou criação própria |
| P3 | Progressão persistente | Desbloqueio gradual de mapas e torres |
| P3 | PWA/offline | Instalação no celular e experiência offline mais robusta |

Esses itens **não devem atrasar o MVP** e não devem ser iniciados automaticamente após a Etapa 11 sem nova definição de prioridade.

---

## 12. Checklist final de pronto para entrega

- [ ] Menu e gameplay com identidade Tiny Defense e fonte Fredoka.
- [ ] Assets reais do usuário carregando corretamente.
- [ ] Caminho 20×12, cenário e castelo renderizados sem distorções.
- [ ] Inimigos percorrem caminho e atacam o castelo por escape.
- [ ] Três torres funcionais: Archer, Cannon e Ice Wizard.
- [ ] Sistema de dano, slow, explosão e recompensas correto.
- [ ] Construção, melhoria até nível 3 e venda sem inconsistências.
- [ ] Dez ondas configuradas e um chefe final.
- [ ] Pausa, retomada, 1×/2×, vitória, derrota e reinício.
- [ ] HUD consistente e controles desktop/mobile.
- [ ] Recordes/configurações locais persistidos.
- [ ] Testes e build aprovados.
- [ ] README e créditos revisados.
- [ ] Licença do pacote de gameplay **verificada antes da publicação**.

---

## 13. Como solicitar a execução de uma etapa ao Codex

Copie esta instrução quando for iniciar ou retomar o trabalho com o agente:

> **Leia integralmente o arquivo `ROADMAP.md` na raiz do projeto. Analise o código existente, identifique a primeira etapa que ainda não está concluída e implemente exclusivamente as tarefas dessa etapa, usando os assets reais disponíveis em `public/assets`. Respeite a arquitetura e as especificações do documento; não antecipe funcionalidades de etapas posteriores. Ao terminar, execute os testes, lint e build disponíveis, corrija os problemas, atualize os checkboxes da etapa no `ROADMAP.md` e entregue um resumo dos arquivos alterados, funcionalidades implementadas, validações, pendências e próxima etapa. Se faltar algum recurso, registre a limitação e implemente a melhor solução viável sem inventar assets ou alterar silenciosamente o escopo.**

**Sugestão operacional:** faça **um commit por etapa concluída**, com mensagem no formato `feat(tiny-defense): etapa-XX descricao`. Se uma etapa demandar múltiplos commits, mantenha-os agrupados e rastreáveis.

---

## 14. Registro de andamento (o agente deve manter atualizado)

| Etapa | Status | Observações |
| --- | --- | --- |
| 01 — Fundação | Pendente | — |
| 02 — Design system e menu | Pendente | — |
| 03 — HUD responsivo | Pendente | — |
| 04 — Canvas e mapa | Pendente | — |
| 05 — Engine e movimento | Pendente | — |
| 06 — Construção e economia | Pendente | — |
| 07 — Combate | Pendente | — |
| 08 — Upgrades e venda | Pendente | — |
| 09 — Ondas e chefe | Pendente | — |
| 10 — Mobile e controles | Pendente | — |
| 11 — Persistência e entrega | Pendente | — |

**Ponto de retomada atual:** Etapa 01 — Inicialização, estrutura e dependências.

