/* Lyra Website UI kit — página de docs */
const { Button, Badge, Icon, Alert, Breadcrumb } = window.LyraDesignSystem_e82d95;

function DocsSidebar({ active, onSelect }) {
  const groups = [
    { title: "Introdução", items: ["Instalação", "Tokens", "Temas"] },
    { title: "Componentes", items: ["Button", "Input", "Card", "Dialog", "Table"] },
  ];
  return (
    <aside className="lw-docs__side">
      {groups.map((g) => (
        <div key={g.title} className="lw-docs__group">
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
        </div>
      ))}
    </aside>
  );
}

function DocsContent({ topic }) {
  return (
    <article className="lw-docs__content">
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
      <div className="lw-docs__foot">
        <Button variant="ghost" size="sm" iconLeft={<Icon name="arrow-left" size={14} />}>Anterior</Button>
        <Button variant="ghost" size="sm" iconRight={<Icon name="arrow-right" size={14} />}>Próxima</Button>
      </div>
    </article>
  );
}

function DocsPage() {
  const [topic, setTopic] = React.useState("Instalação");
  return (
    <div className="lw-container lw-docs">
      <DocsSidebar active={topic} onSelect={setTopic} />
      <DocsContent topic={topic} />
    </div>
  );
}

Object.assign(window, { DocsPage });
