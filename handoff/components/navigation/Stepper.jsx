import React from "react";

/**
 * Stepper horizontal para fluxos multi-etapa (cadastro, onboarding, checkout).
 * steps: array de labels; active: índice 0-based.
 */
export function Stepper({ steps = [], active = 0, className = "", ...rest }) {
  return (
    <div className={["lyra-stepper", className].filter(Boolean).join(" ")} {...rest}>
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className={["lyra-step__line", i <= active && "lyra-step__line--done"].filter(Boolean).join(" ")}></span>}
          <span className={["lyra-step", i === active && "lyra-step--active", i < active && "lyra-step--done"].filter(Boolean).join(" ")}>
            <span className="lyra-step__dot">
              {i < active ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                i + 1
              )}
            </span>
            <span className="lyra-step__label">{label}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
