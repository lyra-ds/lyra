# UI kit · Lyra Auth

Fluxo de autenticação completo do Lyra, em layout split (painel de marca night-indigo + formulário).

- `index.html` — fluxo interativo: **Login** (GitHub + e-mail/senha), **Cadastro** em 3 etapas com Stepper (conta → workspace → código de verificação), **Recuperar senha** (form → confirmação) e tela de **Sucesso** com link para o painel.
- `screens.jsx` — `BrandPanel`, `LoginScreen`, `SignupScreen`, `ForgotScreen`, `DoneScreen`.

Detalhes de design: medidor de força de senha com `Progress`, divider "ou com e-mail", quote de comunidade no painel de marca. Composto com os primitivos via `window.LyraDesignSystem_e82d95`.
