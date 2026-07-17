/* Lyra Dashboard UI kit — telas admin: Membros e Cobrança */
const {
  Card, Table, Badge, Button, IconButton, Icon, Input, Select, Textarea,
  Avatar, Dropdown, Drawer, Tabs, Progress, Radio, Alert, Tooltip, Combobox,
} = window.LyraDesignSystem_e82d95;

function MemberCell({ name, email }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
      <Avatar name={name} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span className="lyra-table__primary">{name}</span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{email}</span>
      </div>
    </div>
  );
}

function RowMenu({ danger }) {
  return (
    <Dropdown
      align="end"
      trigger={<IconButton label="Mais ações" variant="ghost" size="sm"><Icon name="ellipsis" size={16} /></IconButton>}
      items={[
        { id: "role", label: "Alterar papel", icon: <Icon name="shield" size={16} /> },
        { id: "resend", label: "Reenviar convite", icon: <Icon name="mail" size={16} /> },
        { type: "separator" },
        { id: "remove", label: "Remover do workspace", icon: <Icon name="trash-2" size={16} />, danger: true },
      ]}
    />
  );
}

function MembersScreen() {
  const [invite, setInvite] = React.useState(false);
  const members = [
    { id: 1, who: <MemberCell name="Ana Souza" email="ana@lyra.dev" />, role: <Badge tone="accent">Owner</Badge>, status: <Badge tone="success" dot>Ativa</Badge>, seen: "agora", menu: <RowMenu /> },
    { id: 2, who: <MemberCell name="Léo Lima" email="leo@lyra.dev" />, role: <Badge>Admin</Badge>, status: <Badge tone="success" dot>Ativo</Badge>, seen: "há 1h", menu: <RowMenu /> },
    { id: 3, who: <MemberCell name="Bia Reis" email="bia@lyra.dev" />, role: <Badge>Dev</Badge>, status: <Badge tone="success" dot>Ativa</Badge>, seen: "ontem", menu: <RowMenu /> },
    { id: 4, who: <MemberCell name="Caio Melo" email="caio@exemplo.dev" />, role: <Badge>Dev</Badge>, status: <Badge tone="warning" dot>Convite pendente</Badge>, seen: "—", menu: <RowMenu /> },
  ];
  return (
    <div className="ld-stack">
      <div className="ld-toolbar">
        <div>
          <p className="ld-section-title">Membros do workspace</p>
          <p className="ld-section-sub">4 de 10 assentos usados no plano Pro.</p>
        </div>
        <div className="ld-toolbar__right">
          <Input iconLeft={<Icon name="search" size={16} />} placeholder="Buscar membro…" size="sm" />
          <Button iconLeft={<Icon name="user-plus" size={16} />} onClick={() => setInvite(true)}>Convidar</Button>
        </div>
      </div>
      <Table
        hover
        columns={[
          { key: "who", label: "Membro" },
          { key: "role", label: "Papel" },
          { key: "status", label: "Status" },
          { key: "seen", label: "Visto por último" },
          { key: "menu", label: "", align: "right" },
        ]}
        rows={members}
      />
      <Drawer
        open={invite}
        onClose={() => setInvite(false)}
        title="Convidar membros"
        footer={
          <React.Fragment>
            <Button variant="secondary" onClick={() => setInvite(false)}>Cancelar</Button>
            <Button iconLeft={<Icon name="send" size={16} />} onClick={() => setInvite(false)}>Enviar convites</Button>
          </React.Fragment>
        }
      >
        <div className="ld-stack" style={{ gap: "var(--space-4)" }}>
          <Textarea label="E-mails" hint="Um por linha. Máximo de 6 assentos restantes." placeholder={"joana@exemplo.dev\npedro@exemplo.dev"} rows={4} />
          <Combobox
            label="Papel"
            defaultValue="dev"
            options={[
              { value: "admin", label: "Admin", hint: "gerencia membros e cobrança" },
              { value: "dev", label: "Dev", hint: "edita projetos e tokens" },
              { value: "viewer", label: "Viewer", hint: "somente leitura" },
            ]}
          />
          <Alert tone="info" icon={<Icon name="info" size={18} />}>Convites expiram em 7 dias.</Alert>
        </div>
      </Drawer>
    </div>
  );
}

function PlanCard({ name, price, desc, current, selected, onSelect }) {
  return (
    <label className={["ld-plan", selected && "ld-plan--selected"].filter(Boolean).join(" ")}>
      <div className="ld-plan__head">
        <Radio name="plan" checked={selected} onChange={onSelect} />
        <span className="ld-plan__name">{name}</span>
        {current && <Badge tone="accent">Atual</Badge>}
      </div>
      <div className="ld-plan__price">{price}<span>/mês</span></div>
      <p className="ld-plan__desc">{desc}</p>
    </label>
  );
}

function BillingScreen() {
  const [plan, setPlan] = React.useState("pro");
  return (
    <div className="ld-stack">
      <div className="ld-grid-2-1">
        <Card title="Plano">
          <div className="ld-plans">
            <PlanCard name="Free" price="R$ 0" desc="3 projetos, 2 membros, comunidade." selected={plan === "free"} onSelect={() => setPlan("free")} />
            <PlanCard name="Pro" price="R$ 49" desc="Projetos ilimitados, 10 membros, suporte." current selected={plan === "pro"} onSelect={() => setPlan("pro")} />
            <PlanCard name="Team" price="R$ 199" desc="Membros ilimitados, SSO, SLA dedicado." selected={plan === "team"} onSelect={() => setPlan("team")} />
          </div>
          <div className="ld-plan-actions">
            <Button disabled={plan === "pro"}>{plan === "pro" ? "Plano atual" : "Mudar de plano"}</Button>
          </div>
        </Card>
        <div className="ld-stack" style={{ gap: "var(--space-4)" }}>
          <Card title="Uso do ciclo">
            <div className="ld-stack" style={{ gap: "var(--space-4)" }}>
              <div>
                <div className="ld-goal-row"><span>Assentos</span><strong>4/10</strong></div>
                <Progress value={40} />
              </div>
              <div>
                <div className="ld-goal-row"><span>Builds de tema</span><strong>1.840/2.000</strong></div>
                <Progress value={92} tone="danger" />
              </div>
            </div>
          </Card>
          <Card title="Pagamento" actions={<Button size="sm" variant="ghost">Trocar</Button>}>
            <div className="ld-payment">
              <div className="ld-payment__chip"><Icon name="credit-card" size={18} /></div>
              <div>
                <p className="ld-payment__num">Mastercard •••• 4842</p>
                <p className="ld-payment__exp">Expira 08/2027</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Card title="Faturas" padded={false}>
        <Table
          columns={[
            { key: "id", label: "Fatura" },
            { key: "date", label: "Data" },
            { key: "amount", label: "Valor" },
            { key: "status", label: "Status" },
            { key: "dl", label: "", align: "right" },
          ]}
          rows={[
            { id: <span className="lyra-table__primary">#2026-006</span>, date: "01 jun 2026", amount: "R$ 49,00", status: <Badge tone="success" dot>Paga</Badge>, dl: <Tooltip tip="Baixar PDF"><IconButton label="Baixar" variant="ghost" size="sm"><Icon name="download" size={16} /></IconButton></Tooltip> },
            { id: <span className="lyra-table__primary">#2026-005</span>, date: "01 mai 2026", amount: "R$ 49,00", status: <Badge tone="success" dot>Paga</Badge>, dl: <Tooltip tip="Baixar PDF"><IconButton label="Baixar" variant="ghost" size="sm"><Icon name="download" size={16} /></IconButton></Tooltip> },
            { id: <span className="lyra-table__primary">#2026-004</span>, date: "01 abr 2026", amount: "R$ 49,00", status: <Badge tone="warning" dot>Em aberto</Badge>, dl: <Tooltip tip="Baixar PDF"><IconButton label="Baixar" variant="ghost" size="sm"><Icon name="download" size={16} /></IconButton></Tooltip> },
          ]}
        />
      </Card>
    </div>
  );
}

Object.assign(window, { MembersScreen, BillingScreen });
