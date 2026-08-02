# Lot 6c-c/5 — consent banner and a real privacy policy

Sits on top of `.batuta/brief-6cc-landing.md` — the honesty rules, the `.lw-*` cut criterion,
the conventions, the gates, the evidence contract and the boundaries in it apply unchanged.
Read it first, in full.

## Goal

Two deliverables that only make sense together:

1. A **privacy policy page** at `/[lang]/privacy`, bilingual, describing what this site
   actually does.
2. The **`CookieBanner`** wired into the landing, with its choice stored, readable, and
   positioned to gate analytics that does not exist yet.

**The copy below is final**, in both locales, same arrangement as lot 4: transcribe it, do not
paraphrase, do not translate one locale from the other.

## Context you need before writing a line

Analytics (OpenPanel) is planned as the **next** piece of work, not this one. That is why the
banner exists at all: without it, the consent decision would arrive after the tracking, which
is backwards. So this lot builds the decision and the place it will be read — and **ships zero
analytics**.

Do not add OpenPanel. Do not add any script tag, any pixel, any third-party request. If you
find yourself about to name a provider anywhere in the code or the copy, stop — naming it
before it exists is the same overclaim this whole phase has been removing.

### `CookieBanner` already stores the decision

Read `packages/react/src/cookie-banner/cookie-banner.tsx`. It persists `'all'` or
`'essentials'` under `storageKey` and stays hidden once a value is present. **Do not build a
second store.** The site needs one reader over that same key.

Props: `storageKey`, `policyHref`, `onAccept`, `onEssentials`, `essentialsLabel`,
`acceptLabel`, plus `children` for the body text.

Use `storageKey="lyra-site-consent"` — distinct from `lyra-site-theme`.

## What to build

### `apps/site/lib/consent.ts`

The single reader. Export something equivalent to:

- `readConsent(): 'all' | 'essentials' | null` — reads the same key the banner writes,
  SSR-safe (returns `null` when there is no `window`), never throws when storage is blocked.
- `mayLoadAnalytics(): boolean` — true only when the stored value is exactly `'all'`.

`mayLoadAnalytics` is the contract the analytics work will call. Being a function rather than
a stored boolean matters: a reader that re-reads cannot go stale after the visitor changes
their mind.

### The mount point

In `apps/site/app/[lang]/layout.tsx`, mount the banner, and mark — **in a comment, not with an
empty component** — the single place where analytics will initialise, stating that it must be
guarded by `mayLoadAnalytics()`. A component that renders nothing is dead code; a comment at
the exact insertion point is not.

### The banner copy

Body EN:
`This site keeps your theme choice in your browser. You can also allow anonymous usage analytics, which would only ever tell us which pages help people. Neither is needed to read anything here.`

Body pt-BR:
`Este site guarda sua escolha de tema no seu navegador. Você também pode permitir métricas de uso anônimas, que serviriam apenas para saber quais páginas ajudam. Nenhuma das duas é necessária para ler nada aqui.`

- `acceptLabel`: `Allow analytics` / `Permitir métricas`
- `essentialsLabel`: `Only essentials` / `Apenas o essencial`
- `policyHref`: the privacy route for the current locale.

Note the conditional tense — "would only ever tell us". It is accurate today, when nothing is
collected, and stays accurate the day analytics is added. Keep it.

## The privacy page

A normal page under `app/[lang]/privacy/page.tsx`, using the same chrome as the landing
(header, footer) and `.lyra-prose` for the body, like the docs. One `<h1>`.

It must be reachable: link it from the footer in both locales, and from the banner.

### The copy — English

Title: `Privacy`
Last updated line: `Last updated: 1 August 2026`

**Who is responsible.** `Lyra DS is maintained by Francisross Soares de Oliveira. For anything on this page, write to security@francisross.com.br, or open a thread in GitHub Discussions if your question does not need to be private.`

**What this site stores.** `Two values, both in your own browser, both readable only by this site: your light or dark theme choice, and the answer you gave the consent banner. Neither is a cookie, neither is sent anywhere, and clearing your browser storage removes both.`

**What this site does not do.** `It runs no analytics today. It loads no third-party scripts, no advertising, no social widgets and no fonts from anyone else's server. It builds no profile of you and sends nothing about you to us, because there is no server of ours to send it to — every page here is a static file.`

**What the host sees.** `This site is served by a hosting provider, and like every web server on the internet, theirs records the requests it answers: your IP address, the time, the page and your browser's user agent. We do not control that log and do not use it to identify anyone. It is the one place where data about your visit exists at all, and saying otherwise would be untrue.`

**If analytics is added.** `It would only run after you allow it on the banner, and this page would name the provider and what it measures before it collects anything. Choosing "only essentials" keeps it off.`

**Changing your mind.** `Clear this site's data in your browser settings and the banner will ask again on your next visit. Choosing "only essentials" has the same effect as never accepting.`

**Your rights.** `Brazilian law (LGPD) gives you the right to confirm whether your data is processed, to access it, to correct it, to have it deleted, to take it elsewhere, and to withdraw consent. In practice, almost all of it is already in your hands: the two values above are yours to delete, and there is nothing on our side to request. For the hosting log, or for anything else, use the contact above.`

### The copy — pt-BR

Title: `Privacidade`
Last updated line: `Última atualização: 1 de agosto de 2026`

**Quem é responsável.** `O Lyra DS é mantido por Francisross Soares de Oliveira. Para qualquer coisa desta página, escreva para security@francisross.com.br, ou abra um tópico no GitHub Discussions se a sua pergunta não precisar ser privada.`

**O que este site guarda.** `Dois valores, os dois no seu próprio navegador, os dois legíveis apenas por este site: sua escolha de tema claro ou escuro, e a resposta que você deu ao banner de consentimento. Nenhum é cookie, nenhum é enviado a lugar nenhum, e limpar o armazenamento do navegador remove os dois.`

**O que este site não faz.** `Não roda métricas hoje. Não carrega script de terceiro, nem publicidade, nem widget de rede social, nem fonte do servidor de ninguém. Não monta perfil sobre você e não nos envia nada a seu respeito, porque não existe servidor nosso para onde enviar — cada página aqui é um arquivo estático.`

**O que o host enxerga.** `Este site é servido por um provedor de hospedagem e, como todo servidor web da internet, o dele registra as requisições que responde: seu endereço IP, o horário, a página e o agente do seu navegador. Não controlamos esse registro e não o usamos para identificar ninguém. É o único lugar onde existe algum dado sobre a sua visita, e dizer o contrário seria mentira.`

**Se entrarem métricas.** `Elas só rodariam depois de você permitir no banner, e esta página nomearia o provedor e o que ele mede antes de qualquer coleta. Escolher "apenas o essencial" mantém tudo desligado.`

**Mudando de ideia.** `Limpe os dados deste site nas configurações do navegador e o banner pergunta de novo na próxima visita. Escolher "apenas o essencial" tem o mesmo efeito de nunca ter aceitado.`

**Seus direitos.** `A LGPD garante a você confirmar se há tratamento dos seus dados, acessá-los, corrigi-los, pedir a eliminação, levá-los a outro lugar e revogar o consentimento. Na prática, quase tudo já está na sua mão: os dois valores acima são seus para apagar, e não há nada do nosso lado para requisitar. Para o registro da hospedagem, ou para qualquer outra coisa, use o contato acima.`

### Every claim on that page must stay true

Before shipping it, confirm each one against the code you can see:

- No third-party request: the fonts are `@fontsource` (bundled), icons are `lucide-react`
  (bundled). **Prove it** — build, serve the export, load both pages with the network panel
  or a request log, and report every origin that was contacted. It must be only the origin
  serving the site.
- Two stored values, no cookies: after visiting and answering the banner, report
  `Object.keys(localStorage)` and `document.cookie`. The first must hold exactly the theme key
  and the consent key; the second must be empty.

If either check disagrees with the copy, **the copy is wrong and you stop** — do not adjust
the sentence to match a leak.

## Accessibility — the banner is the hard part

It is the first thing a visitor meets and the easiest thing to never audit, because it hides
after one click. This lot's version of "a tab you never opened".

- `axe.run` on the landing **with the banner visible**, both locales, both themes.
- `axe.run` again after dismissing it, to catch anything the removal leaves behind.
- The banner is reachable and operable by keyboard, both buttons have visible focus, and the
  policy link is a real link.
- It must not trap focus and must not steal focus on load — it is not a modal.

## Acceptance criteria

1. `/en/privacy` and `/pt-BR/privacy` exist in the static export, carry the copy verbatim, and
   are linked from the footer in both locales.
2. The banner appears on a first visit, disappears after a choice, and does not come back on
   reload. Prove all three in the built artifact.
3. The stored value is `all` or `essentials` under `lyra-site-consent`, and `mayLoadAnalytics()`
   returns true only for `all`. Cover it with tests.
4. **Zero analytics ships.** No provider named anywhere in code or copy; no third-party origin
   contacted. Report the full list of origins the built pages request.
5. `localStorage` holds exactly two keys after a decision; `document.cookie` is empty. Report
   both.
6. `axe.run` clean with the banner **visible** and after dismissal, both locales, both themes.
7. Keyboard: banner reachable, both buttons operable, focus visible, no focus trap, no focus
   steal on load.
8. Exactly one `<h1>` on the privacy page, and still exactly one on the landing.
9. The four CI jobs' commands run, with real output reported and anything unrunnable named.

## Boundaries

- **Do not touch `packages/`** — `CookieBanner` is already built; if it fights you, report it.
- Do not touch `apps/docs/`.
- Do not add analytics, a provider, or any third-party request.
- Do not change the landing's seven sections, the header or the CTA.
- Do not add metadata, Open Graph tags, `robots.txt` or `sitemap.xml` — that is the next lot.
- Do not commit, branch or push.
