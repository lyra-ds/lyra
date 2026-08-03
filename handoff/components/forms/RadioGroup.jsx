import React from "react";
import { Radio } from "./Radio.jsx";

/**
 * Grupo de radios com label, hint/erro e opções com descrição.
 */
export function RadioGroup({ label, hint, error, options = [], value, defaultValue, onChange, name, direction = "column", className = "", ...rest }) {
  const [val, setVal] = React.useState(defaultValue);
  const cur = value !== undefined ? value : val;
  const autoName = React.useId();
  const groupName = name || autoName;
  return (
    <div className={["lyra-field", className].filter(Boolean).join(" ")} role="radiogroup" {...rest}>
      {label && <span className="lyra-label">{label}</span>}
      <div className={["lyra-choicegroup", direction === "row" && "lyra-choicegroup--row"].filter(Boolean).join(" ")}>
        {options.map((o) => (
          <Radio
            key={o.value}
            name={groupName}
            checked={cur === o.value}
            disabled={o.disabled}
            onChange={() => { if (value === undefined) setVal(o.value); onChange && onChange(o.value); }}
            label={o.hint ? <span className="lyra-choice"><span>{o.label}</span><span className="lyra-choice__hint">{o.hint}</span></span> : o.label}
          />
        ))}
      </div>
      {error ? <span className="lyra-hint lyra-hint--error">{error}</span> : hint ? <span className="lyra-hint">{hint}</span> : null}
    </div>
  );
}
