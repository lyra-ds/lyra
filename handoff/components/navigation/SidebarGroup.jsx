import React from "react";
import { Icon } from "../icons/Icon.jsx";

/**
 * Agrupador de itens de menu para sidebar — label de seção, opcionalmente
 * colapsável, com itens [{ id, label, icon?, badge?, active?, onSelect? }].
 */
export function SidebarGroup({
  label,
  items = [],
  collapsible = false,
  defaultCollapsed = false,
  onSelect,
  className = "",
  children,
  ...rest
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  return (
    <div className={["lyra-sbgroup", collapsed && "lyra-sbgroup--collapsed", className].filter(Boolean).join(" ")} {...rest}>
      {label && (
        collapsible ? (
          <button type="button" className="lyra-sbgroup__label lyra-sbgroup__label--btn" aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>
            <span>{label}</span>
            <Icon name="chevron-down" size={13} className="lyra-sbgroup__chev" />
          </button>
        ) : (
          <span className="lyra-sbgroup__label">{label}</span>
        )
      )}
      {!collapsed && (
        <div className="lyra-sbgroup__items">
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              className={["lyra-sbgroup__item", item.active && "lyra-sbgroup__item--active"].filter(Boolean).join(" ")}
              aria-current={item.active ? "page" : undefined}
              onClick={() => { item.onSelect && item.onSelect(); onSelect && onSelect(item.id, item); }}
            >
              {item.icon && <span className="lyra-sbgroup__item-icon">{item.icon}</span>}
              <span className="lyra-sbgroup__item-label">{item.label}</span>
              {item.badge != null && <span className="lyra-sbgroup__item-badge">{item.badge}</span>}
            </button>
          ))}
          {children}
        </div>
      )}
    </div>
  );
}
