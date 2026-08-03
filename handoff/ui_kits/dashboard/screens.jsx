/* Lyra Dashboard UI kit — telas: Overview, Projects, Settings */
const {
  Card, Stat, Table, Badge, Button, Icon, Tabs, Tag, Avatar, AvatarGroup,
  Input, Select, Switch, Checkbox, Progress, EmptyState, Alert, Dialog, Textarea,
  FormRow, RadioGroup, ToastProvider,
} = window.LyraDesignSystem_e82d95;
const useToastSet = ToastProvider.useToast;

/* --- mini bar chart (dados fake, desenhado com divs) --- */
function BarChart() {
  const data = [42, 58, 51, 66, 72, 64, 80, 74, 88, 92, 85, 98];
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return (
    <div className="ld-chart">
      {data.map((v, i) => (
        <div key={i} className="ld-chart__col">
          <div className="ld-chart__bar" style={{ height: `${v}%`, opacity: i === data.length - 1 ? 1 : undefined }}></div>
          <span className="ld-chart__lbl">{months[i]}</span>
        </div>
      ))}
    </div>
  );
}

function OverviewScreen() {
  const [period, setPeriod] = React.useState("30d");
  return (
    <div className="ld-stack">
      <div className="ld-grid-4">
        <Card padded><Stat label="Downloads mensais" value="48.210" delta="12,4%" direction="up" /></Card>
        <Card padded><Stat label="Estrelas no GitHub" value="3.842" delta="214 este mês" direction="up" /></Card>
        <Card padded><Stat label="Issues abertas" value="37" delta="9 fechadas" direction="down" /></Card>
        <Card padded><Stat label="Contribuidores" value="214" delta="estável" direction="flat" /></Card>
      </div>
      <Card
        title="Downloads por mês"
        actions={
          <Tabs variant="pills" active={period} onChange={setPeriod} items={[
            { id: "30d", label: "30 dias" },
            { id: "12m", label: "12 meses" },
          ]} />
        }
      >
        <BarChart />
      </Card>
      <div className="ld-grid-2-1">
        <Card title="Pacotes" actions={<Button size="sm" variant="ghost" iconRight={<Icon name="arrow-right" size={14} />}>Ver todos</Button>} padded={false}>
          <Table
            hover
            columns={[
              { key: "name", label: "Pacote" },
              { key: "status", label: "Status" },
              { key: "version", label: "Versão" },
              { key: "downloads", label: "Downloads", align: "right" },
            ]}
            rows={[
              { id: 1, name: <span className="lyra-table__primary">@lyra-ds/react</span>, status: <Badge tone="success" dot>Estável</Badge>, version: "1.0.4", downloads: "21.480" },
              { id: 2, name: <span className="lyra-table__primary">@lyra-ds/vue</span>, status: <Badge tone="warning" dot>Beta</Badge>, version: "0.9.1", downloads: "12.077" },
              { id: 3, name: <span className="lyra-table__primary">lyra/blade</span>, status: <Badge tone="warning" dot>Beta</Badge>, version: "0.8.0", downloads: "8.652" },
              { id: 4, name: <span className="lyra-table__primary">lyra_liveview</span>, status: <Badge tone="info" dot>Em dev</Badge>, version: "0.3.0", downloads: "6.001" },
            ]}
          />
        </Card>
        <Card title="Meta da v1.1">
          <div className="ld-stack" style={{ gap: "var(--space-4)" }}>
            <div>
              <div className="ld-goal-row"><span>Componentes migrados</span><strong>28/32</strong></div>
              <Progress value={87} />
            </div>
            <div>
              <div className="ld-goal-row"><span>Cobertura de a11y</span><strong>74%</strong></div>
              <Progress value={74} />
            </div>
            <div>
              <div className="ld-goal-row"><span>Docs traduzidas</span><strong>41%</strong></div>
              <Progress value={41} tone="danger" />
            </div>
            <Alert tone="info" icon={<Icon name="info" size={18} />}>Release candidate prevista para 28 de junho.</Alert>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProjectsScreen() {
  const [tab, setTab] = React.useState("ativos");
  const [open, setOpen] = React.useState(false);
  const projects = [
    { id: 1, name: "lyra-react", desc: "Componentes React", status: <Badge tone="success" dot>Ativo</Badge>, team: ["Ana Souza", "Léo Lima", "Bia Reis"], updated: "há 2h" },
    { id: 2, name: "lyra-vue", desc: "Componentes Vue 3", status: <Badge tone="success" dot>Ativo</Badge>, team: ["Caio Melo", "Ana Souza"], updated: "ontem" },
    { id: 3, name: "lyra-blade", desc: "Componentes Laravel Blade", status: <Badge tone="warning" dot>Beta</Badge>, team: ["Duda Reis"], updated: "há 3 dias" },
    { id: 4, name: "lyra_liveview", desc: "Phoenix LiveView", status: <Badge tone="info" dot>Em dev</Badge>, team: ["Léo Lima", "Bia Reis"], updated: "há 4 dias" },
  ];
  return (
    <div className="ld-stack">
      <div className="ld-toolbar">
        <Tabs active={tab} onChange={setTab} items={[
          { id: "ativos", label: "Ativos", count: 4 },
          { id: "arquivados", label: "Arquivados", count: 2 },
        ]} />
        <div className="ld-toolbar__right">
          <Input iconLeft={<Icon name="search" size={16} />} placeholder="Filtrar projetos…" size="sm" />
          <Button iconLeft={<Icon name="plus" size={16} />} onClick={() => setOpen(true)}>Novo projeto</Button>
        </div>
      </div>
      {tab === "ativos" ? (
        <div className="ld-grid-2">
          {projects.map((p) => (
            <Card key={p.id} interactive padded>
              <div className="ld-proj">
                <div className="ld-proj__head">
                  <span className="ld-proj__name">{p.name}</span>
                  {p.status}
                </div>
                <p className="ld-proj__desc">{p.desc}</p>
                <div className="ld-proj__foot">
                  <AvatarGroup>
                    {p.team.map((t) => <Avatar key={t} name={t} size="sm" />)}
                  </AvatarGroup>
                  <span className="ld-proj__time">atualizado {p.updated}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card padded={false}>
          <EmptyState
            icon={<Icon name="archive" size={24} />}
            title="Nada arquivado por aqui"
            description="Projetos arquivados aparecem nesta aba. Você pode arquivar um projeto pelo menu de contexto."
          />
        </Card>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Novo projeto"
        footer={
          <React.Fragment>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => setOpen(false)}>Criar projeto</Button>
          </React.Fragment>
        }
      >
        <div className="ld-stack" style={{ gap: "var(--space-4)" }}>
          <Input label="Nome" placeholder="ex.: lyra-svelte" />
          <Select label="Framework" defaultValue="react">
            <option value="react">React</option>
            <option value="vue">Vue</option>
            <option value="laravel">Laravel Blade</option>
            <option value="phoenix">Phoenix LiveView</option>
          </Select>
          <Textarea label="Descrição" placeholder="O que esse pacote cobre?" rows={3} />
        </div>
      </Dialog>
    </div>
  );
}

function SettingsScreen() {
  const toast = useToastSet();
  return (
    <div className="ld-settings">
      <Card title="Perfil">
        <div className="ld-stack" style={{ gap: "var(--space-4)" }}>
          <FormRow>
            <Input label="Nome" defaultValue="Ana Souza" />
            <Input label="E-mail" defaultValue="ana@lyra.dev" hint="Usado para notificações." />
          </FormRow>
          <Input label="GitHub" defaultValue="github.com/anasouza" iconLeft={<Icon name="github" size={16} />} />
        </div>
      </Card>
      <Card title="Preferências">
        <div className="ld-stack" style={{ gap: "var(--space-3)" }}>
          <Switch label="Notificações por e-mail" defaultChecked />
          <Switch label="Resumo semanal do projeto" defaultChecked />
          <Switch label="Avisos de breaking change" />
          <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <Checkbox label="Participar do programa beta" defaultChecked />
            <Checkbox label="Compartilhar telemetria anônima" />
          </div>
          <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: "var(--space-3)" }}>
            <RadioGroup
              label="Frequência do resumo"
              direction="row"
              defaultValue="weekly"
              options={[
                { value: "realtime", label: "Tempo real" },
                { value: "daily", label: "Diário" },
                { value: "weekly", label: "Semanal" },
              ]}
            />
          </div>
        </div>
      </Card>
      <Card title="Zona de perigo">
        <div className="ld-danger-row">
          <div>
            <p className="ld-danger-row__t">Excluir workspace</p>
            <p className="ld-danger-row__d">Remove todos os projetos e membros. Essa ação não pode ser desfeita.</p>
          </div>
          <Button variant="danger">Excluir</Button>
        </div>
      </Card>
      <div className="ld-settings__save">
        <Button variant="secondary" onClick={() => toast.info("Alterações descartadas.")}>Descartar</Button>
        <Button iconLeft={<Icon name="check" size={16} />} onClick={() => toast.success("Alterações salvas.")}>Salvar alterações</Button>
      </div>
    </div>
  );
}

function PlaceholderScreen({ icon, title, desc }) {
  return (
    <Card padded={false}>
      <EmptyState
        icon={<Icon name={icon} size={24} />}
        title={title}
        description={desc}
      />
    </Card>
  );
}

Object.assign(window, { OverviewScreen, ProjectsScreen, SettingsScreen, PlaceholderScreen });
