import React from "react";

/**
 * Cabeçalho de página — eyebrow, título h1, descrição e ações à direita.
 * children (tabs, filtros) renderizam abaixo da linha principal.
 */
export function PageHeader({ eyebrow, title, description, actions, className = "", children, ...rest }) {
  return (
    <header className={["lyra-pageheader", className].filter(Boolean).join(" ")} {...rest}>
      <div className="lyra-pageheader__row">
        <div className="lyra-pageheader__text">
          {eyebrow && <span className="lyra-pageheader__eyebrow">{eyebrow}</span>}
          <h1 className="lyra-pageheader__title">{title}</h1>
          {description && <p className="lyra-pageheader__desc">{description}</p>}
        </div>
        {actions && <div className="lyra-pageheader__actions">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
