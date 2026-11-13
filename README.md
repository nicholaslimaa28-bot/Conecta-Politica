# Conecta Política

[![Testes](https://github.com/nicholaslimaa28-bot/Conecta-Politica/actions/workflows/testes.yml/badge.svg)](https://github.com/nicholaslimaa28-bot/Conecta-Politica/actions/workflows/testes.yml)
[![Coleta](https://github.com/nicholaslimaa28-bot/Conecta-Politica/actions/workflows/coleta.yml/badge.svg)](https://github.com/nicholaslimaa28-bot/Conecta-Politica/actions/workflows/coleta.yml)

**🌐 No ar: https://conecta-politica.vercel.app** · estado das coletas em [/status](https://conecta-politica.vercel.app/status)

Site de transparência que reúne, em linguagem simples, o que acontece hoje nos três Poderes — Câmara, Senado, Congresso e Presidência —, com fonte e horário em cada dado. A especificação completa está em [`SPEC.md`](SPEC.md); o relatório de cada fonte oficial, em [`docs/fontes.md`](docs/fontes.md).

> Site independente, sem vínculo com os órgãos oficiais. Todos os dados vêm de fontes públicas oficiais, com link para a origem.

## Estado atual

| Funcionalidade | Situação |
|---|---|
| Home "Hoje": plenários e comissões do dia, status, pauta resumida, botão "assistir" | ✅ |
| Votações recentes com placar e orientação das bancadas | ✅ |
| Próximos 7 dias nos Plenários | ✅ |
| Página do parlamentar: presença, votos nominais (com orientação do partido), proposições, gastos, agenda | ✅ |
| Páginas de sessão, votação (voto a voto) e proposição (situação nas duas Casas, tramitação na Câmara) | ✅ |
| Busca unificada (nome com erro de digitação/sem acento, número "PL 2475/2025", tema) | ✅ |
| `/status`, Metodologia, Fontes e licenças, Glossário, Reportar erro | ✅ |
| Executivo: agenda do Presidente (com fuso em viagens), leis, vetos e MPs | ✅ Fase 2A e 2B |
| Executivo: Diário Oficial (INLABS) | Fase 2C — aguarda o INLABS e o cadastro |
| Judiciário (STF, DataJud) | Fase 3 — card com links oficiais |
| Alertas: seguir parlamentar/proposição e receber notificação no celular (Web Push, sem cadastro) | ✅ Fase 4A |
| Resumo "Brasília Hoje" (7h e 20h), com aviso opcional no celular | ✅ |
| Prévia para WhatsApp/redes (imagens Open Graph) e botão Compartilhar | ✅ |
| Aviso ao administrador quando uma coleta falha 3 vezes seguidas | ✅ |
| Alertas por e-mail e Telegram | Fases 4B–4C |

## Arquitetura

- **Web:** Next.js 16 (App Router) + TypeScript + Tailwind 4, renderizado no servidor com revalidação (ISR).
- **Banco:** PostgreSQL com Drizzle (esquema em `lib/db/schema.ts`, migrações em `db/migracoes`). Busca com `pg_trgm` + full-text em português com `unaccent` (`db/extra.sql`).
- **Coletores** (`collectors/`): um por fonte, separados em **normalizadores** (funções puras, testadas com amostras reais de `fixtures/`) e **coletores** (buscam → guardam o bruto → normalizam → gravam → registram a execução em `coleta`). Mudanças de status, novas votações e novos eventos são registradas em `mudanca`, que vai alimentar os alertas da Fase 4.
- **Agendamento:** GitHub Actions (`.github/workflows/coleta.yml`).

```
app/               páginas (home, parlamentar, proposicao, sessao, votacao, busca, status…)
components/        componentes de interface
lib/               banco, consultas, glossário, utilidades de data/texto
collectors/        http.ts (UA, ritmo, retry, bruto), comum.ts (gravação), camara/, senado/, planalto/, congresso/, cli.ts
fixtures/          amostras reais das fontes, usadas nos testes
docs/              fontes.md (relatório das fontes) e esquema-banco.md
```

## Alertas (Web Push)

- O visitante toca em **🔔 Seguir** na página de um parlamentar ou proposição; o navegador gera uma assinatura de push, que é o único dado guardado (sem nome, e-mail ou telefone).
- A tarefa `alertas:enviar` roda ao fim de cada coleta: lê as mudanças novas (`mudanca`), descobre quem segue cada item afetado e envia avisos criptografados (`aes128gcm`, assinados com VAPID). Mudanças com mais de 48 h não geram aviso; assinaturas expiradas (HTTP 404/410) são apagadas.
- Só aceitamos endpoints dos serviços de push dos navegadores (Google, Mozilla, Apple, Microsoft).
- Chaves: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (Vercel e variável do GitHub) e `VAPID_PRIVATE_KEY` (**apenas** secret do GitHub — o site não precisa dela). Gerar com `npx web-push generate-vapid-keys`.
- No iPhone, as notificações exigem o site adicionado à Tela de Início (iOS 16.4+).
- **Avisos de falha ao administrador:** quando uma fonte acumula 3 falhas seguidas, é registrada a mudança `fonte_falhou` (e `fonte_recuperada` quando volta); o disparador envia para quem se inscreveu em `/admin/alertas` com o código `ADMIN_ALERTAS_CODIGO` (variável secreta na Vercel).

## Rodando localmente

Requisitos: Node 22+ e PostgreSQL 16 com as extensões `pg_trgm` e `unaccent` (vêm no pacote `postgresql-contrib`).

```bash
cp .env.example .env           # ajuste DATABASE_URL e COLETOR_EMAIL_CONTATO
npm install
npm run db:migrate             # cria as tabelas, extensões e índices
npm run coletar -- inicial     # primeira carga (cadastros, agenda, votações, despesas, presença, autoria) — ~40 min
npm run dev                    # http://localhost:3000
npm test                       # testes dos normalizadores
```

> Atrás de um proxy HTTP (como em alguns ambientes de nuvem), o `fetch` do Node só usa o `HTTPS_PROXY` com `NODE_USE_ENV_PROXY=1`.

### Tarefas de coleta

| Comando | O que faz | Frequência sugerida |
|---|---|---|
| `npm run coletar -- frequente` | agenda (ontem até +7 dias) e votações (últimos 3 dias) da Câmara e do Senado | a cada 10–15 min em dias de sessão, 8h–23h; senão 1×/hora |
| `npm run coletar -- diaria` | cadastros, licenças, despesas, presença (Câmara), autoria, tramitações recentes | 1×/dia de madrugada |
| `npm run coletar -- camara:votacoes 2026-05-01 2026-05-31` | tarefa avulsa com período (para carga histórica) | sob demanda |

Execute sem argumentos para ver todas as tarefas.

## Publicação (custo zero para começar)

1. **Banco:** crie um Postgres no [Neon](https://neon.tech) ou no [Supabase](https://supabase.com) (planos gratuitos). Ambos têm `pg_trgm` e `unaccent`.
2. **Coletores:** no GitHub, cadastre o secret `DATABASE_URL` (e `COLETOR_EMAIL_CONTATO`) e a variável `SITE_URL`. Rode o workflow "Coleta" manualmente com `inicial` uma vez.
   - Em repositório **privado**, a coleta a cada 15 min gasta mais que os 2.000 minutos mensais gratuitos do Actions. Nesse caso, torne o repositório público (Actions é gratuito sem limite em repositórios públicos) ou reduza a frequência.
3. **Site:** importe o repositório na [Vercel](https://vercel.com) (plano Hobby) com `DATABASE_URL` e `SITE_URL`.

## Princípios (resumo)

Neutralidade (sem ranking, sem adjetivos, sem cores de partido) · toda informação com fonte e horário · nunca estimar dado que falta · contexto em números sensíveis (presença com justificativa) · linguagem simples (glossário) · mobile first. Detalhes de cálculo na página `/metodologia`.

## Contribuindo

Encontrou um dado diferente da fonte oficial? Use o formulário [Reportar erro](https://conecta-politica.vercel.app/reportar-erro) ou abra uma *issue*. Antes de mudar um normalizador, adicione uma amostra real em `fixtures/` e um teste.

## Notas de manutenção

- `npm audit` aponta 4 alertas moderados no `esbuild` antigo usado internamente pelo `drizzle-kit`, ferramenta só de desenvolvimento (geração de migrações). Não afeta o site nem os coletores; a "correção" automática rebaixaria o `drizzle-kit` e quebraria o projeto. Acompanhar novas versões do `drizzle-kit`.
- Na primeira carga, a autoria (proposições desde 2023) é a etapa mais lenta; depois ela passa a buscar só os últimos 30 dias.
