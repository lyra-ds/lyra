import React from "react";
import { SidebarGroup } from "./SidebarGroup.jsx";
import { Icon } from "../icons/Icon.jsx";

/**
 * Casca de navegação lateral de app — brand no topo, grupos de menu,
 * footer com links utilitários e/ou card de usuário. Largura padrão 260px.
 * `collapsible` mostra o botão de recolher para modo rail (64px, só ícones).
 */
export function AppSidebar({ brand, groups = [], footer, width = 260, onSelect, collapsible = false, collapsed: collapsedProp, defaultCollapsed = false, onCollapsedChange, className = "", style, children, ...rest }) {
  const [collapsedState, setCollapsedState] = React.useState(defaultCollapsed);
  const collapsed = collapsedProp != null ? collapsedProp : collapsedState;
  const toggle = () => {
    const v = !collapsed;
    if (collapsedProp == null) setCollapsedState(v);
    onCollapsedChange && onCollapsedChange(v);
  };
  return (
    <nav className={["lyra-appsidebar", collapsed && "lyra-appsidebar--rail", className].filter(Boolean).join(" ")} style={{ width: collapsed ? 64 : width, ...style }} {...rest}>
      {brand && <div className="lyra-appsidebar__brand">{brand}</div>}
      <div className="lyra-appsidebar__groups">
        {groups.map((g, i) => (
          <SidebarGroup
            key={g.heading != null ? g.heading : i}
            label={collapsed ? undefined : g.heading}
            items={collapsed ? g.items.map((it) => ({ ...it, title: typeof it.label === "string" ? it.label : undefined })) : g.items}
            onSelect={onSelect}
          />
        ))}
        {children}
      </div>
      {footer && <div className="lyra-appsidebar__footer">{footer}</div>}
      {collapsible && (
        <button type="button" className="lyra-appsidebar__toggle" aria-label={collapsed ? "Expandir menu" : "Recolher menu"} title={collapsed ? "Expandir" : "Recolher"} onClick={toggle}>
          <Icon name={collapsed ? "chevrons-right" : "chevrons-left"} size={15} />
        </button>
      )}
    </nav>
  );
}
