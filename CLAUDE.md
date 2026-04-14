# CLAUDE.md

Este arquivo orienta o Claude Code ao trabalhar com o código deste repositório.

> **Idioma:** Sempre converse comigo em **português brasileiro**. Respostas, explicações, comentários de código e sugestões devem ser em pt-BR.

---

## Visão Geral do Projeto

**Extreme Competition** é uma plataforma web voltada para atletas e entusiastas de esportes radicais e competições. Funciona de forma similar ao Sympla: usuários podem descobrir eventos, maratonas e campeonatos, e comprar ingressos diretamente pelo site.

### Funcionalidades planejadas

- **Hoje:** Landing page de marketing com listagem de eventos, atletas em destaque e compra de ingressos.
- **Futuro próximo:** Sistema de ranking de atletas — os mais bem colocados serão exibidos em destaque na landing page.
- **Futuro:** Perfis de atletas, histórico de participações, sistema de pontuação por evento.

---

## Comandos

```bash
npm run dev       # Inicia o servidor de desenvolvimento (Vite)
npm run build     # Checa tipos + build de produção (tsc -b && vite build)
npm run lint      # ESLint
npm run preview   # Pré-visualiza o build de produção localmente
```

---

## Arquitetura

Este é um **site de marketing single-page** para a Extreme Competition. Foi derivado do template "AirLens" e reaproveitado com novas seções e conteúdo em pt-BR.

### Princípios gerais de arquitetura

- **Separação de responsabilidades:** lógica de negócio, apresentação e configuração ficam em camadas distintas.
- **Configuração centralizada:** todo conteúdo editorial vem de `src/config.ts`. Nenhuma seção deve ter strings ou dados hardcoded fora desse arquivo.
- **Componentes autocontidos:** cada seção em `src/sections/` conhece apenas o contrato do `config.ts` e os utilitários de `src/lib/utils.ts`. Nunca importe uma seção dentro de outra.
- **Progressividade:** o sistema de ranking já deve ser previsto na arquitetura mesmo que ainda não esteja ativo — use feature flags no `config.ts` para habilitar/desabilitar seções futuras.

### Renderização orientada a configuração

**`src/config.ts` é a única fonte de verdade para todo o conteúdo.** Cada seção lê de um objeto de configuração tipado exportado desse arquivo. Seções retornam `null` quando a config está vazia (sem `title` + sem itens no array), então adicionar ou remover conteúdo exige apenas editar `config.ts`.

### Composição de seções

`App.tsx` compõe a página como uma pilha linear de componentes de seção, na ordem de renderização:

```
Hero → Stats → Events → Athletes → Rankings → Store → Companies → Testimonials → FAQ → Footer
```

Cada seção vive em `src/sections/`. São autocontidas e importam apenas de `src/config.ts` e `src/lib/utils.ts`.

### Sistema de animações

Dois sistemas trabalham em conjunto:

- **GSAP + ScrollTrigger** → animações guiadas por scroll (clip-path reveals, parallax, contadores, entradas escalonadas)
- **Lenis** → scroll suave

A conexão é estabelecida uma única vez em `src/hooks/useLenis.ts`, que conecta `lenis.on('scroll', ScrollTrigger.update)` e `gsap.ticker.add(lenis.raf)`. Este hook é chamado uma vez na raiz do `App.tsx`.

**Regra obrigatória:** todas as animações GSAP por seção devem ser criadas dentro de `useEffect` com cleanup adequado (`gsap.killTweensOf`, `ScrollTrigger.kill`) para evitar vazamentos no hot reload.

### Mapeamento de ícones

Ícones de serviços e rodapé usam o padrão `string → LucideIcon` dentro do componente consumidor.

Valores válidos de `iconName`:
- **Serviços:** `"Camera"`, `"Diamond"`, `"Users"`, `"Sparkles"`, `"Trophy"`, `"Medal"`, `"Timer"`, `"Flag"`
- **Redes sociais (rodapé):** `"Instagram"`, `"Twitter"`, `"Linkedin"`, `"Mail"`, `"Youtube"`

### Alias de caminho

`@` resolve para `src/` (configurado em `vite.config.ts`).

### Imagens

Todas as imagens são servidas de `public/`. A imagem do hero **deve ser um PNG com fundo transparente** — ela é posicionada em camadas entre o texto de fundo e os elementos de sobreposição, portanto um fundo sólido quebrará o design.

---

## Design System

### Identidade visual

A Extreme Competition tem uma identidade **raw, intensa e atlética** — sem espaço para visual corporativo genérico. O design deve transmitir adrenalina, competição e superação.

### Tokens de design

| Token | Valor | Uso |
|---|---|---|
| `--bg-dark` | `#0A0A0A` | Raiz do app |
| `--bg-section-dark` | `#0d1310` | Seções escuras |
| `--bg-light` | `#f4f4f4` | Seções claras (alternadas) |
| `--accent` | `#00FF87` | Verde neon — destaques, CTAs, rankings |
| `--accent-fire` | `#FF4D00` | Laranja fogo — urgência, contagens regressivas |
| `--text-primary` | `#FFFFFF` | Texto principal em fundo escuro |
| `--text-muted` | `#888888` | Texto secundário |

### Tipografia

| Papel | Fonte | Uso |
|---|---|---|
| Headings | **Manrope** | Títulos de seção, nomes de eventos |
| Accents | **Playfair Display** (itálico) | Frases de impacto, subtítulos em destaque |
| Body | **DM Sans** | Texto corrido, labels, descrições |

**Regras tipográficas:**
- Títulos principais usam `font-weight: 800` com `letter-spacing` negativo para impacto
- Nunca usar Arial, Roboto, Inter ou fontes genéricas de sistema
- Números de ranking e estatísticas podem usar uma fonte monoespaçada para enfatizar precisão

### Layout

- Container máximo: `max-w-7xl`
- Seções **alternam entre fundo escuro e claro** para ritmo visual
- Grid assimétrico é preferido a layouts centrados e simétricos
- Elementos que "quebram o grid" (imagens que sangram para fora do container, textos gigantes de fundo) são encorajados

### Filosofia de design

- **Sem visual genérico de IA:** nada de gradientes roxos, cards arredondados com sombra suave, ou layouts de 3 colunas iguais.
- **Assimetria intencional:** composições que guiam o olho e surpreendem.
- **Densidade controlada:** seções de impacto são densas e vibrantes; seções de conteúdo respiram.
- **Animações com propósito:** cada animação deve reforçar a sensação de velocidade e competição, não apenas "ser bonito".

---

## Sistema de Ranking (Funcionalidade Futura)

O sistema de ranking é uma feature central da plataforma. Ao implementar, siga estas diretrizes:

### Estrutura de dados prevista

```typescript
// src/config.ts — estrutura de ranking (feature flag)
rankings: {
  enabled: boolean; // false até o sistema estar pronto
  title: string;
  subtitle: string;
  athletes: Array<{
    id: string;
    name: string;
    sport: string;
    points: number;
    position: number;
    photoUrl: string;
    city: string;
    state: string;
    eventsParticipated: number;
    badge?: "ouro" | "prata" | "bronze";
  }>;
}
```

### Regras de exibição na landing page

- **Top 3** ficam em destaque visual máximo (foto grande, badge, pontuação animada)
- **Posições 4–10** ficam em lista secundária
- A seção Rankings só renderiza se `config.rankings.enabled === true`
- A posição no ranking é calculada pelo backend — o frontend apenas exibe

### Considerações de UX para rankings

- Contadores animados para pontuação (já suportado pelo sistema GSAP existente)
- Indicador visual de subida/descida no ranking (setas, cores)
- Perfil do atleta deve ser acessível via modal ou página dedicada (`/atletas/:id`)

---

## Fluxo de Compra de Ingressos

A plataforma funciona como um marketplace de ingressos para eventos esportivos. Ao trabalhar em features relacionadas:

### Tipos de evento suportados

- **Maratonas** — corridas de rua, trail, ultramaratonas
- **Campeonatos** — torneios por modalidade (crossfit, natação, ciclismo, etc.)
- **Eventos abertos** — desafios, corridas de obstáculos, eventos recreativos

### Estrutura de dados de evento

```typescript
events: Array<{
  id: string;
  title: string;
  sport: string;
  date: string;         // ISO 8601
  location: string;
  city: string;
  state: string;
  price: number;        // em centavos (BRL)
  capacity: number;
  enrolled: number;
  imageUrl: string;
  status: "aberto" | "encerrado" | "esgotado" | "em_breve";
  rankingPoints?: number; // pontos que o evento concede ao ranking
}>
```

### Regras de negócio de ingressos

- Preços sempre em **BRL (centavos)** internamente, formatados como `R$ X,XX` na UI
- Status `"esgotado"` desabilita o botão de compra e exibe contador de fila de espera
- Status `"em_breve"` exibe botão de notificação em vez de compra
- A compra em si será integrada a um gateway externo — o frontend só deve preparar o fluxo de checkout

---

## Convenções de Código

### Nomenclatura

- **Componentes:** PascalCase (`EventCard`, `RankingTable`)
- **Hooks:** camelCase com prefixo `use` (`useRankings`, `useEventFilter`)
- **Utilitários:** camelCase (`formatCurrency`, `getEventStatus`)
- **Constantes de config:** camelCase no objeto, UPPER_SNAKE_CASE para constantes globais
- **Arquivos de seção:** PascalCase (`Hero.tsx`, `Rankings.tsx`)

### Estrutura de pastas

```
src/
├── config.ts          # Fonte única de verdade para conteúdo
├── App.tsx            # Composição de seções
├── sections/          # Componentes de seção (um arquivo por seção)
├── components/        # Componentes reutilizáveis (cards, botões, badges)
├── hooks/             # Custom hooks (useLenis, useRankings, etc.)
├── lib/
│   └── utils.ts       # Funções utilitárias puras
└── types/             # Tipos TypeScript compartilhados
```

### TypeScript

- Sem `any` — use tipos explícitos ou `unknown` com narrowing
- Tipos de config exportados de `src/types/` e importados em `config.ts`
- Props de componentes sempre tipadas com interface dedicada

### Acessibilidade

- Imagens sempre com `alt` descritivo
- Botões com `aria-label` quando o texto não é suficiente
- Contraste mínimo de 4.5:1 para texto em fundos escuros

---

## Checklist antes de cada commit

- [ ] Conteúdo novo adicionado apenas via `src/config.ts`
- [ ] Animações GSAP têm cleanup no `useEffect`
- [ ] Nenhum dado hardcoded fora do config
- [ ] Sem `console.log` esquecidos
- [ ] `npm run lint` passa sem erros
- [ ] `npm run build` conclui sem erros de tipo
- [ ] Design segue os tokens e a identidade visual definidos acima