/* Lyra Website UI kit — site de documentação (docs.lyra-ds.dev) */
const { Button, Badge, Icon, Alert, Breadcrumb, Input, Container, Stack, Inline, Grid, ThemeProvider } = window.LyraDesignSystem_e82d95;
const useDocsTheme = ThemeProvider.useTheme;

function DocsHeader() {
  const { dark, toggle } = useDocsTheme();
  return (
    <header className="lw-header">
      <Container className="lw-header__inner">
        <a className="lw-brand" href="index.html" title="lyra-ds.dev">
          <img src="../../assets/lyra-mark.svg" alt="" className="lw-mark ld-mark-light" />
          <img src="../../assets/lyra-mark-light.svg" alt="" className="lw-mark ld-mark-dark" />
          <span className="lw-brand__word">Lyra</span>
          <span className="lw-brand__sub">docs</span>
        </a>
        <nav className="lw-nav" style={{ marginRight: "auto" }}>
          <a className="lw-nav__link" href="index.html" title="lyra-ds.dev">lyra-ds.dev <Icon name="arrow-up-right" size={14} /></a>
        </nav>
        <Inline gap={2}>
          <Input placeholder="Buscar nas docs…" size="sm" iconLeft={<Icon name="search" size={16} />} style={{ width: 220 }} />
          <button className="lw-nav__link" onClick={toggle} aria-label="Alternar tema">
            <Icon name={dark ? "sun" : "moon"} size={18} />
          </button>
          <Button variant="secondary" size="sm" iconLeft={<Icon name="github" size={16} />}>GitHub</Button>
        </Inline>
      </Container>
    </header>
  );
}

function DocsFooter() {
  return (
    <footer className="lw-footer">
      <Container className="lw-footer__inner">
        <span className="lw-footer__note">docs.lyra-ds.dev · conteúdo sob licença MIT, escrito pela comunidade.</span>
        <Inline gap={4} className="lw-footer__links">
          <a href="index.html">lyra-ds.dev</a>
          <a href="#">GitHub</a>
          <a href="#">npm</a>
        </Inline>
      </Container>
    </footer>
  );
}

function DocsSidebar({ active, onSelect }) {
  const groups = [
    { title: "Introdução", items: ["Instalação", "Tokens", "Temas"] },
    { title: "Componentes", items: ["Button", "Input", "Card", "Dialog", "Table"] },
  ];
  return (
    <Stack as="aside" gap={5} className="lw-docs__side">
      {groups.map((g) => (
        <Stack key={g.title} gap="2px">
          <span className="lw-docs__group-title">{g.title}</span>
          {g.items.map((it) => (
            <button
              key={it}
              className={["lw-docs__item", active === it && "lw-docs__item--active"].filter(Boolean).join(" ")}
              onClick={() => onSelect(it)}
            >
              {it}
            </button>
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

function DocsContent({ topic }) {
  return (
    <Stack as="article" gap={4} className="lw-docs__content">
      <Breadcrumb items={[{ label: "Docs", href: "#" }, { label: topic }]} />
      <h1 className="lw-docs__title">{topic}</h1>
      {topic === "Instalação" ? (
        <React.Fragment>
          <p className="lw-docs__p">Instale o pacote do seu framework e importe o CSS uma única vez na raiz do app.</p>
          <pre className="lw-show__code">{`npm i @lyra-ds/react

// main.jsx
import "@lyra-ds/styles/styles.css";`}</pre>
          <Alert tone="info" icon={<Icon name="info" size={18} />}>
            Vue, Laravel e Phoenix usam as mesmas classes CSS — só muda o adapter.
          </Alert>
          <h2 className="lw-docs__h2">Tema escuro</h2>
          <p className="lw-docs__p">Adicione <code>data-theme="dark"</code> ao elemento <code>html</code>. Todos os tokens semânticos respondem automaticamente.</p>
          <pre className="lw-show__code">{`<html data-theme="dark">`}</pre>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <p className="lw-docs__p">
            Documentação de <strong>{topic}</strong> — escrita em andamento pela comunidade.
            Enquanto isso, veja o uso real no <code>components/*/{"{"}Name{"}"}.prompt.md</code> do repositório.
          </p>
          <Alert tone="warning" icon={<Icon name="pencil" size={18} />}>
            Quer contribuir? Esta página aceita PRs no repositório lyra-ds/docs.
          </Alert>
        </React.Fragment>
      )}
      <Inline justify="space-between" className="lw-docs__foot">
        <Button variant="ghost" size="sm" iconLeft={<Icon name="arrow-left" size={14} />}>Anterior</Button>
        <Button variant="ghost" size="sm" iconRight={<Icon name="arrow-right" size={14} />}>Próxima</Button>
      </Inline>
    </Stack>
  );
}

function DocsPage() {
  const [topic, setTopic] = React.useState("Instalação");
  return (
    <Container>
      <Grid columns="220px 1fr" gap={10} style={{ alignItems: "start", padding: "var(--space-8) 0 var(--space-16)" }}>
        <DocsSidebar active={topic} onSelect={setTopic} />
        <DocsContent topic={topic} />
      </Grid>
    </Container>
  );
}

Object.assign(window, { DocsPage, DocsHeader, DocsFooter });
