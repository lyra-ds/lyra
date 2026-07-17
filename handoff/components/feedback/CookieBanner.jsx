import React from "react";
import { Button } from "../buttons/Button.jsx";

/**
 * Banner de consentimento de cookies (LGPD).
 * Persiste a escolha em localStorage (storageKey) e some sozinho;
 * callbacks opcionais recebem a decisão.
 */
export function CookieBanner({
  storageKey = "lyra-cookie-consent",
  policyHref = "#",
  onAccept,
  onEssentials,
  className = "",
  children,
  ...rest
}) {
  const [visible, setVisible] = React.useState(() => {
    try { return !localStorage.getItem(storageKey); } catch (e) { return true; }
  });
  if (!visible) return null;
  const decide = (value, cb) => {
    try { localStorage.setItem(storageKey, value); } catch (e) {}
    setVisible(false);
    cb && cb();
  };
  return (
    <div className={["lyra-cookies", className].filter(Boolean).join(" ")} role="region" aria-label="Aviso de cookies" {...rest}>
      <p className="lyra-cookies__text">
        {children || (
          <React.Fragment>
            Usamos cookies para melhorar sua experiência, conforme a LGPD.
            Você pode aceitar todos ou manter apenas os essenciais.{" "}
            <a href={policyHref}>Política de privacidade</a>
          </React.Fragment>
        )}
      </p>
      <div className="lyra-cookies__actions">
        <Button variant="secondary" size="sm" onClick={() => decide("essentials", onEssentials)}>Somente essenciais</Button>
        <Button size="sm" onClick={() => decide("all", onAccept)}>Aceitar todos</Button>
      </div>
    </div>
  );
}
