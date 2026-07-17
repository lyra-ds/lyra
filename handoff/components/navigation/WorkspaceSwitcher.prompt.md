Seletor de workspace/tenant. Combine com `CreateWorkspaceDialog` para o fluxo completo de criação.

```jsx
const [ws, setWs] = React.useState("acme");
const [creating, setCreating] = React.useState(false);
<WorkspaceSwitcher
  workspaces={[
    { id: "acme", name: "Acme Inc", plan: "Pro", members: 12 },
    { id: "lab", name: "Lyra Labs", plan: "Free", members: 3 },
  ]}
  current={ws}
  onChange={setWs}
  onCreate={() => setCreating(true)}
/>
<CreateWorkspaceDialog open={creating} onClose={() => setCreating(false)} onCreate={(data) => console.log(data)} />
```
