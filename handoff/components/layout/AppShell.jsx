import React from "react";

/**
 * Casca de app — sidebar fixa à esquerda, topbar opcional e conteúdo rolável.
 * Ocupa 100% da altura do pai (defina height no wrapper ou use 100vh).
 */
export function AppShell({ sidebar, topbar, padded = true, className = "", children, ...rest }) {
  return (
    <div className={["lyra-appshell", className].filter(Boolean).join(" ")} {...rest}>
      {sidebar && <div className="lyra-appshell__sidebar">{sidebar}</div>}
      <div className="lyra-appshell__main">
        {topbar && <div className="lyra-appshell__topbar">{topbar}</div>}
        <main className={["lyra-appshell__content", padded && "lyra-appshell__content--padded"].filter(Boolean).join(" ")}>{children}</main>
      </div>
    </div>
  );
}
