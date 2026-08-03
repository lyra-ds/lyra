import React from "react";

/**
 * Fieldset semântico — legenda, descrição e pilha de campos.
 */
export function Fieldset({ legend, description, className = "", children, ...rest }) {
  return (
    <fieldset className={["lyra-fieldset", className].filter(Boolean).join(" ")} {...rest}>
      {legend && <legend className="lyra-fieldset__legend">{legend}</legend>}
      {description && <p className="lyra-fieldset__desc">{description}</p>}
      <div className="lyra-fieldset__fields">{children}</div>
    </fieldset>
  );
}

/**
 * Linha de formulário — campos lado a lado em colunas iguais,
 * colapsa para uma coluna em telas estreitas.
 */
export function FormRow({ columns, className = "", style, children, ...rest }) {
  const n = columns || React.Children.count(children);
  return (
    <div className={["lyra-formrow", className].filter(Boolean).join(" ")} style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, ...style }} {...rest}>
      {children}
    </div>
  );
}
