/* Lyra Website UI kit — seções de apresentação: temas, comunidade, FAQ, CTA */
const { Button, Badge, Icon, Card, Accordion, Container, Stack, Inline, Grid } = window.LyraDesignSystem_e82d95;

function CheckItem({ children }) {
  return (
    <li className="lw-check">
      <Icon name="check" size={16} />
      <span>{children}</span>
    </li>
  );
}

function ThemingSection() {
  return (
    <section className="lw-section" id="temas">
      <Container>
        <Grid columns="1fr 1fr" gap={12} style={{ alignItems: "center" }}>
          <div>
            <span className="lw-overline">Temas e tokens</span>
            <h2 className="lw-h2">Sua marca, os mesmos componentes</h2>
            <p className="lw-section__sub" style={{ marginBottom: "var(--space-4)" }}>209 tokens semânticos controlam cor, tipo e espaçamento. Sobrescreva meia dúzia e o sistema inteiro vira a sua marca.</p>
            <Stack as="ul" gap={2} className="lw-checks">
              <CheckItem>Claro e escuro com <code>data-theme</code></CheckItem>
              <CheckItem>White-label por sobrescrita de tokens</CheckItem>
              <CheckItem>Camada <code>compat-shadcn</code> opt-in para migração</CheckItem>
            </Stack>
          </div>
          <pre className="lw-show__code">{`/* brand.css — só isso */
:root {
  --accent: oklch(0.58 0.17 155);
  --font-display: "Sua Fonte", sans-serif;
  --radius-md: 4px;
}`}</pre>
        </Grid>
      </Container>
    </section>
  );
}

function CommunitySection() {
  const items = [
    { icon: "github", title: "Contribua no GitHub", desc: "Issues, PRs e o roadmap são públicos. Boas primeiras issues levam a tag good-first-issue.", cta: "Abrir repositório" },
    { icon: "message-circle", title: "Discuta no GitHub Discussions", desc: "Dúvidas de uso, feedback de API e RFCs de novos componentes acontecem em discussões abertas no repositório.", cta: "Ver discussões" },
    { icon: "book-open", title: "Melhore a documentação", desc: "As docs em docs.lyra-ds.dev vivem no repositório lyra-ds/docs e aceitam PRs de qualquer pessoa.", cta: "Escrever uma página" },
  ];
  return (
    <section className="lw-section lw-section--alt" id="comunidade">
      <Container>
        <Stack align="center" gap={2} style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
          <span className="lw-overline">Comunidade</span>
          <h2 className="lw-h2" style={{ margin: 0 }}>Feito no aberto</h2>
          <p className="lw-section__sub" style={{ margin: 0 }}>Sem plano pago, sem paywall: o Lyra evolui por contribuição. Todo o core é MIT — use comercialmente à vontade.</p>
        </Stack>
        <Grid minItem={260} gap={4}>
          {items.map((it) => (
            <Card key={it.title} padded>
              <Stack gap={3} style={{ height: "100%" }}>
                <span className="lw-comm__icon"><Icon name={it.icon} size={20} /></span>
                <span className="lw-comm__title">{it.title}</span>
                <p className="lw-comm__desc">{it.desc}</p>
                <Button variant="ghost" size="sm" iconRight={<Icon name="arrow-right" size={14} />} style={{ alignSelf: "flex-start" }}>{it.cta}</Button>
              </Stack>
            </Card>
          ))}
        </Grid>
      </Container>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="lw-section">
      <Container>
        <Grid columns="320px 1fr" gap={12} style={{ alignItems: "start" }}>
          <div>
            <span className="lw-overline">FAQ</span>
            <h2 className="lw-h2">Perguntas frequentes</h2>
            <p className="lw-section__sub">Não achou a sua? Abra uma discussão no GitHub — a comunidade responde rápido.</p>
          </div>
          <Accordion
            defaultOpen="mit"
            items={[
              { id: "mit", title: "Posso usar comercialmente sem pagar?", content: "Sim. Todo o design system — componentes, tokens, temas — é MIT. Não existe plano pago nem paywall; o projeto é mantido pela comunidade." },
              { id: "fw", title: "Como funciona o suporte a 4 frameworks?", content: "O Lyra é CSS-first: a aparência vive em classes .lyra-* compartilhadas. Cada framework recebe um adapter fino (props → classes), então o visual nunca diverge entre stacks." },
              { id: "theme", title: "Dá para customizar o tema?", content: "Sim — sobrescreva os tokens semânticos (--accent, --surface-card etc.) num CSS próprio. O guia de theming em docs.lyra-ds.dev mostra o passo a passo." },
              { id: "a11y", title: "Os componentes são acessíveis?", content: "Contraste AA, foco visível e papéis ARIA fazem parte do padrão de aceitação de cada componente. Issues de acessibilidade têm prioridade máxima no repositório." },
              { id: "contrib", title: "Como começo a contribuir?", content: "Abra o repositório e procure a tag good-first-issue, ou inicie uma thread no GitHub Discussions. Docs, componentes e adapters aceitam PRs." },
            ]}
          />
        </Grid>
      </Container>
    </section>
  );
}

function CTASection() {
  return (
    <section className="lw-cta">
      <Container>
        <Stack align="center" gap={5} style={{ textAlign: "center" }}>
          <img src="../../assets/lyra-mark-light.svg" alt="" className="lw-cta__mark" />
          <h2 className="lw-cta__title">Instale em um minuto.<br />Use para sempre.</h2>
          <Inline gap={3}>
            <Button size="lg" iconRight={<Icon name="arrow-right" size={18} />} onClick={() => { window.location.href = "docs.html"; }}>Ler a documentação</Button>
            <Button size="lg" variant="secondary" className="lw-cta__ghost" iconLeft={<Icon name="github" size={18} />}>Star no GitHub</Button>
          </Inline>
        </Stack>
      </Container>
    </section>
  );
}

Object.assign(window, { ThemingSection, CommunitySection, FAQSection, CTASection });
