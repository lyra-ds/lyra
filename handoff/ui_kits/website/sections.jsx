/* Lyra Website UI kit — seções da landing (lyra-ds.dev), montadas com componentes do próprio DS */
const { Button, Badge, Icon, Card, Tabs, Tag, Input, Container, Stack, Inline, Grid, ThemeProvider } = window.LyraDesignSystem_e82d95;
const useSiteTheme = ThemeProvider.useTheme;
const DOCS_URL = "docs.html"; /* em produção: https://docs.lyra-ds.dev */

function SiteHeader() {
  const { dark, toggle } = useSiteTheme();
  return (
    <header className="lw-header">
      <Container className="lw-header__inner">
        <a className="lw-brand" href="index.html">
          <img src="../../assets/lyra-mark.svg" alt="" className="lw-mark ld-mark-light" />
          <img src="../../assets/lyra-mark-light.svg" alt="" className="lw-mark ld-mark-dark" />
          <span className="lw-brand__word">Lyra</span>
        </a>
        <nav className="lw-nav">
          <a className="lw-nav__link" href="#">GitHub</a>
        </nav>
        <Inline gap={2}>
          <button className="lw-nav__link" onClick={toggle} aria-label="Alternar tema">
            <Icon name={dark ? "sun" : "moon"} size={18} />
          </button>
          <Button size="sm" iconRight={<Icon name="arrow-up-right" size={16} />} onClick={() => { window.location.href = DOCS_URL; }} title="docs.lyra-ds.dev">Documentação</Button>
        </Inline>
      </Container>
    </header>
  );
}

function Hero() {
  return (
    <section className="lw-hero">
      <Container>
        <Stack align="center" gap={5} style={{ textAlign: "center" }}>
          <Badge tone="accent" dot>v1.1 · open source · MIT</Badge>
          <h1 className="lw-hero__title">Componentes que escalam<br />do protótipo à produção</h1>
          <p className="lw-hero__sub">
            Lyra é um design system open source com tokens, temas claro e escuro e
            componentes acessíveis para React, Vue, Laravel e Phoenix LiveView.
          </p>
          <Inline gap={3}>
            <Button size="lg" iconRight={<Icon name="arrow-right" size={18} />} onClick={() => { window.location.href = DOCS_URL; }}>Ler a documentação</Button>
            <Button size="lg" variant="secondary" iconLeft={<Icon name="terminal" size={18} />}>npm i @lyra-ds/react</Button>
          </Inline>
          <Inline gap={6}>
            <span className="lw-meta-item"><Icon name="star" size={14} /> 3.842 estrelas</span>
            <span className="lw-meta-item"><Icon name="download" size={14} /> 48 mil/mês</span>
            <span className="lw-meta-item"><Icon name="scale" size={14} /> Licença MIT</span>
          </Inline>
        </Stack>
      </Container>
    </section>
  );
}

function Frameworks() {
  const fw = [
    { name: "React", pkg: "@lyra-ds/react", status: <Badge tone="success" dot>Estável</Badge> },
    { name: "Vue 3", pkg: "@lyra-ds/vue", status: <Badge tone="warning" dot>Beta</Badge> },
    { name: "Laravel Blade", pkg: "lyra/blade", status: <Badge tone="warning" dot>Beta</Badge> },
    { name: "Phoenix LiveView", pkg: "lyra_liveview", status: <Badge tone="info" dot>Em dev</Badge> },
  ];
  return (
    <section className="lw-section" id="frameworks">
      <Container>
        <span className="lw-overline">Um sistema, quatro stacks</span>
        <h2 className="lw-h2">CSS-first, adapters finos</h2>
        <p className="lw-section__sub">Toda a aparência vive em classes <code>.lyra-*</code>. Cada framework recebe só um wrapper leve por cima.</p>
        <Grid minItem={220} gap={4}>
          {fw.map((f) => (
            <Card key={f.name} interactive padded>
              <Stack gap={3}>
                <Inline gap={2} justify="space-between">
                  <span className="lw-fw__name">{f.name}</span>
                  {f.status}
                </Inline>
                <code className="lw-fw__pkg">{f.pkg}</code>
              </Stack>
            </Card>
          ))}
        </Grid>
      </Container>
    </section>
  );
}

function ComponentShowcase() {
  const [tab, setTab] = React.useState("preview");
  return (
    <section className="lw-section lw-section--alt" id="componentes">
      <Container>
        <span className="lw-overline">Componentes</span>
        <h2 className="lw-h2">Acessíveis por padrão</h2>
        <p className="lw-section__sub">55+ componentes com foco visível, contraste AA e estados completos — sem esforço extra do seu lado.</p>
        <Card padded={false}>
          <div className="lw-show__tabs">
            <Tabs active={tab} onChange={setTab} items={[
              { id: "preview", label: "Preview" },
              { id: "code", label: "Código" },
            ]} />
          </div>
          {tab === "preview" ? (
            <Inline gap={3} wrap style={{ padding: "var(--space-8) var(--space-6)" }}>
              <Button>Criar projeto</Button>
              <Button variant="secondary">Cancelar</Button>
              <Badge tone="success" dot>Ativo</Badge>
              <Tag>design-tokens</Tag>
              <Input placeholder="voce@exemplo.dev" size="sm" style={{ maxWidth: 220 }} />
            </Inline>
          ) : (
            <pre className="lw-show__code">{`import { Button, Badge } from "@lyra-ds/react";

<Button>Criar projeto</Button>
<Badge tone="success" dot>Ativo</Badge>`}</pre>
          )}
        </Card>
      </Container>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="lw-footer">
      <Container className="lw-footer__inner">
        <div className="lw-brand" style={{ cursor: "default" }}>
          <img src="../../assets/lyra-mark.svg" alt="" className="lw-mark ld-mark-light" />
          <img src="../../assets/lyra-mark-light.svg" alt="" className="lw-mark ld-mark-dark" />
          <span className="lw-brand__word">Lyra</span>
        </div>
        <span className="lw-footer__note">Open source sob licença MIT. Feito pela comunidade, para a comunidade.</span>
        <Inline gap={4} className="lw-footer__links">
          <a href={DOCS_URL} title="docs.lyra-ds.dev">Documentação</a>
          <a href="#">GitHub</a>
          <a href="#">npm</a>
        </Inline>
      </Container>
    </footer>
  );
}

Object.assign(window, { SiteHeader, Hero, Frameworks, ComponentShowcase, SiteFooter });
