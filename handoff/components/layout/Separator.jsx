import React from "react";

/**
 * Divisor horizontal (hr), vertical ou com label central.
 */
export function Separator({ orientation = "horizontal", label, className = "", ...rest }) {
  if (label) {
    return (
      <div className={["lyra-separator--label", className].filter(Boolean).join(" ")} role="separator" {...rest}>{label}</div>
    );
  }
  if (orientation === "vertical") {
    return <span className={["lyra-separator lyra-separator--vertical", className].filter(Boolean).join(" ")} role="separator" aria-orientation="vertical" {...rest}></span>;
  }
  return <hr className={["lyra-separator", className].filter(Boolean).join(" ")} {...rest} />;
}
