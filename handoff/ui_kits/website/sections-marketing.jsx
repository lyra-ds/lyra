/* Lyra Website UI kit — seções comerciais: pricing, comparação, depoimentos, FAQ, CTA */
const {
  Button, Badge, Icon, Card, Tabs, Avatar, Accordion, Table, Tooltip, Dialog, Input,
} = window.LyraDesignSystem_e82d95;

function CheckItem({ children, muted }) {
  return (
    <li className={["lw-check", muted && "lw-check--muted"].filter(Boolean).join(" ")}>
      <Icon name={muted ? "minus" : "check"} size={16} />
      <span>{children}</span>
    </li>
  );
}

function PricingSection() {
  const [cycle, setCycle] = React.useState("monthly");
  const [checkout, setCheckout] = React.useState(false);
  const annual = cycle === "annual";
  return (
    <section className="lw-section" id="precos">
      <div className="lw-container">
        <div className="lw-center-head">
          <span className="lw-overline">Preços</span>
          <h2 className="lw-h2">Community para sempre, Pro quando crescer</h2>
          <p className="lw-section__sub" style={{ margin: "0 auto var(--space-6)" }}>O design system inteiro é MIT. O Pro financia o projeto com ferramentas para times.</p>
          <Tabs variant="pills" active={cycle} onChange={setCycle} items={[
            { id: "monthly", label: "Mensal" },
            { id: "annual", label: "Anual · −20%" },
          ]} />
        </div>
        <div className="lw-price-grid">
          <Card padded className="lw-price">
            <div className="lw-price__head">
              <span className="lw-price__name">Community</span>
              <Badge tone="success">Open source</Badge>
            </div>
            <div className="lw-price__value">R$ 0<span> para sempre</span></div>
            <p className="lw-price__desc">Tudo que você viu aqui, sem limites de uso.</p>
            <Button variant="secondary" full iconLeft={<Icon name="github" size={16} />}>Começar no GitHub</Button>
            <ul className="lw-checks">
              <CheckItem>Todos os 32 componentes</CheckItem>
              <CheckItem>Temas claro e escuro</CheckItem>
              <CheckItem>React, Vue, Blade e LiveView</CheckItem>
              <CheckItem>Comunidade no Discord</CheckItem>
              <CheckItem muted>Tema custom builder</CheckItem>
              <CheckItem muted>Suporte prioritário</CheckItem>
            </ul>
          </Card>
          <Card padded className="lw-price lw-price--featured">
            <div className="lw-price__head">
              <span className="lw-price__name">Pro</span>
              <Badge tone="accent" dot>Recomendado</Badge>
            </div>
            <div className="lw-price__value">
              R$ {annual ? "39" : "49"}<span>/mês por time{annual ? " · cobrado anualmente" : ""}</span>
            </div>
            <p className="lw-price__desc">Para times que vivem do Lyra no dia a dia.</p>
            <Button full iconRight={<Icon name="arrow-right" size={16} />} onClick={() => setCheckout(true)}>Assinar Pro</Button>
            <ul className="lw-checks">
              <CheckItem>Tudo do Community</CheckItem>
              <CheckItem>Tema custom builder (white-label)</CheckItem>
              <CheckItem>Kit Figma sincronizado com tokens</CheckItem>
              <CheckItem>Suporte prioritário em 24h</CheckItem>
              <CheckItem>Workspace de até 10 membros</CheckItem>
              <CheckItem>Acesso antecipado a componentes</CheckItem>
            </ul>
          </Card>
        </div>
        <div className="lw-compare">
          <Table
            columns={[
              { key: "feat", label: "Recurso" },
              { key: "community", label: "Community", align: "center" },
              { key: "pro", label: "Pro", align: "center" },
            ]}
            rows={[
              { id: 1, feat: <span className="lyra-table__primary">Componentes e tokens</span>, community: <Icon name="check" size={18} color="var(--success)" title="Incluído" />, pro: <Icon name="check" size={18} color="var(--success)" title="Incluído" /> },
              { id: 2, feat: <span className="lyra-table__primary">Uso comercial (MIT)</span>, community: <Icon name="check" size={18} color="var(--success)" title="Incluído" />, pro: <Icon name="check" size={18} color="var(--success)" title="Incluído" /> },
              { id: 3, feat: <span className="lyra-table__primary">Tema custom builder</span>, community: <Icon name="minus" size={18} color="var(--text-faint)" title="Não incluído" />, pro: <Icon name="check" size={18} color="var(--success)" title="Incluído" /> },
              { id: 4, feat: <span className="lyra-table__primary">Kit Figma sincronizado</span>, community: <Icon name="minus" size={18} color="var(--text-faint)" title="Não incluído" />, pro: <Icon name="check" size={18} color="var(--success)" title="Incluído" /> },
              { id: 5, feat: <span className="lyra-table__primary">Suporte</span>, community: <span style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>Comunidade</span>, pro: <span style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>Prioritário · 24h</span> },
            ]}
          />
        </div>
        <Dialog
          open={checkout}
          onClose={() => setCheckout(false)}
          title="Assinar o Lyra Pro"
          footer={
            <React.Fragment>
              <Button variant="secondary" onClick={() => setCheckout(false)}>Cancelar</Button>
              <Button iconLeft={<Icon name="lock" size={16} />} onClick={() => setCheckout(false)}>Pagar R$ {annual ? "468/ano" : "49"}</Button>
            </React.Fragment>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <Input label="E-mail de cobrança" type="email" placeholder="financeiro@empresa.dev" />
            <Input label="Cartão" placeholder="0000 0000 0000 0000" iconLeft={<Icon name="credit-card" size={16} />} />
            <Badge tone="accent" dot>Plano Pro · {annual ? "anual (−20%)" : "mensal"} · cancele quando quiser</Badge>
          </div>
        </Dialog>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { name: "Caio Melo", role: "Eng. front-end · fintech", text: "Migramos três produtos em duas semanas. O modo escuro veio de graça." },
    { name: "Duda Reis", role: "Design lead · healthtech", text: "O mesmo CSS no Laravel e no React acabou com a deriva visual entre os times." },
    { name: "Léo Lima", role: "Fundador · devtools", text: "Lancei o MVP num fim de semana usando só o Community. Assinei o Pro no mês seguinte." },
  ];
  return (
    <section className="lw-section lw-section--alt">
      <div className="lw-container">
        <div className="lw-center-head">
          <span className="lw-overline">Comunidade</span>
          <h2 className="lw-h2">Quem usa, recomenda</h2>
        </div>
        <div className="lw-quotes">
          {quotes.map((q) => (
            <Card key={q.name} padded>
              <figure className="lw-quote-card">
                <blockquote>"{q.text}"</blockquote>
                <figcaption>
                  <Avatar name={q.name} />
                  <div>
                    <span className="lw-quote-card__name">{q.name}</span>
                    <span className="lw-quote-card__role">{q.role}</span>
                  </div>
                </figcaption>
              </figure>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="lw-section">
      <div className="lw-container lw-faq">
        <div>
          <span className="lw-overline">FAQ</span>
          <h2 className="lw-h2">Perguntas frequentes</h2>
          <p className="lw-section__sub">Não achou a sua? Pergunte no Discord — a comunidade responde rápido.</p>
        </div>
        <Accordion
          defaultOpen="mit"
          items={[
            { id: "mit", title: "Posso usar comercialmente sem pagar?", content: "Sim. Todo o design system — componentes, tokens, temas — é MIT. O plano Pro só adiciona ferramentas de produtividade para times; nada do core fica atrás de paywall." },
            { id: "fw", title: "Como funciona o suporte a 4 frameworks?", content: "O Lyra é CSS-first: a aparência vive em classes .lyra-* compartilhadas. Cada framework recebe um adapter fino (props → classes), então o visual nunca diverge entre stacks." },
            { id: "theme", title: "Dá para customizar o tema?", content: "Sim — sobrescreva os tokens semânticos (--accent, --surface-card etc.) num CSS próprio. No Pro, o tema builder gera esse arquivo visualmente e mantém o kit Figma em sincronia." },
            { id: "a11y", title: "Os componentes são acessíveis?", content: "Contraste AA, foco visível e papéis ARIA fazem parte do padrão de aceitação de cada componente. Issues de acessibilidade têm prioridade máxima no repositório." },
            { id: "cancel", title: "Posso cancelar o Pro quando quiser?", content: "Sim, o cancelamento é imediato e você mantém acesso até o fim do ciclo pago. Seus projetos continuam funcionando — o core é open source." },
          ]}
        />
      </div>
    </section>
  );
}

function CTASection({ onNavigate }) {
  return (
    <section className="lw-cta">
      <div className="lw-container lw-cta__inner">
        <img src="../../assets/lyra-mark-light.svg" alt="" className="lw-cta__mark" />
        <h2 className="lw-cta__title">Comece pelo Community.<br />Fique pelo que ele te poupa.</h2>
        <div className="lw-hero__cta">
          <Button size="lg" iconRight={<Icon name="arrow-right" size={18} />} onClick={() => onNavigate("docs")}>Ler a documentação</Button>
          <Button size="lg" variant="secondary" className="lw-cta__ghost" iconLeft={<Icon name="github" size={18} />}>Star no GitHub</Button>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { PricingSection, Testimonials, FAQSection, CTASection });
