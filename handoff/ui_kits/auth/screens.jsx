/* Lyra Auth UI kit — telas de login, cadastro e recuperação */
const {
  Button, Input, Checkbox, Select, Icon, Alert, Stepper, Badge, Avatar, Progress, Separator,
} = window.LyraDesignSystem_e82d95;

function BrandPanel() {
  return (
    <aside className="la-brand">
      <div className="la-brand__top">
        <img src="../../assets/lyra-mark-light.svg" alt="" className="la-brand__mark" />
        <span className="la-brand__word">Lyra</span>
      </div>
      <div className="la-brand__center">
        <h2 className="la-brand__headline">Componentes que escalam do protótipo à produção.</h2>
        <p className="la-brand__sub">Open source para React, Vue, Laravel e Phoenix LiveView.</p>
      </div>
      <figure className="la-quote">
        <blockquote className="la-quote__text">"Migramos três produtos para o Lyra em duas semanas. O modo escuro veio de graça."</blockquote>
        <figcaption className="la-quote__author">
          <Avatar name="Caio Melo" size="sm" />
          <span>Caio Melo · eng. front-end</span>
        </figcaption>
      </figure>
    </aside>
  );
}

function LoginScreen({ go }) {
  const [loading, setLoading] = React.useState(false);
  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); go("done"); }, 900);
  };
  return (
    <div className="la-card">
      <h1 className="la-title">Entrar no Lyra</h1>
      <p className="la-sub">Bem-vindo de volta. Acesse seu workspace.</p>
      <Button variant="secondary" full iconLeft={<Icon name="github" size={18} />}>Continuar com GitHub</Button>
      <Separator label="ou com e-mail" style={{ color: "var(--text-faint)" }} />
      <form className="la-form" onSubmit={submit}>
        <Input label="E-mail" type="email" placeholder="voce@exemplo.dev" required />
        <div>
          <Input label="Senha" type="password" placeholder="••••••••" required />
          <div className="la-row la-row--between" style={{ marginTop: 8 }}>
            <Checkbox label="Lembrar de mim" />
            <button type="button" className="la-link" onClick={() => go("forgot")}>Esqueci a senha</button>
          </div>
        </div>
        <Button full size="lg" loading={loading} type="submit">Entrar</Button>
      </form>
      <p className="la-foot">Não tem conta? <button className="la-link" onClick={() => go("signup")}>Criar conta gratuita</button></p>
    </div>
  );
}

function SignupScreen({ go }) {
  const [step, setStep] = React.useState(0);
  const [pwd, setPwd] = React.useState("");
  const strength = Math.min(100, pwd.length * 12);
  return (
    <div className="la-card la-card--wide">
      <h1 className="la-title">Criar conta</h1>
      <p className="la-sub">Gratuito para projetos open source, para sempre.</p>
      <Stepper steps={["Conta", "Workspace", "Confirmação"]} active={step} style={{ marginBottom: "var(--space-2)" }} />
      {step === 0 && (
        <form className="la-form" onSubmit={(e) => { e.preventDefault(); setStep(1); }}>
          <Input label="E-mail" type="email" placeholder="voce@exemplo.dev" required />
          <div>
            <Input label="Senha" type="password" placeholder="Mínimo de 8 caracteres" required value={pwd} onChange={(e) => setPwd(e.target.value)} />
            {pwd.length > 0 && (
              <div className="la-strength">
                <Progress value={strength} tone={strength < 50 ? "danger" : strength < 90 ? undefined : "success"} />
                <span>{strength < 50 ? "Fraca" : strength < 90 ? "Boa" : "Forte"}</span>
              </div>
            )}
          </div>
          <Button full size="lg" type="submit" iconRight={<Icon name="arrow-right" size={16} />}>Continuar</Button>
        </form>
      )}
      {step === 1 && (
        <form className="la-form" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
          <Input label="Nome do workspace" placeholder="ex.: Time Aurora" required />
          <Select label="Framework principal" defaultValue="react">
            <option value="react">React</option>
            <option value="vue">Vue</option>
            <option value="laravel">Laravel Blade</option>
            <option value="phoenix">Phoenix LiveView</option>
          </Select>
          <div className="la-row">
            <Button variant="secondary" onClick={() => setStep(0)} iconLeft={<Icon name="arrow-left" size={16} />}>Voltar</Button>
            <Button style={{ flex: 1 }} size="lg" type="submit" iconRight={<Icon name="arrow-right" size={16} />}>Continuar</Button>
          </div>
        </form>
      )}
      {step === 2 && (
        <form className="la-form" onSubmit={(e) => { e.preventDefault(); go("done"); }}>
          <Alert tone="info" icon={<Icon name="mail" size={18} />}>
            Enviamos um código de confirmação para o seu e-mail.
          </Alert>
          <Input label="Código de verificação" placeholder="000 000" required style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }} />
          <Checkbox label="Aceito os termos de uso e a política de privacidade" required />
          <div className="la-row">
            <Button variant="secondary" onClick={() => setStep(1)} iconLeft={<Icon name="arrow-left" size={16} />}>Voltar</Button>
            <Button style={{ flex: 1 }} size="lg" type="submit">Criar conta</Button>
          </div>
        </form>
      )}
      <p className="la-foot">Já tem conta? <button className="la-link" onClick={() => go("login")}>Entrar</button></p>
    </div>
  );
}

function ForgotScreen({ go }) {
  const [sent, setSent] = React.useState(false);
  return (
    <div className="la-card">
      <h1 className="la-title">Recuperar senha</h1>
      <p className="la-sub">Enviaremos um link de redefinição para o seu e-mail.</p>
      {sent ? (
        <div className="la-form">
          <Alert tone="success" icon={<Icon name="circle-check" size={18} />} title="Link enviado">
            Confira sua caixa de entrada. O link vale por 30 minutos.
          </Alert>
          <Button variant="secondary" full onClick={() => go("login")} iconLeft={<Icon name="arrow-left" size={16} />}>Voltar para o login</Button>
        </div>
      ) : (
        <form className="la-form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          <Input label="E-mail" type="email" placeholder="voce@exemplo.dev" required />
          <Button full size="lg" type="submit">Enviar link</Button>
          <Button variant="ghost" full onClick={() => go("login")}>Voltar para o login</Button>
        </form>
      )}
    </div>
  );
}

function DoneScreen({ go }) {
  return (
    <div className="la-card la-card--center">
      <div className="la-done-icon"><Icon name="circle-check" size={28} /></div>
      <h1 className="la-title">Tudo pronto!</h1>
      <p className="la-sub">Sua conta está ativa. Esse seria o redirect para o painel.</p>
      <Badge tone="success" dot>Sessão autenticada</Badge>
      <div className="la-row" style={{ marginTop: "var(--space-4)" }}>
        <Button variant="secondary" onClick={() => go("login")}>Reiniciar fluxo</Button>
        <Button iconRight={<Icon name="arrow-up-right" size={16} />} onClick={() => { window.location.href = "../dashboard/index.html"; }}>Abrir painel</Button>
      </div>
    </div>
  );
}

Object.assign(window, { BrandPanel, LoginScreen, SignupScreen, ForgotScreen, DoneScreen });
