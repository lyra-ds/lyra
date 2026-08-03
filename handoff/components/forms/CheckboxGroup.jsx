import React from "react";
import { Checkbox } from "./Checkbox.jsx";

/**
 * Grupo de checkboxes com label, hint/erro — valor é array de strings.
 */
export function CheckboxGroup({ label, hint, error, options = [], value, defaultValue = [], onChange, direction = "column", className = "", ...rest }) {
  const [val, setVal] = React.useState(defaultValue);
  const cur = value !== undefined ? value : val;
  const toggle = (v) => {
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    if (value === undefined) setVal(next);
    onChange && onChange(next);
  };
  return (
    <div className={["lyra-field", className].filter(Boolean).join(" ")} role="group" {...rest}>
      {label && <span className="lyra-label">{label}</span>}
      <div className={["lyra-choicegroup", direction === "row" && "lyra-choicegroup--row"].filter(Boolean).join(" ")}>
        {options.map((o) => (
          <Checkbox
            key={o.value}
            checked={cur.includes(o.value)}
            disabled={o.disabled}
            onChange={() => toggle(o.value)}
            label={o.hint ? <span className="lyra-choice"><span>{o.label}</span><span className="lyra-choice__hint">{o.hint}</span></span> : o.label}
          />
        ))}
      </div>
      {error ? <span className="lyra-hint lyra-hint--error">{error}</span> : hint ? <span className="lyra-hint">{hint}</span> : null}
    </div>
  );
}
