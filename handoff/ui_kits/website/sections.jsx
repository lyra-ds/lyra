/* Lyra Website UI kit — seções da landing/docs */
const { Button, Badge, Icon, Card, Tabs, Tag, Input } = window.LyraDesignSystem_e82d95;

function SiteHeader({ page, onNavigate, dark, onToggleTheme }) {
  return (
    <header className="lw-header">
      <div className="lw-container lw-header__inner">
        <button className="lw-brand" onClick={() => onNavigate("home")}>
          <img src="../../assets/lyra-mark.svg" alt="" className="lw-mark ld-mark-light" />
          <img src="../../assets/lyra-mark-light.svg" alt="" className="lw-mark ld-mark-dark" />
          <span className="lw-brand__word">Lyra</span>
        </button>
        <nav className="lw-nav">
          <button className={["lw-nav__link", page === "docs" && "lw-nav__link--active"].filter(Boolean).join(" ")} onClick={() => onNavigate("docs")}>Documentação</button>
          <a className="lw-nav__link" href="#componentes">Componentes</a>
          <a className="lw-nav__link" href="#precos">Preços</a>
        </nav>
        <div className="lw-header__actions">
          <button className="lw-nav__link" onClick={onToggleTheme} aria-label="Alternar tema">
            <Icon name={dark ? "sun" : "moon"} size={18} />
          </button>
          <Button variant="secondary" size="sm" iconLeft={<Icon name="github" size={16} />}>GitHub</Button>
          <Button size="sm" onClick={() => onNavigate("docs")}>Começar</Button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onNavigate }) {
  return (
    <section className="lw-hero">
      <div className="lw-container lw-hero__inner">
        <Badge tone="accent" dot>v1.0 · open source</Badge>
        <h1 className="lw-hero__title">Componentes que escalam<br />do protótipo à produção</h1>
        <p className="lw-hero__sub">
          Lyra é um design system open source com tokens, temas claro e escuro e
          componentes acessíveis para React, Vue, Laravel e Phoenix LiveView.
        </p>
        <div className="lw-hero__cta">
          <Button size="lg" iconRight={<Icon name="arrow-right" size={18} />} onClick={() => onNavigate("docs")}>Começar agora</Button>
          <Button size="lg" variant="secondary" iconLeft={<Icon name="terminal" size={18} />}>npm i @lyra-ds/react</Button>
        </div>
        <div className="lw-hero__meta">
          <span><Icon name="star" size={14} /> 3.842 estrelas</span>
          <span><Icon name="download" size={14} /> 48 mil/mês</span>
          <span><Icon name="scale" size={14} /> MIT</span>
        </div>
      </div>
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
      <div className="lw-container">
        <span className="lw-overline">Um sistema, quatro stacks</span>
        <h2 className="lw-h2">CSS-first, adapters finos</h2>
        <p className="lw-section__sub">Toda a aparência vive em classes <code>.lyra-*</code>. Cada framework recebe só um wrapper leve por cima.</p>
        <div className="lw-fw-grid">
          {fw.map((f) => (
            <Card key={f.name} interactive padded>
              <div className="lw-fw">
                <div className="lw-fw__head">
                  <span className="lw-fw__name">{f.name}</span>
                  {f.status}
                </div>
                <code className="lw-fw__pkg">{f.pkg}</code>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComponentShowcase() {
  const [tab, setTab] = React.useState("preview");
  return (
    <section className="lw-section lw-section--alt" id="componentes">
      <div className="lw-container">
        <span className="lw-overline">Componentes</span>
        <h2 className="lw-h2">Acessíveis por padrão</h2>
        <p className="lw-section__sub">Foco visível, contraste AA e estados completos — sem esforço extra do seu lado.</p>
        <Card padded={false}>
          <div className="lw-show__tabs">
            <Tabs active={tab} onChange={setTab} items={[
              { id: "preview", label: "Preview" },
              { id: "code", label: "Código" },
            ]} />
          </div>
          {tab === "preview" ? (
            <div className="lw-show__stage">
              <Button>Criar projeto</Button>
              <Button variant="secondary">Cancelar</Button>
              <Badge tone="success" dot>Ativo</Badge>
              <Tag>design-tokens</Tag>
              <Input placeholder="voce@exemplo.dev" size="sm" style={{ maxWidth: 220 }} />
            </div>
          ) : (
            <pre className="lw-show__code">{`import { Button, Badge } from "@lyra-ds/react";

<Button>Criar projeto</Button>
<Badge tone="success" dot>Ativo</Badge>`}</pre>
          )}
        </Card>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="lw-footer">
      <div className="lw-container lw-footer__inner">
        <div className="lw-brand" style={{ cursor: "default" }}>
          <img src="../../assets/lyra-mark.svg" alt="" className="lw-mark ld-mark-light" />
          <img src="../../assets/lyra-mark-light.svg" alt="" className="lw-mark ld-mark-dark" />
          <span className="lw-brand__word">Lyra</span>
        </div>
        <span className="lw-footer__note">Open source sob licença MIT. Feito pela comunidade, para a comunidade.</span>
        <div className="lw-footer__links">
          <a href="#">GitHub</a>
          <a href="#">Discord</a>
          <a href="#">npm</a>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { SiteHeader, Hero, Frameworks, ComponentShowcase, SiteFooter });
