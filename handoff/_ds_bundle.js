/* @ds-bundle: {"format":4,"namespace":"LyraDesignSystem_e82d95","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"EmptyState","sourcePath":"components/data/EmptyState.jsx"},{"name":"Stat","sourcePath":"components/data/Stat.jsx"},{"name":"Table","sourcePath":"components/data/Table.jsx"},{"name":"Accordion","sourcePath":"components/display/Accordion.jsx"},{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"AvatarGroup","sourcePath":"components/display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"Tag","sourcePath":"components/display/Tag.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"CookieBanner","sourcePath":"components/feedback/CookieBanner.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Drawer","sourcePath":"components/feedback/Drawer.jsx"},{"name":"Progress","sourcePath":"components/feedback/Progress.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"ToastStack","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"FileManager","sourcePath":"components/files/FileManager.jsx"},{"name":"FileUpload","sourcePath":"components/files/FileUpload.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Combobox","sourcePath":"components/forms/Combobox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"CommandPalette","sourcePath":"components/navigation/CommandPalette.jsx"},{"name":"CreateWorkspaceDialog","sourcePath":"components/navigation/CreateWorkspaceDialog.jsx"},{"name":"Dropdown","sourcePath":"components/navigation/Dropdown.jsx"},{"name":"Pagination","sourcePath":"components/navigation/Pagination.jsx"},{"name":"SidebarGroup","sourcePath":"components/navigation/SidebarGroup.jsx"},{"name":"Stepper","sourcePath":"components/navigation/Stepper.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"WorkspaceSwitcher","sourcePath":"components/navigation/WorkspaceSwitcher.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"5764cff07993","components/buttons/IconButton.jsx":"a875b0a5d868","components/data/EmptyState.jsx":"f1893ad120a9","components/data/Stat.jsx":"1b9b43ecc278","components/data/Table.jsx":"00098fafd75a","components/display/Accordion.jsx":"d3b08a3736af","components/display/Avatar.jsx":"7cd8ce8a07cb","components/display/Badge.jsx":"b2f1cd870905","components/display/Card.jsx":"5ae5916a0a11","components/display/Tag.jsx":"396f2c1f26b4","components/feedback/Alert.jsx":"0e1e98269db1","components/feedback/CookieBanner.jsx":"37985a6822a5","components/feedback/Dialog.jsx":"a1cbdab14b71","components/feedback/Drawer.jsx":"494b745a57e2","components/feedback/Progress.jsx":"d4ddd935342d","components/feedback/Skeleton.jsx":"91743d98901a","components/feedback/Spinner.jsx":"7b267ebb575c","components/feedback/Toast.jsx":"a63aa19bfb25","components/feedback/Tooltip.jsx":"780d1137a920","components/files/FileManager.jsx":"add809a87e24","components/files/FileUpload.jsx":"69a8bc4e9c15","components/forms/Checkbox.jsx":"129da85e843f","components/forms/Combobox.jsx":"e6daebf2ed9a","components/forms/Input.jsx":"477a3cc34cb9","components/forms/Radio.jsx":"a1a923e8fb06","components/forms/Select.jsx":"ed878517f90a","components/forms/Switch.jsx":"dd42eeb7f9e0","components/forms/Textarea.jsx":"9b813f8e6d79","components/icons/Icon.jsx":"273eb506dcab","components/navigation/Breadcrumb.jsx":"a35cf1c5d39b","components/navigation/CommandPalette.jsx":"a3032ac8b211","components/navigation/CreateWorkspaceDialog.jsx":"bc4443d96d3e","components/navigation/Dropdown.jsx":"d9a1e2e5f2ce","components/navigation/Pagination.jsx":"291b5323bb19","components/navigation/SidebarGroup.jsx":"0960445b259e","components/navigation/Stepper.jsx":"81a7ba2eec99","components/navigation/Tabs.jsx":"2024f771cc82","components/navigation/WorkspaceSwitcher.jsx":"778da8bbf2e8","explorations/design-canvas.jsx":"bd8746af6e58","ui_kits/auth/screens.jsx":"c70c9396026b","ui_kits/dashboard/screens-admin.jsx":"b08f3f868ebf","ui_kits/dashboard/screens-files.jsx":"eb279cf99e18","ui_kits/dashboard/screens.jsx":"487869936da7","ui_kits/dashboard/shell.jsx":"f9140c754d79","ui_kits/website/docs.jsx":"55f4e790fc42","ui_kits/website/sections-marketing.jsx":"f276fb5cf615","ui_kits/website/sections.jsx":"d863176ee952"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LyraDesignSystem_e82d95 = window.LyraDesignSystem_e82d95 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Botão padrão do Lyra DS.
 * Variants: primary | secondary | soft | ghost | danger. Sizes: sm | md | lg.
 */
function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  full = false,
  className = "",
  children,
  ...rest
}) {
  const cls = ["lyra-btn", `lyra-btn--${variant}`, `lyra-btn--${size}`, loading && "lyra-btn--loading", full && "lyra-btn--full", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls,
    disabled: disabled || loading
  }, rest), loading && /*#__PURE__*/React.createElement("span", {
    className: "lyra-btn__spinner",
    "aria-hidden": "true"
  }), iconLeft, children != null && /*#__PURE__*/React.createElement("span", {
    className: "lyra-btn__label"
  }, children), iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Botão quadrado só-ícone. Sempre passe `label` (vira aria-label).
 */
function IconButton({
  variant = "secondary",
  size = "md",
  label,
  className = "",
  children,
  ...rest
}) {
  const cls = ["lyra-btn", "lyra-btn--icon", `lyra-btn--${variant}`, `lyra-btn--${size}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls,
    "aria-label": label,
    title: label
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Estado vazio com ícone, título, descrição e ação.
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-empty", className].filter(Boolean).join(" ")
  }, rest), icon && /*#__PURE__*/React.createElement("div", {
    className: "lyra-empty__icon"
  }, icon), /*#__PURE__*/React.createElement("h3", {
    className: "lyra-empty__title"
  }, title), description && /*#__PURE__*/React.createElement("p", {
    className: "lyra-empty__desc"
  }, description), action && /*#__PURE__*/React.createElement("div", {
    className: "lyra-empty__action"
  }, action));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/data/Stat.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Métrica numérica com rótulo e variação opcional.
 */
function Stat({
  label,
  value,
  delta,
  direction = "flat",
  className = "",
  ...rest
}) {
  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-stat", className].filter(Boolean).join(" ")
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "lyra-stat__label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "lyra-stat__value"
  }, value), delta != null && /*#__PURE__*/React.createElement("span", {
    className: `lyra-stat__delta lyra-stat__delta--${direction}`
  }, arrow, " ", delta));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Stat.jsx", error: String((e && e.message) || e) }); }

// components/data/Table.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tabela de dados. columns: [{ key, label, align? }], rows: objetos.
 * Valores podem ser ReactNode (badges, avatares…).
 */
function Table({
  columns = [],
  rows = [],
  hover = false,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-table-wrap", className].filter(Boolean).join(" ")
  }, rest), /*#__PURE__*/React.createElement("table", {
    className: ["lyra-table", hover && "lyra-table--hover"].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: c.align ? {
      textAlign: c.align
    } : undefined
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r.id != null ? r.id : i
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    style: c.align ? {
      textAlign: c.align
    } : undefined
  }, r[c.key])))))));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Table.jsx", error: String((e && e.message) || e) }); }

// components/display/Accordion.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Accordion — lista de itens expansíveis. items: [{ id, title, content }].
 * Por padrão um aberto por vez; `multiple` permite vários.
 */
function Accordion({
  items = [],
  defaultOpen,
  multiple = false,
  className = "",
  ...rest
}) {
  const [open, setOpen] = React.useState(() => new Set(defaultOpen != null ? [defaultOpen] : []));
  const toggle = id => {
    setOpen(prev => {
      const next = new Set(multiple ? prev : []);
      if (prev.has(id)) next.delete(id);else next.add(id);
      return next;
    });
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-accordion", className].filter(Boolean).join(" ")
  }, rest), items.map(it => {
    const isOpen = open.has(it.id);
    return /*#__PURE__*/React.createElement("div", {
      key: it.id,
      className: ["lyra-acc__item", isOpen && "lyra-acc__item--open"].filter(Boolean).join(" ")
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "lyra-acc__trigger",
      "aria-expanded": isOpen,
      onClick: () => toggle(it.id)
    }, it.title, /*#__PURE__*/React.createElement("span", {
      className: "lyra-acc__chevron",
      "aria-hidden": "true"
    })), isOpen && /*#__PURE__*/React.createElement("div", {
      className: "lyra-acc__panel"
    }, it.content));
  }));
}
Object.assign(__ds_scope, { Accordion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Accordion.jsx", error: String((e && e.message) || e) }); }

// components/display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Avatar com imagem ou iniciais; ponto de status opcional.
 * shape: "circle" (padrão) | "square" (workspaces, organizações).
 */
function Avatar({
  src,
  name = "",
  size = "md",
  shape = "circle",
  status,
  className = "",
  ...rest
}) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["lyra-avatar", `lyra-avatar--${size}`, shape === "square" && "lyra-avatar--square", className].filter(Boolean).join(" "),
    title: name
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, initials), status && /*#__PURE__*/React.createElement("span", {
    className: `lyra-avatar__status lyra-avatar__status--${status}`,
    "aria-label": status
  }));
}

/**
 * Grupo de avatares sobrepostos.
 */
function AvatarGroup({
  children,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["lyra-avatar-group", className].filter(Boolean).join(" ")
  }, rest), children);
}
Object.assign(__ds_scope, { Avatar, AvatarGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge de status — cor por tom semântico, com ponto opcional.
 */
function Badge({
  tone = "neutral",
  dot = false,
  className = "",
  children,
  ...rest
}) {
  const cls = ["lyra-badge", `lyra-badge--${tone}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "lyra-badge__dot",
    "aria-hidden": "true"
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card do Lyra DS — superfície padrão para agrupar conteúdo.
 * Use `title`/`actions`/`footer` para a anatomia completa, ou só children com `padded`.
 */
function Card({
  title,
  actions,
  footer,
  padded = true,
  interactive = false,
  className = "",
  children,
  ...rest
}) {
  const cls = ["lyra-card", interactive && "lyra-card--interactive", !title && !footer && padded && "lyra-card--padded", className].filter(Boolean).join(" ");
  if (!title && !footer) {
    return /*#__PURE__*/React.createElement("div", _extends({
      className: cls
    }, rest), children);
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), title && /*#__PURE__*/React.createElement("div", {
    className: "lyra-card__header"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "lyra-card__title"
  }, title), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-2)"
    }
  }, actions)), /*#__PURE__*/React.createElement("div", {
    className: padded ? "lyra-card__body" : undefined
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "lyra-card__footer"
  }, footer));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tag neutra (com borda) para rótulos e filtros; removível com onRemove.
 */
function Tag({
  onRemove,
  className = "",
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["lyra-tag", className].filter(Boolean).join(" ")
  }, rest), children, onRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lyra-tag__remove",
    "aria-label": "Remover",
    onClick: onRemove
  }, /*#__PURE__*/React.createElement("svg", {
    width: "10",
    height: "10",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Alert inline — mensagem contextual dentro do fluxo da página.
 */
function Alert({
  tone = "info",
  title,
  icon,
  className = "",
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-alert", `lyra-alert--${tone}`, className].filter(Boolean).join(" "),
    role: "status"
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    className: "lyra-alert__icon"
  }, icon), /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("p", {
    className: "lyra-alert__title"
  }, title), /*#__PURE__*/React.createElement("p", {
    className: "lyra-alert__body"
  }, children)));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/CookieBanner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Banner de consentimento de cookies (LGPD).
 * Persiste a escolha em localStorage (storageKey) e some sozinho;
 * callbacks opcionais recebem a decisão.
 */
function CookieBanner({
  storageKey = "lyra-cookie-consent",
  policyHref = "#",
  onAccept,
  onEssentials,
  className = "",
  children,
  ...rest
}) {
  const [visible, setVisible] = React.useState(() => {
    try {
      return !localStorage.getItem(storageKey);
    } catch (e) {
      return true;
    }
  });
  if (!visible) return null;
  const decide = (value, cb) => {
    try {
      localStorage.setItem(storageKey, value);
    } catch (e) {}
    setVisible(false);
    cb && cb();
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-cookies", className].filter(Boolean).join(" "),
    role: "region",
    "aria-label": "Aviso de cookies"
  }, rest), /*#__PURE__*/React.createElement("p", {
    className: "lyra-cookies__text"
  }, children || /*#__PURE__*/React.createElement(React.Fragment, null, "Usamos cookies para melhorar sua experi\xEAncia, conforme a LGPD. Voc\xEA pode aceitar todos ou manter apenas os essenciais.", " ", /*#__PURE__*/React.createElement("a", {
    href: policyHref
  }, "Pol\xEDtica de privacidade"))), /*#__PURE__*/React.createElement("div", {
    className: "lyra-cookies__actions"
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => decide("essentials", onEssentials)
  }, "Somente essenciais"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    onClick: () => decide("all", onAccept)
  }, "Aceitar todos")));
}
Object.assign(__ds_scope, { CookieBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/CookieBanner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Dialog modal controlado. Renderiza overlay + painel quando `open`.
 */
function Dialog({
  open,
  onClose,
  title,
  footer,
  className = "",
  children,
  ...rest
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "lyra-dialog-overlay",
    onClick: e => {
      if (e.target === e.currentTarget && onClose) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-dialog", className].filter(Boolean).join(" "),
    role: "dialog",
    "aria-modal": "true"
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "lyra-dialog__header"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "lyra-dialog__title"
  }, title), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lyra-tag__remove",
    style: {
      width: 28,
      height: 28
    },
    "aria-label": "Fechar",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "lyra-dialog__body"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "lyra-dialog__footer"
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Drawer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Drawer (slide-over) lateral direito — para formulários e detalhes
 * que não justificam navegação de página.
 */
function Drawer({
  open,
  onClose,
  title,
  footer,
  className = "",
  children,
  ...rest
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "lyra-drawer-overlay",
    onClick: e => {
      if (e.target === e.currentTarget && onClose) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-drawer", className].filter(Boolean).join(" "),
    role: "dialog",
    "aria-modal": "true"
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "lyra-drawer__header"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "lyra-drawer__title"
  }, title), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lyra-tag__remove",
    style: {
      width: 28,
      height: 28
    },
    "aria-label": "Fechar",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "lyra-drawer__body"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "lyra-drawer__footer"
  }, footer)));
}
Object.assign(__ds_scope, { Drawer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Drawer.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Progress.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Barra de progresso determinada (0–100).
 */
function Progress({
  value = 0,
  tone,
  className = "",
  ...rest
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-progress", tone && `lyra-progress--${tone}`, className].filter(Boolean).join(" "),
    role: "progressbar",
    "aria-valuenow": clamped,
    "aria-valuemin": 0,
    "aria-valuemax": 100
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "lyra-progress__fill",
    style: {
      width: `${clamped}%`
    }
  }));
}
Object.assign(__ds_scope, { Progress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Progress.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Skeleton de carregamento com shimmer. Dimensione via width/height.
 */
function Skeleton({
  width = "100%",
  height = 14,
  circle = false,
  className = "",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["lyra-skeleton", circle && "lyra-skeleton--circle", className].filter(Boolean).join(" "),
    style: {
      width: circle ? height : width,
      height,
      ...style
    },
    "aria-hidden": "true"
  }, rest));
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Spinner de carregamento indeterminado.
 */
function Spinner({
  size = "md",
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["lyra-spinner", `lyra-spinner--${size}`, className].filter(Boolean).join(" "),
    role: "status",
    "aria-label": "Carregando"
  }, rest));
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Toast — notificação transitória escura, canto inferior direito.
 * Use ToastStack como container fixo; Toast individual é apresentacional.
 */
function Toast({
  tone = "info",
  icon,
  onClose,
  className = "",
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-toast", className].filter(Boolean).join(" "),
    role: "status"
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    className: `lyra-toast__icon--${tone}`,
    style: {
      display: "inline-flex"
    }
  }, icon), /*#__PURE__*/React.createElement("span", null, children), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lyra-toast__close",
    "aria-label": "Fechar",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))));
}

/**
 * Container fixo (bottom-right) que empilha Toasts.
 */
function ToastStack({
  children,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-toast-stack", className].filter(Boolean).join(" ")
  }, rest), children);
}
Object.assign(__ds_scope, { Toast, ToastStack });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tooltip CSS-only — envolva o alvo e passe `tip`.
 */
function Tooltip({
  tip,
  className = "",
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["lyra-tooltip", className].filter(Boolean).join(" "),
    "data-tip": tip
  }, rest), children);
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Checkbox com rótulo embutido.
 */
function Checkbox({
  label,
  className = "",
  ...rest
}) {
  const box = /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    className: ["lyra-checkbox", className].filter(Boolean).join(" ")
  }, rest));
  if (!label) return box;
  return /*#__PURE__*/React.createElement("label", {
    className: "lyra-check-row"
  }, box, /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Campo de texto do Lyra DS, com label, hint e estado de erro embutidos.
 */
function Input({
  label,
  hint,
  error,
  size,
  iconLeft,
  id,
  className = "",
  ...rest
}) {
  const inputId = id || (label ? `lyra-in-${label.replace(/\W+/g, "-").toLowerCase()}` : undefined);
  const cls = ["lyra-input", size === "sm" && "lyra-input--sm", size === "lg" && "lyra-input--lg", error && "lyra-input--error", className].filter(Boolean).join(" ");
  const control = iconLeft ? /*#__PURE__*/React.createElement("span", {
    className: "lyra-input-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lyra-input-wrap__icon"
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    className: cls
  }, rest))) : /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    className: cls
  }, rest));
  if (!label && !hint && !error) return control;
  return /*#__PURE__*/React.createElement("div", {
    className: "lyra-field"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "lyra-label",
    htmlFor: inputId
  }, label), control, error ? /*#__PURE__*/React.createElement("span", {
    className: "lyra-hint lyra-hint--error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "lyra-hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Radio com rótulo embutido. Agrupe pelo atributo `name`.
 */
function Radio({
  label,
  className = "",
  ...rest
}) {
  const dot = /*#__PURE__*/React.createElement("input", _extends({
    type: "radio",
    className: ["lyra-radio", className].filter(Boolean).join(" ")
  }, rest));
  if (!label) return dot;
  return /*#__PURE__*/React.createElement("label", {
    className: "lyra-check-row"
  }, dot, /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Select nativo estilizado (chevron Lucide via CSS).
 * Passe <option>s como children.
 */
function Select({
  label,
  hint,
  error,
  size,
  id,
  className = "",
  children,
  ...rest
}) {
  const inputId = id || (label ? `lyra-sel-${label.replace(/\W+/g, "-").toLowerCase()}` : undefined);
  const cls = ["lyra-input", size === "sm" && "lyra-input--sm", size === "lg" && "lyra-input--lg", error && "lyra-input--error", className].filter(Boolean).join(" ");
  const control = /*#__PURE__*/React.createElement("span", {
    className: "lyra-select-wrap"
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: inputId,
    className: cls
  }, rest), children));
  if (!label && !hint && !error) return control;
  return /*#__PURE__*/React.createElement("div", {
    className: "lyra-field"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "lyra-label",
    htmlFor: inputId
  }, label), control, error ? /*#__PURE__*/React.createElement("span", {
    className: "lyra-hint lyra-hint--error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "lyra-hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Switch (toggle) com rótulo embutido — para estados liga/desliga imediatos.
 */
function Switch({
  label,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: ["lyra-switch", className].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "lyra-switch__track"
  }), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Área de texto multi-linha com label/hint/erro.
 */
function Textarea({
  label,
  hint,
  error,
  id,
  className = "",
  ...rest
}) {
  const inputId = id || (label ? `lyra-ta-${label.replace(/\W+/g, "-").toLowerCase()}` : undefined);
  const cls = ["lyra-input", "lyra-textarea", error && "lyra-input--error", className].filter(Boolean).join(" ");
  const control = /*#__PURE__*/React.createElement("textarea", _extends({
    id: inputId,
    className: cls
  }, rest));
  if (!label && !hint && !error) return control;
  return /*#__PURE__*/React.createElement("div", {
    className: "lyra-field"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "lyra-label",
    htmlFor: inputId
  }, label), control, error ? /*#__PURE__*/React.createElement("span", {
    className: "lyra-hint lyra-hint--error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "lyra-hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
const LUCIDE_VERSION = "0.469.0";

/**
 * Ícone do Lyra DS — renderiza ícones Lucide (open source, ISC) via CSS mask,
 * herdando a cor do texto (currentColor) como um glifo nativo.
 * Nomes: kebab-case do Lucide, ex. "arrow-right", "layout-dashboard".
 */
function Icon({
  name,
  size = 20,
  color,
  className,
  style,
  title
}) {
  const url = `https://unpkg.com/lucide-static@${LUCIDE_VERSION}/icons/${name}.svg`;
  return /*#__PURE__*/React.createElement("span", {
    role: title ? "img" : undefined,
    "aria-label": title,
    "aria-hidden": title ? undefined : "true",
    className: className,
    style: {
      display: "inline-block",
      width: size,
      height: size,
      flexShrink: 0,
      verticalAlign: "middle",
      backgroundColor: color || "currentcolor",
      WebkitMaskImage: `url(${url})`,
      maskImage: `url(${url})`,
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskSize: "100% 100%",
      maskSize: "100% 100%",
      ...style
    }
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// components/files/FileUpload.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const uploadFormatBytes = n => {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};
const uploadIconFor = (name = "") => {
  const ext = name.split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["pdf"].includes(ext)) return "file-text";
  if (["xls", "xlsx", "csv"].includes(ext)) return "file-spreadsheet";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "file-archive";
  if (["mp4", "mov", "webm"].includes(ext)) return "film";
  return "file";
};

/**
 * Upload múltiplo de arquivos — dropzone (drag & drop ou clique) + lista
 * com progresso por arquivo e remoção. Sem backend: simula o progresso
 * (uploadDuration) e chama onFiles ao adicionar / onChange a cada mudança.
 */
function FileUpload({
  label = "Arraste arquivos aqui ou clique para selecionar",
  hint,
  accept,
  maxSizeMB,
  multiple = true,
  uploadDuration = 1800,
  defaultItems = [],
  onFiles,
  onChange,
  className = "",
  ...rest
}) {
  const [items, setItems] = React.useState(defaultItems);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef(null);
  const timersRef = React.useRef({});
  React.useEffect(() => () => Object.values(timersRef.current).forEach(clearInterval), []);
  const update = fn => setItems(prev => {
    const next = fn(prev);
    onChange && onChange(next);
    return next;
  });
  const addFiles = fileList => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    onFiles && onFiles(files);
    const stamped = files.map((f, i) => {
      const tooBig = maxSizeMB && f.size > maxSizeMB * 1024 * 1024;
      return {
        id: `${Date.now()}-${i}-${f.name}`,
        name: f.name,
        size: f.size,
        progress: tooBig ? 0 : 5,
        status: tooBig ? "error" : "uploading",
        error: tooBig ? `Acima de ${maxSizeMB} MB` : undefined
      };
    });
    update(prev => multiple ? [...prev, ...stamped] : stamped.slice(0, 1));
    stamped.filter(s => s.status === "uploading").forEach(s => {
      const step = 100 / Math.max(uploadDuration / 120, 1);
      timersRef.current[s.id] = setInterval(() => {
        update(prev => prev.map(it => {
          if (it.id !== s.id) return it;
          const p = Math.min(it.progress + step * (0.6 + Math.random() * 0.8), 100);
          if (p >= 100) {
            clearInterval(timersRef.current[s.id]);
            delete timersRef.current[s.id];
            return {
              ...it,
              progress: 100,
              status: "done"
            };
          }
          return {
            ...it,
            progress: p
          };
        }));
      }, 120);
    });
  };
  const remove = id => {
    if (timersRef.current[id]) {
      clearInterval(timersRef.current[id]);
      delete timersRef.current[id];
    }
    update(prev => prev.filter(it => it.id !== id));
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-upload", className].filter(Boolean).join(" ")
  }, rest), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: ["lyra-upload__zone", dragging && "lyra-upload__zone--drag"].filter(Boolean).join(" "),
    onClick: () => inputRef.current && inputRef.current.click(),
    onDragOver: e => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: e => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "lyra-upload__zone-icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "cloud-upload",
    size: 22
  })), /*#__PURE__*/React.createElement("span", {
    className: "lyra-upload__zone-label"
  }, label), (hint || accept || maxSizeMB) && /*#__PURE__*/React.createElement("span", {
    className: "lyra-upload__zone-hint"
  }, hint || [accept, maxSizeMB && `até ${maxSizeMB} MB por arquivo`].filter(Boolean).join(" · ")), /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    type: "file",
    accept: accept,
    multiple: multiple,
    hidden: true,
    onChange: e => {
      addFiles(e.target.files);
      e.target.value = "";
    }
  })), items.length > 0 && /*#__PURE__*/React.createElement("ul", {
    className: "lyra-upload__list"
  }, items.map(it => /*#__PURE__*/React.createElement("li", {
    className: ["lyra-upload__item", it.status === "error" && "lyra-upload__item--error"].filter(Boolean).join(" "),
    key: it.id
  }, /*#__PURE__*/React.createElement("span", {
    className: "lyra-upload__item-icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.status === "error" ? "circle-alert" : uploadIconFor(it.name),
    size: 17
  })), /*#__PURE__*/React.createElement("span", {
    className: "lyra-upload__item-body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lyra-upload__item-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lyra-upload__item-name"
  }, it.name), /*#__PURE__*/React.createElement("span", {
    className: "lyra-upload__item-meta"
  }, it.status === "error" ? it.error : it.status === "done" ? uploadFormatBytes(it.size) : `${Math.round(it.progress)}%`)), it.status === "uploading" && /*#__PURE__*/React.createElement("span", {
    className: "lyra-upload__bar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lyra-upload__bar-fill",
    style: {
      width: `${it.progress}%`
    }
  }))), it.status === "done" && /*#__PURE__*/React.createElement("span", {
    className: "lyra-upload__check"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "circle-check",
    size: 17
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lyra-upload__remove",
    "aria-label": `Remover ${it.name}`,
    onClick: () => remove(it.id)
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 15
  }))))));
}
Object.assign(__ds_scope, { FileUpload });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/files/FileUpload.jsx", error: String((e && e.message) || e) }); }

// components/forms/Combobox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Combobox — select com busca. Abre um popover com campo de filtro e lista
 * de opções navegável por teclado (↑ ↓ ↵ esc).
 * options: [{ value, label, icon?, hint? }]
 */
function Combobox({
  label,
  hint,
  error,
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder = "Selecionar…",
  searchPlaceholder = "Buscar…",
  emptyMessage = "Nenhum resultado.",
  disabled,
  defaultOpen = false,
  id,
  className = "",
  ...rest
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [internal, setInternal] = React.useState(defaultValue ?? null);
  const current = value !== undefined ? value : internal;
  const rootRef = React.useRef(null);
  const searchRef = React.useRef(null);
  const listRef = React.useRef(null);
  const filtered = options.filter(o => !query || o.label.toLowerCase().includes(query.toLowerCase()));
  const selected = options.find(o => o.value === current);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = e => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  React.useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
    if (open) {
      setQuery("");
      const idx = options.findIndex(o => o.value === current);
      setActive(idx >= 0 ? idx : 0);
    }
  }, [open]);
  const pick = opt => {
    if (value === undefined) setInternal(opt.value);
    onChange && onChange(opt.value, opt);
    setOpen(false);
  };
  const onKeyDown = e => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(a => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(a => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) pick(filtered[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };
  React.useEffect(() => {
    const el = listRef.current && listRef.current.children[active];
    if (el && el.offsetTop !== undefined && listRef.current) {
      const list = listRef.current;
      if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
    }
  }, [active]);
  const inputId = id || (label ? `lyra-cbx-${label.replace(/\W+/g, "-").toLowerCase()}` : undefined);
  const control = /*#__PURE__*/React.createElement("span", _extends({
    className: ["lyra-combobox", className].filter(Boolean).join(" "),
    ref: rootRef
  }, rest), /*#__PURE__*/React.createElement("button", {
    type: "button",
    id: inputId,
    className: ["lyra-input", "lyra-combobox__trigger", error && "lyra-input--error"].filter(Boolean).join(" "),
    "aria-haspopup": "listbox",
    "aria-expanded": open,
    disabled: disabled,
    onClick: () => setOpen(!open)
  }, /*#__PURE__*/React.createElement("span", {
    className: selected ? "lyra-combobox__value" : "lyra-combobox__placeholder"
  }, selected ? /*#__PURE__*/React.createElement(React.Fragment, null, selected.icon, selected.label) : placeholder), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevrons-up-down",
    size: 15,
    color: "var(--text-faint)"
  })), open && /*#__PURE__*/React.createElement("div", {
    className: "lyra-combobox__pop"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lyra-combobox__search"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 15,
    color: "var(--text-faint)"
  }), /*#__PURE__*/React.createElement("input", {
    ref: searchRef,
    value: query,
    placeholder: searchPlaceholder,
    onChange: e => {
      setQuery(e.target.value);
      setActive(0);
    },
    onKeyDown: onKeyDown
  })), /*#__PURE__*/React.createElement("div", {
    className: "lyra-combobox__list",
    role: "listbox",
    ref: listRef
  }, filtered.length === 0 && /*#__PURE__*/React.createElement("span", {
    className: "lyra-combobox__empty"
  }, emptyMessage), filtered.map((opt, i) => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: opt.value,
    role: "option",
    "aria-selected": opt.value === current,
    className: ["lyra-combobox__option", i === active && "lyra-combobox__option--active"].filter(Boolean).join(" "),
    onMouseEnter: () => setActive(i),
    onClick: () => pick(opt)
  }, opt.icon, /*#__PURE__*/React.createElement("span", {
    className: "lyra-combobox__option-label"
  }, opt.label, opt.hint && /*#__PURE__*/React.createElement("span", {
    className: "lyra-combobox__option-hint"
  }, opt.hint)), opt.value === current && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 15,
    color: "var(--accent)"
  }))))));
  if (!label && !hint && !error) return control;
  return /*#__PURE__*/React.createElement("div", {
    className: "lyra-field"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "lyra-label",
    htmlFor: inputId
  }, label), control, error ? /*#__PURE__*/React.createElement("span", {
    className: "lyra-hint lyra-hint--error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "lyra-hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Combobox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Combobox.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Breadcrumb — trilha de navegação. items: [{ label, href? }]; o último é a página atual.
 */
function Breadcrumb({
  items = [],
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    className: ["lyra-breadcrumb", className].filter(Boolean).join(" "),
    "aria-label": "Breadcrumb"
  }, rest), items.map((it, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, i > 0 && /*#__PURE__*/React.createElement("span", {
      className: "lyra-breadcrumb__sep",
      "aria-hidden": "true"
    }), last ? /*#__PURE__*/React.createElement("span", {
      className: "lyra-breadcrumb__current",
      "aria-current": "page"
    }, it.label) : /*#__PURE__*/React.createElement("a", {
      href: it.href || "#"
    }, it.label));
  }));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/CommandPalette.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Command palette (⌘K) — busca global de comandos em overlay.
 * groups: [{ label, items: [{ id, label, icon?, hint?, shortcut?, onSelect? }] }]
 * Controlado por `open`/`onClose`; com `onOpen`, registra o atalho ⌘K / Ctrl+K.
 */
function CommandPalette({
  open = false,
  onClose,
  onOpen,
  onSelect,
  groups = [],
  placeholder = "Digite um comando ou busque…",
  emptyMessage = "Nenhum resultado para",
  hotkey = "k",
  inline = false,
  className = "",
  ...rest
}) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef(null);

  // atalho global ⌘K / Ctrl+K
  React.useEffect(() => {
    if (!hotkey || !onOpen) return;
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === hotkey) {
        e.preventDefault();
        if (open) {
          onClose && onClose();
        } else {
          onOpen();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkey, onOpen, onClose, open]);
  React.useEffect(() => {
    if (open || inline) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current && inputRef.current.focus());
    }
  }, [open, inline]);
  const q = query.toLowerCase();
  const visible = groups.map(g => ({
    ...g,
    items: g.items.filter(it => !q || it.label.toLowerCase().includes(q) || (it.hint || "").toLowerCase().includes(q))
  })).filter(g => g.items.length > 0);
  const flat = visible.flatMap(g => g.items);
  const pick = item => {
    item.onSelect && item.onSelect();
    onSelect && onSelect(item);
    onClose && onClose();
  };
  const onKeyDown = e => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(a => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(a => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[active]) pick(flat[active]);
    } else if (e.key === "Escape") {
      onClose && onClose();
    }
  };
  let cursor = -1;
  const panel = /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-cmdk", className].filter(Boolean).join(" "),
    role: "dialog",
    "aria-label": "Paleta de comandos"
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "lyra-cmdk__search"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 17,
    color: "var(--text-faint)"
  }), /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    value: query,
    placeholder: placeholder,
    onChange: e => {
      setQuery(e.target.value);
      setActive(0);
    },
    onKeyDown: onKeyDown
  }), /*#__PURE__*/React.createElement("kbd", {
    className: "lyra-kbd"
  }, "esc")), /*#__PURE__*/React.createElement("div", {
    className: "lyra-cmdk__body"
  }, flat.length === 0 && /*#__PURE__*/React.createElement("p", {
    className: "lyra-cmdk__empty"
  }, emptyMessage, " \u201C", query, "\u201D."), visible.map((g, gi) => /*#__PURE__*/React.createElement("div", {
    className: "lyra-cmdk__group",
    key: g.label || gi
  }, g.label && /*#__PURE__*/React.createElement("span", {
    className: "lyra-cmdk__group-label"
  }, g.label), g.items.map(item => {
    cursor += 1;
    const idx = cursor;
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      key: item.id,
      className: ["lyra-cmdk__item", idx === active && "lyra-cmdk__item--active"].filter(Boolean).join(" "),
      onMouseEnter: () => setActive(idx),
      onClick: () => pick(item)
    }, item.icon && /*#__PURE__*/React.createElement("span", {
      className: "lyra-cmdk__item-icon"
    }, item.icon), /*#__PURE__*/React.createElement("span", {
      className: "lyra-cmdk__item-label"
    }, item.label), item.hint && /*#__PURE__*/React.createElement("span", {
      className: "lyra-cmdk__item-hint"
    }, item.hint), item.shortcut && /*#__PURE__*/React.createElement("span", {
      className: "lyra-cmdk__shortcut"
    }, item.shortcut.split(" ").map(k => /*#__PURE__*/React.createElement("kbd", {
      className: "lyra-kbd",
      key: k
    }, k))));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "lyra-cmdk__footer"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("kbd", {
    className: "lyra-kbd"
  }, "\u2191"), /*#__PURE__*/React.createElement("kbd", {
    className: "lyra-kbd"
  }, "\u2193"), " navegar"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("kbd", {
    className: "lyra-kbd"
  }, "\u21B5"), " selecionar"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("kbd", {
    className: "lyra-kbd"
  }, "esc"), " fechar")));
  if (inline) return panel;
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "lyra-cmdk-overlay",
    onClick: e => {
      if (e.target === e.currentTarget && onClose) onClose();
    }
  }, panel);
}
Object.assign(__ds_scope, { CommandPalette });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/CommandPalette.jsx", error: String((e && e.message) || e) }); }

// components/navigation/CreateWorkspaceDialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Modal de criação de workspace — nome, slug (auto-gerado, editável) e
 * preview do avatar. Chama onCreate({ name, slug }).
 */
function CreateWorkspaceDialog({
  open = false,
  onClose,
  onCreate,
  title = "Criar workspace",
  slugPrefix = "lyra.dev/",
  ...rest
}) {
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setName("");
      setSlug("");
      setTouched(false);
    }
  }, [open]);
  const slugify = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const handleName = e => {
    setName(e.target.value);
    if (!touched) setSlug(slugify(e.target.value));
  };
  const submit = () => {
    if (!name.trim()) return;
    onCreate && onCreate({
      name: name.trim(),
      slug
    });
    onClose && onClose();
  };
  return /*#__PURE__*/React.createElement(__ds_scope.Dialog, _extends({
    open: open,
    onClose: onClose,
    title: title,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "ghost",
      onClick: onClose
    }, "Cancelar"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
      onClick: submit,
      disabled: !name.trim()
    }, "Criar workspace"))
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "lyra-wscreate"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lyra-wscreate__preview"
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name || "?",
    size: "lg",
    shape: "square"
  }), /*#__PURE__*/React.createElement("span", {
    className: "lyra-wscreate__preview-hint"
  }, "O avatar usa as iniciais do nome.")), /*#__PURE__*/React.createElement(__ds_scope.Input, {
    label: "Nome do workspace",
    placeholder: "Acme Inc",
    value: name,
    onChange: handleName
  }), /*#__PURE__*/React.createElement("div", {
    className: "lyra-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "lyra-label",
    htmlFor: "lyra-wscreate-slug"
  }, "URL"), /*#__PURE__*/React.createElement("span", {
    className: "lyra-wscreate__slug"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lyra-wscreate__slug-prefix"
  }, slugPrefix), /*#__PURE__*/React.createElement("input", {
    id: "lyra-wscreate-slug",
    className: "lyra-wscreate__slug-input",
    placeholder: "acme-inc",
    value: slug,
    onChange: e => {
      setTouched(true);
      setSlug(slugify(e.target.value));
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "lyra-hint"
  }, "Letras min\xFAsculas, n\xFAmeros e h\xEDfens."))));
}
Object.assign(__ds_scope, { CreateWorkspaceDialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/CreateWorkspaceDialog.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Dropdown.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Dropdown de ações. items: [{ id, label, icon?, danger?, onSelect? }] ou { type: "separator" } ou { type: "label", label }.
 * Fecha ao clicar fora ou selecionar. `defaultOpen` abre no primeiro render (demos).
 */
function Dropdown({
  trigger,
  items = [],
  align = "start",
  defaultOpen = false,
  className = "",
  ...rest
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["lyra-dropdown", className].filter(Boolean).join(" "),
    ref: ref
  }, rest), /*#__PURE__*/React.createElement("span", {
    onClick: () => setOpen(!open),
    style: {
      display: "inline-flex"
    }
  }, trigger), open && /*#__PURE__*/React.createElement("div", {
    className: `lyra-menu lyra-menu--${align}`,
    role: "menu"
  }, items.map((it, i) => {
    if (it.type === "separator") return /*#__PURE__*/React.createElement("hr", {
      key: i,
      className: "lyra-menu__sep"
    });
    if (it.type === "label") return /*#__PURE__*/React.createElement("span", {
      key: i,
      className: "lyra-menu__label"
    }, it.label);
    return /*#__PURE__*/React.createElement("button", {
      key: it.id || i,
      role: "menuitem",
      className: ["lyra-menu__item", it.danger && "lyra-menu__item--danger"].filter(Boolean).join(" "),
      onClick: () => {
        setOpen(false);
        it.onSelect && it.onSelect();
      }
    }, it.icon, it.label);
  })));
}
Object.assign(__ds_scope, { Dropdown });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Dropdown.jsx", error: String((e && e.message) || e) }); }

// components/files/FileManager.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const fmFormatBytes = n => {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};
const fmIconFor = file => {
  if (file.type === "folder") return "folder";
  const ext = (file.name || "").split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext)) return "file-text";
  if (["xls", "xlsx", "csv"].includes(ext)) return "file-spreadsheet";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "file-archive";
  if (["mp4", "mov", "webm"].includes(ext)) return "film";
  if (["mp3", "wav", "ogg"].includes(ext)) return "music";
  return "file";
};

/**
 * Gestor de arquivos — toolbar (busca + alternância lista/grade), breadcrumb
 * de pasta e listagem com ações por item via Dropdown.
 * files: [{ id, name, type?: "folder", size?, updated?, shared? }]
 */
function FileManager({
  files = [],
  path = [],
  view: viewProp,
  defaultView = "list",
  onViewChange,
  onOpen,
  onNavigate,
  actions,
  searchPlaceholder = "Buscar arquivos…",
  emptyMessage = "Nenhum arquivo encontrado.",
  className = "",
  ...rest
}) {
  const [query, setQuery] = React.useState("");
  const [internalView, setInternalView] = React.useState(defaultView);
  const view = viewProp || internalView;
  const setView = v => {
    setInternalView(v);
    onViewChange && onViewChange(v);
  };
  const q = query.toLowerCase();
  const visible = files.filter(f => !q || f.name.toLowerCase().includes(q));
  const folders = visible.filter(f => f.type === "folder");
  const docs = visible.filter(f => f.type !== "folder");
  const ordered = [...folders, ...docs];
  const defaultActions = file => [{
    id: "open",
    label: "Abrir",
    icon: /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "external-link",
      size: 15
    })
  }, {
    id: "rename",
    label: "Renomear",
    icon: /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "pencil",
      size: 15
    })
  }, {
    id: "download",
    label: "Baixar",
    icon: /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "download",
      size: 15
    })
  }, {
    type: "separator"
  }, {
    id: "delete",
    label: "Excluir",
    icon: /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "trash-2",
      size: 15
    }),
    danger: true
  }];
  const renderActions = file => /*#__PURE__*/React.createElement(__ds_scope.Dropdown, {
    align: "end",
    trigger: /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "lyra-fm__more",
      "aria-label": `Ações de ${file.name}`
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "ellipsis",
      size: 17
    })),
    items: actions ? actions(file) : defaultActions(file)
  });
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-fm", className].filter(Boolean).join(" ")
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "lyra-fm__toolbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lyra-fm__search"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 15,
    color: "var(--text-faint)"
  }), /*#__PURE__*/React.createElement("input", {
    value: query,
    placeholder: searchPlaceholder,
    onChange: e => setQuery(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "lyra-fm__views",
    role: "group",
    "aria-label": "Modo de exibi\xE7\xE3o"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: ["lyra-fm__view", view === "list" && "lyra-fm__view--on"].filter(Boolean).join(" "),
    "aria-pressed": view === "list",
    "aria-label": "Lista",
    onClick: () => setView("list")
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "list",
    size: 15
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: ["lyra-fm__view", view === "grid" && "lyra-fm__view--on"].filter(Boolean).join(" "),
    "aria-pressed": view === "grid",
    "aria-label": "Grade",
    onClick: () => setView("grid")
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "layout-grid",
    size: 15
  })))), path.length > 0 && /*#__PURE__*/React.createElement("nav", {
    className: "lyra-fm__path",
    "aria-label": "Pasta atual"
  }, path.map((seg, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: `${seg}-${i}`
  }, i > 0 && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 13,
    color: "var(--text-faint)"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lyra-fm__crumb",
    onClick: () => onNavigate && onNavigate(i),
    disabled: i === path.length - 1
  }, i === 0 && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "folder-open",
    size: 15
  }), seg)))), ordered.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "lyra-fm__empty"
  }, emptyMessage) : view === "list" ? /*#__PURE__*/React.createElement("ul", {
    className: "lyra-fm__list"
  }, /*#__PURE__*/React.createElement("li", {
    className: "lyra-fm__head",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", null, "Nome"), /*#__PURE__*/React.createElement("span", null, "Tamanho"), /*#__PURE__*/React.createElement("span", null, "Modificado"), /*#__PURE__*/React.createElement("span", null)), ordered.map(f => /*#__PURE__*/React.createElement("li", {
    className: "lyra-fm__row",
    key: f.id
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lyra-fm__name",
    onClick: () => onOpen && onOpen(f)
  }, /*#__PURE__*/React.createElement("span", {
    className: ["lyra-fm__icon", f.type === "folder" && "lyra-fm__icon--folder"].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: fmIconFor(f),
    size: 17
  })), /*#__PURE__*/React.createElement("span", {
    className: "lyra-fm__label"
  }, f.name), f.shared && /*#__PURE__*/React.createElement("span", {
    className: "lyra-fm__shared"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "users",
    size: 13
  }))), /*#__PURE__*/React.createElement("span", {
    className: "lyra-fm__cell"
  }, f.type === "folder" ? `${f.items ?? "—"} itens` : fmFormatBytes(f.size)), /*#__PURE__*/React.createElement("span", {
    className: "lyra-fm__cell"
  }, f.updated || "—"), /*#__PURE__*/React.createElement("span", {
    className: "lyra-fm__actions"
  }, renderActions(f))))) : /*#__PURE__*/React.createElement("div", {
    className: "lyra-fm__grid"
  }, ordered.map(f => /*#__PURE__*/React.createElement("div", {
    className: "lyra-fm__card",
    key: f.id
  }, /*#__PURE__*/React.createElement("span", {
    className: "lyra-fm__card-actions"
  }, renderActions(f)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lyra-fm__card-body",
    onClick: () => onOpen && onOpen(f)
  }, /*#__PURE__*/React.createElement("span", {
    className: ["lyra-fm__icon", "lyra-fm__icon--big", f.type === "folder" && "lyra-fm__icon--folder"].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: fmIconFor(f),
    size: 26
  })), /*#__PURE__*/React.createElement("span", {
    className: "lyra-fm__label"
  }, f.name), /*#__PURE__*/React.createElement("span", {
    className: "lyra-fm__card-meta"
  }, f.type === "folder" ? `${f.items ?? "—"} itens` : fmFormatBytes(f.size)))))));
}
Object.assign(__ds_scope, { FileManager });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/files/FileManager.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Pagination.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}
function pages(page, total) {
  if (total <= 7) return range(1, total);
  if (page <= 4) return [...range(1, 5), "…", total];
  if (page >= total - 3) return [1, "…", ...range(total - 4, total)];
  return [1, "…", page - 1, page, page + 1, "…", total];
}

/**
 * Paginação numérica com prev/next e reticências.
 */
function Pagination({
  page,
  total,
  onChange,
  className = "",
  ...rest
}) {
  const go = p => onChange && p >= 1 && p <= total && onChange(p);
  return /*#__PURE__*/React.createElement("nav", _extends({
    className: ["lyra-pagination", className].filter(Boolean).join(" "),
    "aria-label": "Pagina\xE7\xE3o"
  }, rest), /*#__PURE__*/React.createElement("button", {
    className: "lyra-page",
    disabled: page === 1,
    onClick: () => go(page - 1),
    "aria-label": "P\xE1gina anterior"
  }, "\u2039"), pages(page, total).map((p, i) => p === "…" ? /*#__PURE__*/React.createElement("span", {
    key: `gap-${i}`,
    className: "lyra-page lyra-page--gap"
  }, "\u2026") : /*#__PURE__*/React.createElement("button", {
    key: p,
    className: ["lyra-page", p === page && "lyra-page--active"].filter(Boolean).join(" "),
    "aria-current": p === page ? "page" : undefined,
    onClick: () => go(p)
  }, p)), /*#__PURE__*/React.createElement("button", {
    className: "lyra-page",
    disabled: page === total,
    onClick: () => go(page + 1),
    "aria-label": "Pr\xF3xima p\xE1gina"
  }, "\u203A"));
}
Object.assign(__ds_scope, { Pagination });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Pagination.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SidebarGroup.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Agrupador de itens de menu para sidebar — label de seção, opcionalmente
 * colapsável, com itens [{ id, label, icon?, badge?, active?, onSelect? }].
 */
function SidebarGroup({
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
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-sbgroup", collapsed && "lyra-sbgroup--collapsed", className].filter(Boolean).join(" ")
  }, rest), label && (collapsible ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lyra-sbgroup__label lyra-sbgroup__label--btn",
    "aria-expanded": !collapsed,
    onClick: () => setCollapsed(!collapsed)
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 13,
    className: "lyra-sbgroup__chev"
  })) : /*#__PURE__*/React.createElement("span", {
    className: "lyra-sbgroup__label"
  }, label)), !collapsed && /*#__PURE__*/React.createElement("div", {
    className: "lyra-sbgroup__items"
  }, items.map(item => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: item.id,
    className: ["lyra-sbgroup__item", item.active && "lyra-sbgroup__item--active"].filter(Boolean).join(" "),
    "aria-current": item.active ? "page" : undefined,
    onClick: () => {
      item.onSelect && item.onSelect();
      onSelect && onSelect(item.id, item);
    }
  }, item.icon && /*#__PURE__*/React.createElement("span", {
    className: "lyra-sbgroup__item-icon"
  }, item.icon), /*#__PURE__*/React.createElement("span", {
    className: "lyra-sbgroup__item-label"
  }, item.label), item.badge != null && /*#__PURE__*/React.createElement("span", {
    className: "lyra-sbgroup__item-badge"
  }, item.badge))), children));
}
Object.assign(__ds_scope, { SidebarGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SidebarGroup.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Stepper.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Stepper horizontal para fluxos multi-etapa (cadastro, onboarding, checkout).
 * steps: array de labels; active: índice 0-based.
 */
function Stepper({
  steps = [],
  active = 0,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-stepper", className].filter(Boolean).join(" ")
  }, rest), steps.map((label, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    className: ["lyra-step__line", i <= active && "lyra-step__line--done"].filter(Boolean).join(" ")
  }), /*#__PURE__*/React.createElement("span", {
    className: ["lyra-step", i === active && "lyra-step--active", i < active && "lyra-step--done"].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("span", {
    className: "lyra-step__dot"
  }, i < active ? /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "20 6 9 17 4 12"
  })) : i + 1), /*#__PURE__*/React.createElement("span", {
    className: "lyra-step__label"
  }, label)))));
}
Object.assign(__ds_scope, { Stepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Stepper.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tabs controladas. items: [{ id, label, count?, icon? }].
 * variant "line" (padrão, sublinhado) ou "pills" (segmentado).
 */
function Tabs({
  items = [],
  active,
  onChange,
  variant = "line",
  className = "",
  ...rest
}) {
  const cls = ["lyra-tabs", variant === "pills" && "lyra-tabs--pills", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls,
    role: "tablist"
  }, rest), items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    role: "tab",
    "aria-selected": active === it.id,
    className: ["lyra-tab", active === it.id && "lyra-tab--active"].filter(Boolean).join(" "),
    onClick: () => onChange && onChange(it.id)
  }, it.icon, it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
    className: "lyra-tab__count"
  }, it.count))));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/WorkspaceSwitcher.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Seletor de workspace/tenant — trigger com avatar + plano e popover com a
 * lista de workspaces e ação "Criar workspace".
 * workspaces: [{ id, name, plan?, members? }]
 */
function WorkspaceSwitcher({
  workspaces = [],
  current,
  onChange,
  onCreate,
  createLabel = "Criar workspace",
  defaultOpen = false,
  className = "",
  ...rest
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const ref = React.useRef(null);
  const cur = workspaces.find(w => w.id === current) || workspaces[0];
  React.useEffect(() => {
    if (!open) return;
    const onDoc = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["lyra-wssw", className].filter(Boolean).join(" "),
    ref: ref
  }, rest), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lyra-wssw__trigger",
    "aria-haspopup": "listbox",
    "aria-expanded": open,
    onClick: () => setOpen(!open)
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: cur ? cur.name : "?",
    size: "sm",
    shape: "square"
  }), /*#__PURE__*/React.createElement("span", {
    className: "lyra-wssw__id"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lyra-wssw__name"
  }, cur ? cur.name : "Selecionar workspace"), cur && cur.plan && /*#__PURE__*/React.createElement("span", {
    className: "lyra-wssw__plan"
  }, cur.plan)), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevrons-up-down",
    size: 15,
    color: "var(--text-faint)"
  })), open && /*#__PURE__*/React.createElement("div", {
    className: "lyra-wssw__pop",
    role: "listbox"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lyra-wssw__pop-label"
  }, "Workspaces"), workspaces.map(w => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: w.id,
    role: "option",
    "aria-selected": cur && w.id === cur.id,
    className: "lyra-wssw__item",
    onClick: () => {
      setOpen(false);
      onChange && onChange(w.id, w);
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: w.name,
    size: "sm",
    shape: "square"
  }), /*#__PURE__*/React.createElement("span", {
    className: "lyra-wssw__id"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lyra-wssw__name"
  }, w.name), (w.plan || w.members != null) && /*#__PURE__*/React.createElement("span", {
    className: "lyra-wssw__meta"
  }, [w.plan, w.members != null ? `${w.members} membros` : null].filter(Boolean).join(" · "))), cur && w.id === cur.id && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 15,
    color: "var(--accent)"
  }))), onCreate && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("hr", {
    className: "lyra-wssw__sep"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lyra-wssw__item lyra-wssw__create",
    onClick: () => {
      setOpen(false);
      onCreate();
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "lyra-wssw__plus"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "plus",
    size: 15
  })), /*#__PURE__*/React.createElement("span", {
    className: "lyra-wssw__create-label"
  }, createLabel)))));
}
Object.assign(__ds_scope, { WorkspaceSwitcher });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/WorkspaceSwitcher.jsx", error: String((e && e.message) || e) }); }

// explorations/design-canvas.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// DesignCanvas.jsx — Figma-ish design canvas wrapper
// Warm gray grid bg + Sections + Artboards + PostIt notes.
// Exports (to window): DesignCanvas, DCSection, DCArtboard, DCPostIt.
// Artboards are reorderable (grip-drag), deletable, labels/titles are
// inline-editable, and any artboard can be opened in a fullscreen focus
// overlay (←/→/Esc). State persists to a .design-canvas.state.json sidecar
// via the host bridge. No assets, no deps.
//
// Usage:
//   <DesignCanvas>
//     <DCSection id="onboarding" title="Onboarding" subtitle="First-run variants">
//       <DCArtboard id="a" label="A · Dusk" width={260} height={480}>…</DCArtboard>
//       <DCArtboard id="b" label="B · Minimal" width={260} height={480}>…</DCArtboard>
//     </DCSection>
//   </DesignCanvas>
//
// Artboards are static design frames, not scroll regions — never use
// height: 100% + overflow: auto/scroll on inner elements; size each artboard
// to fit its content (explicit pixel height, or let it grow).
/* END USAGE */

const DC = {
  bg: '#f0eee9',
  grid: 'rgba(0,0,0,0.06)',
  label: 'rgba(60,50,40,0.7)',
  title: 'rgba(40,30,20,0.85)',
  subtitle: 'rgba(60,50,40,0.6)',
  postitBg: '#fef4a8',
  postitText: '#5a4a2a',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
};

// One-time CSS injection (classes are dc-prefixed so they don't collide with
// the hosted design's own styles).
if (typeof document !== 'undefined' && !document.getElementById('dc-styles')) {
  const s = document.createElement('style');
  s.id = 'dc-styles';
  s.textContent = ['.dc-editable{cursor:text;outline:none;white-space:nowrap;border-radius:3px;padding:0 2px;margin:0 -2px}', '.dc-editable:focus{background:#fff;box-shadow:0 0 0 1.5px #c96442}', '[data-dc-slot]{transition:transform .18s cubic-bezier(.2,.7,.3,1)}', '[data-dc-slot].dc-dragging{transition:none;z-index:10;pointer-events:none}', '[data-dc-slot].dc-dragging .dc-card{box-shadow:0 12px 40px rgba(0,0,0,.25),0 0 0 2px #c96442;transform:scale(1.02)}',
  // isolation:isolate contains artboard content's z-indexes so a
  // z-indexed child (sticky navbar etc.) can't paint over .dc-header or
  // the .dc-menu popover that drops into the top of the card.
  '.dc-card{isolation:isolate;transition:box-shadow .15s,transform .15s}', '.dc-card *{scrollbar-width:none}', '.dc-card *::-webkit-scrollbar{display:none}',
  // Per-artboard header: grip + label on the left, delete/expand on the
  // right. Single flex row; when the artboard's on-screen width is too
  // narrow for both the label yields (ellipsis, then hidden entirely below
  // ~4ch via the container query) and the buttons stay on the row.
  '.dc-header{position:absolute;bottom:100%;left:-4px;margin-bottom:calc(4px * var(--dc-inv-zoom,1));z-index:2;', '  display:flex;align-items:center;container-type:inline-size}', '.dc-labelrow{display:flex;align-items:center;gap:4px;height:24px;flex:1 1 auto;min-width:0}', '.dc-grip{flex:0 0 auto;cursor:grab;display:flex;align-items:center;padding:5px 4px;border-radius:4px;transition:background .12s,opacity .12s}', '.dc-grip:hover{background:rgba(0,0,0,.08)}', '.dc-grip:active{cursor:grabbing}', '.dc-labeltext{flex:1 1 auto;min-width:0;cursor:pointer;border-radius:4px;padding:3px 6px;', '  display:flex;align-items:center;transition:background .12s;overflow:hidden}',
  // Below ~4ch of label room: hide the label entirely, and drop the grip to
  // hover-only (same reveal rule as .dc-btns) so a narrow header is clean
  // until the card is moused.
  '@container (max-width: 110px){', '  .dc-labeltext{display:none}', '  .dc-grip{opacity:0}', '  [data-dc-slot]:hover .dc-grip{opacity:1}', '}', '.dc-labeltext:hover{background:rgba(0,0,0,.05)}', '.dc-labeltext .dc-editable{overflow:hidden;text-overflow:ellipsis;max-width:100%}', '.dc-labeltext .dc-editable:focus{overflow:visible;text-overflow:clip}', '.dc-btns{flex:0 0 auto;margin-left:auto;display:flex;gap:2px;opacity:0;transition:opacity .12s}', '[data-dc-slot]:hover .dc-btns,.dc-btns:has(.dc-menu){opacity:1}', '.dc-expand,.dc-kebab{width:22px;height:22px;border-radius:5px;border:none;cursor:pointer;padding:0;', '  background:transparent;color:rgba(60,50,40,.7);display:flex;align-items:center;justify-content:center;', '  font:inherit;transition:background .12s,color .12s}', '.dc-expand:hover,.dc-kebab:hover{background:rgba(0,0,0,.06);color:#2a251f}',
  // Slot hosting an open menu floats above later siblings (which otherwise
  // paint on top — same z-index:auto, later DOM order) so the popup isn't
  // clipped by the next card.
  '[data-dc-slot]:has(.dc-menu){z-index:10}', '.dc-menu{position:absolute;top:100%;right:0;margin-top:4px;background:#fff;border-radius:8px;', '  box-shadow:0 8px 28px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.05);padding:4px;min-width:160px;z-index:10}', '.dc-menu button{display:block;width:100%;padding:7px 10px;border:0;background:transparent;', '  border-radius:5px;font-family:inherit;font-size:13px;font-weight:500;line-height:1.2;', '  color:#29261b;cursor:pointer;text-align:left;transition:background .12s;white-space:nowrap}', '.dc-menu button:hover{background:rgba(0,0,0,.05)}', '.dc-menu hr{border:0;border-top:1px solid rgba(0,0,0,.08);margin:4px 2px}', '.dc-menu .dc-danger{color:#c96442}', '.dc-menu .dc-danger:hover{background:rgba(201,100,66,.1)}',
  // Chrome (titles / labels / buttons) counter-scales against the viewport
  // zoom so it stays a constant on-screen size. --dc-inv-zoom is set by
  // DCViewport on every transform update and inherits to all descendants —
  // any overlay inside the world (e.g. a TweaksPanel on an artboard) can use
  // it the same way.
  //
  // The header uses transform:scale (out-of-flow, so layout impact doesn't
  // matter) with its world-space width set to card-width / inv-zoom so that
  // after counter-scaling its on-screen width exactly matches the card's —
  // that's what lets the container query + text-overflow behave against the
  // card's visible edge at every zoom level.
  //
  // The section head uses CSS zoom instead of transform so its layout box
  // grows with the counter-scale, pushing the card row down — otherwise the
  // constant-screen-size title would overflow into the (shrinking) world-
  // space gap and overlap the artboard headers at low zoom.
  '.dc-header{width:calc((100% + 4px) / var(--dc-inv-zoom,1));', '  transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom left}', '.dc-sectionhead{zoom:var(--dc-inv-zoom,1)}'].join('\n');
  document.head.appendChild(s);
}
const DCCtx = React.createContext(null);

// Recursively unwrap React.Fragment so <>…</> grouping doesn't hide
// DCSection/DCArtboard children from the type-based walks below.
function dcFlatten(children) {
  const out = [];
  React.Children.forEach(children, c => {
    if (c && c.type === React.Fragment) out.push(...dcFlatten(c.props.children));else out.push(c);
  });
  return out;
}

// ─────────────────────────────────────────────────────────────
// DesignCanvas — stateful wrapper around the pan/zoom viewport.
// Owns runtime state (per-section order, renamed titles/labels, hidden
// artboards, focused artboard). Order/titles/labels/hidden persist to a
// .design-canvas.state.json
// sidecar next to the HTML. Reads go via plain fetch() so the saved
// arrangement is visible anywhere the HTML + sidecar are served together
// (omelette preview, direct link, downloaded zip). Writes go through the
// host's window.omelette bridge — editing requires the omelette runtime.
// Focus is ephemeral.
// ─────────────────────────────────────────────────────────────
const DC_STATE_FILE = '.design-canvas.state.json';
function DesignCanvas({
  children,
  minScale,
  maxScale,
  style
}) {
  const [state, setState] = React.useState({
    sections: {},
    focus: null
  });
  // Hold rendering until the sidecar read settles so the saved order/titles
  // appear on first paint (no source-order flash). didRead gates writes until
  // the read settles so the empty initial state can't clobber a slow read;
  // skipNextWrite suppresses the one echo-write that would otherwise follow
  // hydration.
  const [ready, setReady] = React.useState(false);
  const didRead = React.useRef(false);
  const skipNextWrite = React.useRef(false);
  React.useEffect(() => {
    let off = false;
    fetch('./' + DC_STATE_FILE).then(r => r.ok ? r.json() : null).then(saved => {
      if (off || !saved || !saved.sections) return;
      skipNextWrite.current = true;
      setState(s => ({
        ...s,
        sections: saved.sections
      }));
    }).catch(() => {}).finally(() => {
      didRead.current = true;
      if (!off) setReady(true);
    });
    const t = setTimeout(() => {
      if (!off) setReady(true);
    }, 150);
    return () => {
      off = true;
      clearTimeout(t);
    };
  }, []);
  React.useEffect(() => {
    if (!didRead.current) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    const t = setTimeout(() => {
      window.omelette?.writeFile(DC_STATE_FILE, JSON.stringify({
        sections: state.sections
      })).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [state.sections]);

  // Build registries synchronously from children so FocusOverlay can read
  // them in the same render. Fragments are flattened; wrapping in other
  // elements still opts out of focus/reorder.
  const registry = {}; // slotId -> { sectionId, artboard }
  const sectionMeta = {}; // sectionId -> { title, subtitle, slotIds[] }
  const sectionOrder = [];
  dcFlatten(children).forEach(sec => {
    if (!sec || sec.type !== DCSection) return;
    const sid = sec.props.id ?? sec.props.title;
    if (!sid) return;
    sectionOrder.push(sid);
    const persisted = state.sections[sid] || {};
    const abs = [];
    dcFlatten(sec.props.children).forEach(ab => {
      if (!ab || ab.type !== DCArtboard) return;
      const aid = ab.props.id ?? ab.props.label;
      if (aid) abs.push([aid, ab]);
    });
    // hidden is scoped to one source revision — when the agent regenerates
    // (artboard-ID set changes), prior deletes don't apply to new content.
    const srcKey = abs.map(([k]) => k).join('\x1f');
    const hidden = persisted.srcKey === srcKey ? persisted.hidden || [] : [];
    const srcIds = [];
    abs.forEach(([aid, ab]) => {
      if (hidden.includes(aid)) return;
      registry[`${sid}/${aid}`] = {
        sectionId: sid,
        artboard: ab
      };
      srcIds.push(aid);
    });
    const kept = (persisted.order || []).filter(k => srcIds.includes(k));
    sectionMeta[sid] = {
      title: persisted.title ?? sec.props.title,
      subtitle: sec.props.subtitle,
      slotIds: [...kept, ...srcIds.filter(k => !kept.includes(k))]
    };
  });
  const api = React.useMemo(() => ({
    state,
    section: id => state.sections[id] || {},
    patchSection: (id, p) => setState(s => ({
      ...s,
      sections: {
        ...s.sections,
        [id]: {
          ...s.sections[id],
          ...(typeof p === 'function' ? p(s.sections[id] || {}) : p)
        }
      }
    })),
    setFocus: slotId => setState(s => ({
      ...s,
      focus: slotId
    }))
  }), [state]);

  // Esc exits focus; any outside pointerdown commits an in-progress rename.
  React.useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') api.setFocus(null);
    };
    const onPd = e => {
      const ae = document.activeElement;
      if (ae && ae.isContentEditable && !ae.contains(e.target)) ae.blur();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPd, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPd, true);
    };
  }, [api]);
  return /*#__PURE__*/React.createElement(DCCtx.Provider, {
    value: api
  }, /*#__PURE__*/React.createElement(DCViewport, {
    minScale: minScale,
    maxScale: maxScale,
    style: style
  }, ready && children), state.focus && registry[state.focus] && /*#__PURE__*/React.createElement(DCFocusOverlay, {
    entry: registry[state.focus],
    sectionMeta: sectionMeta,
    sectionOrder: sectionOrder
  }));
}

// ─────────────────────────────────────────────────────────────
// DCViewport — transform-based pan/zoom (internal)
//
// Input mapping (Figma-style):
//   • trackpad pinch  → zoom   (ctrlKey wheel; Safari gesture* events)
//   • trackpad scroll → pan    (two-finger)
//   • mouse wheel     → zoom   (notched; distinguished from trackpad scroll)
//   • middle-drag / primary-drag-on-bg → pan
//
// Transform state lives in a ref and is written straight to the DOM
// (translate3d + will-change) so wheel ticks don't go through React —
// keeps pans at 60fps on dense canvases.
// ─────────────────────────────────────────────────────────────
function DCViewport({
  children,
  minScale = 0.1,
  maxScale = 8,
  style = {}
}) {
  const vpRef = React.useRef(null);
  const worldRef = React.useRef(null);
  const tf = React.useRef({
    x: 0,
    y: 0,
    scale: 1
  });
  // Persist viewport across reloads so the user lands back where they were
  // after an agent edit or browser refresh. The sandbox origin is already
  // per-project; pathname keeps multiple canvas files in one project apart.
  const tfKey = 'dc-viewport:' + location.pathname;
  const saveT = React.useRef(0);
  const lastPostedScale = React.useRef();
  const apply = React.useCallback(() => {
    const {
      x,
      y,
      scale
    } = tf.current;
    const el = worldRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    // Exposed for zoom-invariant chrome (labels, buttons, TweaksPanel).
    el.style.setProperty('--dc-inv-zoom', String(1 / scale));
    // Keep the host toolbar's % readout in sync with the canvas scale. Pan
    // ticks leave scale unchanged — skip the cross-frame post for those.
    if (lastPostedScale.current !== scale) {
      lastPostedScale.current = scale;
      window.parent.postMessage({
        type: '__dc_zoom',
        scale
      }, '*');
    }
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      try {
        localStorage.setItem(tfKey, JSON.stringify(tf.current));
      } catch {}
    }, 200);
  }, [tfKey]);
  React.useLayoutEffect(() => {
    const flush = () => {
      clearTimeout(saveT.current);
      try {
        localStorage.setItem(tfKey, JSON.stringify(tf.current));
      } catch {}
    };
    try {
      const s = JSON.parse(localStorage.getItem(tfKey) || 'null');
      if (s && Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.scale)) {
        tf.current = {
          x: s.x,
          y: s.y,
          scale: Math.min(maxScale, Math.max(minScale, s.scale))
        };
        apply();
      }
    } catch {}
    // Flush on pagehide and unmount so a reload within the 200ms debounce
    // window doesn't drop the last pan/zoom.
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);
  React.useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const zoomAt = (cx, cy, factor) => {
      const r = vp.getBoundingClientRect();
      const px = cx - r.left,
        py = cy - r.top;
      const t = tf.current;
      const next = Math.min(maxScale, Math.max(minScale, t.scale * factor));
      const k = next / t.scale;
      // --dc-inv-zoom consumers (.dc-sectionhead's CSS zoom, each section's
      // marginBottom) reflow on every scale change, vertically shifting the
      // world layout — so a world point mathematically pinned under the cursor
      // drifts as you zoom (content creeps up on zoom-in, down on zoom-out).
      // Anchor the DOM element under the cursor instead: record its screen Y,
      // apply the transform + --dc-inv-zoom, then cancel whatever vertical
      // drift the reflow introduced so it stays put on screen.
      let marker = null,
        markerY0 = 0;
      if (k !== 1) {
        const hit = document.elementFromPoint(cx, cy);
        marker = hit && hit.closest ? hit.closest('[data-dc-slot],[data-dc-section]') : null;
        if (marker) markerY0 = marker.getBoundingClientRect().top;
      }
      // keep the world point under the cursor fixed
      t.x = px - (px - t.x) * k;
      t.y = py - (py - t.y) * k;
      t.scale = next;
      apply();
      if (marker) {
        // A pure zoom around (cx, cy) maps screen Y → cy + (Y - cy) * k. Any
        // departure after the --dc-inv-zoom reflow is the layout drift.
        const drift = marker.getBoundingClientRect().top - (cy + (markerY0 - cy) * k);
        if (Math.abs(drift) > 0.1) {
          t.y -= drift;
          apply();
        }
      }
    };

    // Mouse-wheel vs trackpad-scroll heuristic. A physical wheel sends
    // line-mode deltas (Firefox) or large integer pixel deltas with no X
    // component (Chrome/Safari, typically multiples of 100/120). Trackpad
    // two-finger scroll sends small/fractional pixel deltas, often with
    // non-zero deltaX. ctrlKey is set by the browser for trackpad pinch.
    const isMouseWheel = e => e.deltaMode !== 0 || e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 40;
    const onWheel = e => {
      e.preventDefault();
      if (isGesturing) return; // Safari: gesture* owns the pinch — discard concurrent wheels
      if ((e.ctrlKey || e.metaKey) && !isMouseWheel(e)) {
        // trackpad pinch, or ctrl/cmd + smooth-scroll mouse. Notched
        // wheels fall through to the fixed-step branch below.
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
      } else if (isMouseWheel(e)) {
        // notched mouse wheel — fixed-ratio step per click
        zoomAt(e.clientX, e.clientY, Math.exp(-Math.sign(e.deltaY) * 0.18));
      } else {
        // trackpad two-finger scroll — pan
        tf.current.x -= e.deltaX;
        tf.current.y -= e.deltaY;
        apply();
      }
    };

    // Safari sends native gesture* events for trackpad pinch with a smooth
    // e.scale; preferring these over the ctrl+wheel fallback gives a much
    // better feel there. No-ops on other browsers. Safari also fires
    // ctrlKey wheel events during the same pinch — isGesturing makes
    // onWheel drop those entirely so they neither zoom nor pan.
    let gsBase = 1;
    let isGesturing = false;
    const onGestureStart = e => {
      e.preventDefault();
      isGesturing = true;
      gsBase = tf.current.scale;
    };
    const onGestureChange = e => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, gsBase * e.scale / tf.current.scale);
    };
    const onGestureEnd = e => {
      e.preventDefault();
      isGesturing = false;
    };

    // Drag-pan: middle button anywhere, or primary button on canvas
    // background (anything that isn't an artboard or an inline editor).
    let drag = null;
    const onPointerDown = e => {
      const onBg = !e.target.closest('[data-dc-slot], .dc-editable');
      if (!(e.button === 1 || e.button === 0 && onBg)) return;
      e.preventDefault();
      vp.setPointerCapture(e.pointerId);
      drag = {
        id: e.pointerId,
        lx: e.clientX,
        ly: e.clientY
      };
      vp.style.cursor = 'grabbing';
    };
    const onPointerMove = e => {
      if (!drag || e.pointerId !== drag.id) return;
      tf.current.x += e.clientX - drag.lx;
      tf.current.y += e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      apply();
    };
    const onPointerUp = e => {
      if (!drag || e.pointerId !== drag.id) return;
      vp.releasePointerCapture(e.pointerId);
      drag = null;
      vp.style.cursor = '';
    };

    // Host-driven zoom (toolbar % menu). Zooms around viewport centre so the
    // visible midpoint stays fixed — matching the host's iframe-zoom feel.
    const onHostMsg = e => {
      const d = e.data;
      if (d && d.type === '__dc_set_zoom' && typeof d.scale === 'number') {
        const r = vp.getBoundingClientRect();
        zoomAt(r.left + r.width / 2, r.top + r.height / 2, d.scale / tf.current.scale);
      } else if (d && d.type === '__dc_probe') {
        // Host's [readyGen] reset asks whether a canvas is present; it
        // fires on the iframe's native 'load', which for canvases with
        // images/fonts is after our mount-time announce, so re-announce.
        // Clear the pan-tick guard so apply() re-posts the current scale
        // even if it's unchanged — the host just reset dcScale to 1.
        window.parent.postMessage({
          type: '__dc_present'
        }, '*');
        lastPostedScale.current = undefined;
        apply();
      }
    };
    window.addEventListener('message', onHostMsg);
    // Announce canvas mode so the host toolbar proxies its % control here
    // instead of scaling the iframe element (which would just shrink the
    // viewport window of an infinite canvas). The apply() that follows emits
    // the initial __dc_zoom so the toolbar % is correct before first pinch.
    // lastPostedScale reset mirrors the __dc_probe handler: the layout
    // effect's restore-path apply() may already have posted the restored
    // scale (before __dc_present), so clear the guard to re-post it in order.
    window.parent.postMessage({
      type: '__dc_present'
    }, '*');
    lastPostedScale.current = undefined;
    apply();
    vp.addEventListener('wheel', onWheel, {
      passive: false
    });
    vp.addEventListener('gesturestart', onGestureStart, {
      passive: false
    });
    vp.addEventListener('gesturechange', onGestureChange, {
      passive: false
    });
    vp.addEventListener('gestureend', onGestureEnd, {
      passive: false
    });
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('message', onHostMsg);
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('gesturestart', onGestureStart);
      vp.removeEventListener('gesturechange', onGestureChange);
      vp.removeEventListener('gestureend', onGestureEnd);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
    };
  }, [apply, minScale, maxScale]);
  const gridSvg = `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M120 0H0v120' fill='none' stroke='${encodeURIComponent(DC.grid)}' stroke-width='1'/%3E%3C/svg%3E")`;
  return /*#__PURE__*/React.createElement("div", {
    ref: vpRef,
    className: "design-canvas",
    style: {
      height: '100vh',
      width: '100vw',
      background: DC.bg,
      overflow: 'hidden',
      overscrollBehavior: 'none',
      touchAction: 'none',
      position: 'relative',
      fontFamily: DC.font,
      boxSizing: 'border-box',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: worldRef,
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      transformOrigin: '0 0',
      willChange: 'transform',
      width: 'max-content',
      minWidth: '100%',
      minHeight: '100%',
      padding: '60px 0 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: -6000,
      backgroundImage: gridSvg,
      backgroundSize: '120px 120px',
      pointerEvents: 'none',
      zIndex: -1
    }
  }), children));
}

// ─────────────────────────────────────────────────────────────
// DCSection — editable title + h-row of artboards in persisted order
// ─────────────────────────────────────────────────────────────
function DCSection({
  id,
  title,
  subtitle,
  children,
  gap = 48
}) {
  const ctx = React.useContext(DCCtx);
  const sid = id ?? title;
  const all = React.Children.toArray(dcFlatten(children));
  const artboards = all.filter(c => c && c.type === DCArtboard);
  const rest = all.filter(c => !(c && c.type === DCArtboard));
  const sec = ctx && sid && ctx.section(sid) || {};
  // Must match DesignCanvas's srcKey computation exactly (it filters falsy
  // IDs), or onDelete persists a srcKey that DesignCanvas never recognizes.
  const allIds = artboards.map(a => a.props.id ?? a.props.label).filter(Boolean);
  const srcKey = allIds.join('\x1f');
  const hidden = sec.srcKey === srcKey ? sec.hidden || [] : [];
  const srcOrder = allIds.filter(k => !hidden.includes(k));
  const order = React.useMemo(() => {
    const kept = (sec.order || []).filter(k => srcOrder.includes(k));
    return [...kept, ...srcOrder.filter(k => !kept.includes(k))];
  }, [sec.order, srcOrder.join('|')]);
  const byId = Object.fromEntries(artboards.map(a => [a.props.id ?? a.props.label, a]));

  // marginBottom counter-scales so the on-screen gap between sections stays
  // constant — otherwise at low zoom the (world-space) gap collapses while
  // the screen-constant sectionhead below it doesn't, and the title reads as
  // belonging to the section above. paddingBottom below is just enough for
  // the 24px artboard-header (abs-positioned above each card) plus ~8px, so
  // the title sits tight against its own row at every zoom.
  return /*#__PURE__*/React.createElement("div", {
    "data-dc-section": sid,
    style: {
      marginBottom: 'calc(80px * var(--dc-inv-zoom, 1))',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 60px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-sectionhead",
    style: {
      paddingBottom: 36
    }
  }, /*#__PURE__*/React.createElement(DCEditable, {
    tag: "div",
    value: sec.title ?? title,
    onChange: v => ctx && sid && ctx.patchSection(sid, {
      title: v
    }),
    style: {
      fontSize: 28,
      fontWeight: 600,
      color: DC.title,
      letterSpacing: -0.4,
      marginBottom: 6,
      display: 'inline-block'
    }
  }), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: DC.subtitle
    }
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap,
      padding: '0 60px',
      alignItems: 'flex-start',
      width: 'max-content'
    }
  }, order.map(k => /*#__PURE__*/React.createElement(DCArtboardFrame, {
    key: k,
    sectionId: sid,
    artboard: byId[k],
    order: order,
    label: (sec.labels || {})[k] ?? byId[k].props.label,
    onRename: v => ctx && ctx.patchSection(sid, x => ({
      labels: {
        ...x.labels,
        [k]: v
      }
    })),
    onReorder: next => ctx && ctx.patchSection(sid, {
      order: next
    }),
    onDelete: () => ctx && ctx.patchSection(sid, x => ({
      hidden: [...(x.srcKey === srcKey ? x.hidden || [] : []), k],
      srcKey
    })),
    onFocus: () => ctx && ctx.setFocus(`${sid}/${k}`)
  }))), rest);
}

// DCArtboard — marker; rendered by DCArtboardFrame via DCSection.
function DCArtboard() {
  return null;
}

// Per-artboard export (kind: 'png' | 'html'). Both paths share the same
// self-contained clone: computed styles baked in, @font-face / <img> /
// inline-style background-image urls inlined as data URIs. PNG wraps the
// clone in foreignObject→canvas at 3× the artboard's natural width×height
// (same pipeline the host uses for page captures); HTML wraps it in a
// minimal standalone document. Both are independent of viewport zoom.
async function dcExport(node, w, h, name, kind) {
  try {
    await document.fonts.ready;
  } catch {}
  const toDataURL = url => fetch(url).then(r => r.blob()).then(b => new Promise(res => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => res(url);
    fr.readAsDataURL(b);
  })).catch(() => url);

  // Collect @font-face rules. ss.cssRules throws SecurityError on
  // cross-origin sheets (e.g. fonts.googleapis.com) — in that case fetch
  // the CSS text directly (those endpoints send ACAO:*) and regex-extract
  // the blocks. @import and @media/@supports are walked so nested
  // @font-face rules aren't missed.
  const fontRules = [],
    pending = [],
    seen = new Set();
  const scrapeCss = href => {
    if (seen.has(href)) return;
    seen.add(href);
    pending.push(fetch(href).then(r => r.text()).then(css => {
      for (const m of css.match(/@font-face\s*{[^}]*}/g) || []) fontRules.push({
        css: m,
        base: href
      });
      for (const m of css.matchAll(/@import\s+(?:url\()?['"]?([^'")\s;]+)/g)) scrapeCss(new URL(m[1], href).href);
    }).catch(() => {}));
  };
  const walk = (rules, base) => {
    for (const r of rules) {
      if (r.type === CSSRule.FONT_FACE_RULE) fontRules.push({
        css: r.cssText,
        base
      });else if (r.type === CSSRule.IMPORT_RULE && r.styleSheet) {
        const ibase = r.styleSheet.href || base;
        try {
          walk(r.styleSheet.cssRules, ibase);
        } catch {
          scrapeCss(ibase);
        }
      } else if (r.cssRules) walk(r.cssRules, base);
    }
  };
  for (const ss of document.styleSheets) {
    const base = ss.href || location.href;
    try {
      walk(ss.cssRules, base);
    } catch {
      if (ss.href) scrapeCss(ss.href);
    }
  }
  while (pending.length) await pending.shift();
  const fontCss = (await Promise.all(fontRules.map(async rule => {
    let out = rule.css,
      m;
    const re = /url\((['"]?)([^'")]+)\1\)/g;
    while (m = re.exec(rule.css)) {
      if (m[2].indexOf('data:') === 0) continue;
      let abs;
      try {
        abs = new URL(m[2], rule.base).href;
      } catch {
        continue;
      }
      out = out.split(m[0]).join('url("' + (await toDataURL(abs)) + '")');
    }
    return out;
  }))).join('\n');
  const cloneStyled = src => {
    if (src.nodeType === 8 || src.nodeType === 1 && src.tagName === 'SCRIPT') return document.createTextNode('');
    const dst = src.cloneNode(false);
    if (src.nodeType === 1) {
      const cs = getComputedStyle(src);
      let txt = '';
      for (let i = 0; i < cs.length; i++) txt += cs[i] + ':' + cs.getPropertyValue(cs[i]) + ';';
      dst.setAttribute('style', txt + 'animation:none;transition:none;');
      if (src.tagName === 'CANVAS') try {
        const im = document.createElement('img');
        im.src = src.toDataURL();
        im.setAttribute('style', txt);
        return im;
      } catch {}
    }
    for (let c = src.firstChild; c; c = c.nextSibling) dst.appendChild(cloneStyled(c));
    return dst;
  };
  const clone = cloneStyled(node);
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  // Drop the card's own shadow/radius so the export is a flush w×h rect;
  // the artboard's own background (if any) is already in the computed style.
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  const jobs = [];
  clone.querySelectorAll('img').forEach(el => {
    const s = el.getAttribute('src');
    if (s && s.indexOf('data:') !== 0) jobs.push(toDataURL(el.src).then(d => el.setAttribute('src', d)));
  });
  [clone, ...clone.querySelectorAll('*')].forEach(el => {
    const bg = el.style.backgroundImage;
    if (!bg) return;
    let m;
    const re = /url\(["']?([^"')]+)["']?\)/g;
    while (m = re.exec(bg)) {
      const tok = m[0],
        url = m[1];
      if (url.indexOf('data:') === 0) continue;
      jobs.push(toDataURL(url).then(d => {
        el.style.backgroundImage = el.style.backgroundImage.split(tok).join('url("' + d + '")');
      }));
    }
  });
  await Promise.all(jobs);
  const xml = new XMLSerializer().serializeToString(clone);
  const save = (blob, ext) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '.' + ext;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  if (kind === 'html') {
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + name + '</title>' + (fontCss ? '<style>' + fontCss + '</style>' : '') + '</head><body style="margin:0">' + xml + '</body></html>';
    return save(new Blob([html], {
      type: 'text/html'
    }), 'html');
  }

  // PNG: the SVG's own width/height must be the output resolution — an
  // <img>-loaded SVG rasterizes at its intrinsic size, so sizing it at 1×
  // and ctx.scale()-ing up would just upscale a 1× bitmap. viewBox maps the
  // w×h foreignObject onto the px·w × px·h SVG canvas so the browser renders
  // the HTML at full resolution.
  const px = 3;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w * px + '" height="' + h * px + '" viewBox="0 0 ' + w + ' ' + h + '"><foreignObject width="' + w + '" height="' + h + '">' + (fontCss ? '<style><![CDATA[' + fontCss + ']]></style>' : '') + xml + '</foreignObject></svg>';
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = () => rej(new Error('svg load failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  const cv = document.createElement('canvas');
  cv.width = w * px;
  cv.height = h * px;
  cv.getContext('2d').drawImage(img, 0, 0);
  cv.toBlob(blob => save(blob, 'png'), 'image/png');
}
function DCArtboardFrame({
  sectionId,
  artboard,
  label,
  order,
  onRename,
  onReorder,
  onFocus,
  onDelete
}) {
  const {
    id: rawId,
    label: rawLabel,
    width = 260,
    height = 480,
    children,
    style = {}
  } = artboard.props;
  const id = rawId ?? rawLabel;
  const ref = React.useRef(null);
  const cardRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  // ⋯ menu: close on any outside pointerdown. Two-click delete lives inside
  // the menu — first click arms the row, second commits; closing disarms.
  React.useEffect(() => {
    if (!menuOpen) {
      setConfirming(false);
      return;
    }
    const off = e => {
      if (!menuRef.current || !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', off, true);
    return () => document.removeEventListener('pointerdown', off, true);
  }, [menuOpen]);
  const doExport = kind => {
    setMenuOpen(false);
    if (!cardRef.current) return;
    const name = String(label || id || 'artboard').replace(/[^\w\s.-]+/g, '_');
    dcExport(cardRef.current, width, height, name, kind).catch(e => console.error('[design-canvas] export failed:', e));
  };

  // Live drag-reorder: dragged card sticks to cursor; siblings slide into
  // their would-be slots in real time via transforms. DOM order only
  // changes on drop.
  const onGripDown = e => {
    e.preventDefault();
    e.stopPropagation();
    const me = ref.current;
    // translateX is applied in local (pre-scale) space but pointer deltas and
    // getBoundingClientRect().left are screen-space — divide by the viewport's
    // current scale so the dragged card tracks the cursor at any zoom level.
    const scale = me.getBoundingClientRect().width / me.offsetWidth || 1;
    const peers = Array.from(document.querySelectorAll(`[data-dc-section="${sectionId}"] [data-dc-slot]`));
    const homes = peers.map(el => ({
      el,
      id: el.dataset.dcSlot,
      x: el.getBoundingClientRect().left
    }));
    const slotXs = homes.map(h => h.x);
    const startIdx = order.indexOf(id);
    const startX = e.clientX;
    let liveOrder = order.slice();
    me.classList.add('dc-dragging');
    const layout = () => {
      for (const h of homes) {
        if (h.id === id) continue;
        const slot = liveOrder.indexOf(h.id);
        h.el.style.transform = `translateX(${(slotXs[slot] - h.x) / scale}px)`;
      }
    };
    const move = ev => {
      const dx = ev.clientX - startX;
      me.style.transform = `translateX(${dx / scale}px)`;
      const cur = homes[startIdx].x + dx;
      let nearest = 0,
        best = Infinity;
      for (let i = 0; i < slotXs.length; i++) {
        const d = Math.abs(slotXs[i] - cur);
        if (d < best) {
          best = d;
          nearest = i;
        }
      }
      if (liveOrder.indexOf(id) !== nearest) {
        liveOrder = order.filter(k => k !== id);
        liveOrder.splice(nearest, 0, id);
        layout();
      }
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      const finalSlot = liveOrder.indexOf(id);
      me.classList.remove('dc-dragging');
      me.style.transform = `translateX(${(slotXs[finalSlot] - homes[startIdx].x) / scale}px)`;
      // After the settle transition, kill transitions + clear transforms +
      // commit the reorder in the same frame so there's no visual snap-back.
      setTimeout(() => {
        for (const h of homes) {
          h.el.style.transition = 'none';
          h.el.style.transform = '';
        }
        if (liveOrder.join('|') !== order.join('|')) onReorder(liveOrder);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          for (const h of homes) h.el.style.transition = '';
        }));
      }, 180);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    "data-dc-slot": id,
    style: {
      position: 'relative',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-header",
    "data-omelette-chrome": "",
    style: {
      color: DC.label
    },
    onPointerDown: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-labelrow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-grip",
    onPointerDown: onGripDown,
    title: "Drag to reorder"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "9",
    height: "13",
    viewBox: "0 0 9 13",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "2",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "2",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "6.5",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "6.5",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "11",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "11",
    r: "1.1"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dc-labeltext",
    onClick: onFocus,
    title: "Click to focus"
  }, /*#__PURE__*/React.createElement(DCEditable, {
    value: label,
    onChange: onRename,
    onClick: e => e.stopPropagation(),
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: DC.label,
      lineHeight: 1
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dc-btns"
  }, /*#__PURE__*/React.createElement("div", {
    ref: menuRef,
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "dc-kebab",
    title: "More",
    onClick: () => setMenuOpen(o => !o)
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "2.5",
    cy: "6",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "6",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9.5",
    cy: "6",
    r: "1.1"
  }))), menuOpen && /*#__PURE__*/React.createElement("div", {
    className: "dc-menu",
    onPointerDown: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => doExport('png')
  }, "Download PNG"), /*#__PURE__*/React.createElement("button", {
    onClick: () => doExport('html')
  }, "Download HTML"), /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement("button", {
    className: "dc-danger",
    onClick: () => {
      if (confirming) {
        setMenuOpen(false);
        onDelete();
      } else setConfirming(true);
    }
  }, confirming ? 'Click again to delete' : 'Delete'))), /*#__PURE__*/React.createElement("button", {
    className: "dc-expand",
    onClick: onFocus,
    title: "Focus"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 1h4v4M5 11H1V7M11 1L7.5 4.5M1 11l3.5-3.5"
  }))))), /*#__PURE__*/React.createElement("div", {
    ref: cardRef,
    className: "dc-card",
    style: {
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06)',
      overflow: 'hidden',
      width,
      height,
      background: '#fff',
      ...style
    }
  }, children || /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb',
      fontSize: 13,
      fontFamily: DC.font
    }
  }, id)));
}

// Inline rename — commits on blur or Enter.
function DCEditable({
  value,
  onChange,
  style,
  tag = 'span',
  onClick
}) {
  const T = tag;
  return /*#__PURE__*/React.createElement(T, {
    className: "dc-editable",
    contentEditable: true,
    suppressContentEditableWarning: true,
    onClick: onClick,
    onPointerDown: e => e.stopPropagation(),
    onBlur: e => onChange && onChange(e.currentTarget.textContent),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    style: style
  }, value);
}

// ─────────────────────────────────────────────────────────────
// Focus mode — overlay one artboard; ←/→ within section, ↑/↓ across
// sections, Esc or backdrop click to exit.
// ─────────────────────────────────────────────────────────────
function DCFocusOverlay({
  entry,
  sectionMeta,
  sectionOrder
}) {
  const ctx = React.useContext(DCCtx);
  const {
    sectionId,
    artboard
  } = entry;
  const sec = ctx.section(sectionId);
  const meta = sectionMeta[sectionId];
  const peers = meta.slotIds;
  const aid = artboard.props.id ?? artboard.props.label;
  const idx = peers.indexOf(aid);
  const secIdx = sectionOrder.indexOf(sectionId);
  const go = d => {
    const n = peers[(idx + d + peers.length) % peers.length];
    if (n) ctx.setFocus(`${sectionId}/${n}`);
  };
  const goSection = d => {
    // Sections whose artboards are all deleted have slotIds:[] — step past
    // them to the next non-empty section so ↑/↓ doesn't dead-end.
    const n = sectionOrder.length;
    for (let i = 1; i < n; i++) {
      const ns = sectionOrder[((secIdx + d * i) % n + n) % n];
      const first = sectionMeta[ns] && sectionMeta[ns].slotIds[0];
      if (first) {
        ctx.setFocus(`${ns}/${first}`);
        return;
      }
    }
  };
  React.useEffect(() => {
    const k = e => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goSection(-1);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goSection(1);
      }
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  });
  const {
    width = 260,
    height = 480,
    children
  } = artboard.props;
  const [vp, setVp] = React.useState({
    w: window.innerWidth,
    h: window.innerHeight
  });
  React.useEffect(() => {
    const r = () => setVp({
      w: window.innerWidth,
      h: window.innerHeight
    });
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  const scale = Math.max(0.1, Math.min((vp.w - 200) / width, (vp.h - 260) / height, 2));
  const [ddOpen, setDd] = React.useState(false);
  const Arrow = ({
    dir,
    onClick
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onClick();
    },
    style: {
      position: 'absolute',
      top: '50%',
      [dir]: 28,
      transform: 'translateY(-50%)',
      border: 'none',
      background: 'rgba(255,255,255,.08)',
      color: 'rgba(255,255,255,.9)',
      width: 44,
      height: 44,
      borderRadius: 22,
      fontSize: 18,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background .15s'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,.18)',
    onMouseLeave: e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 18 18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: dir === 'left' ? 'M11 3L5 9l6 6' : 'M7 3l6 6-6 6'
  })));

  // Portal to body so position:fixed is the real viewport regardless of any
  // transform on DesignCanvas's ancestors (including the canvas zoom itself).
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    onClick: () => ctx.setFocus(null),
    onWheel: e => e.preventDefault(),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(24,20,16,.6)',
      backdropFilter: 'blur(14px)',
      fontFamily: DC.font,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      display: 'flex',
      alignItems: 'flex-start',
      padding: '16px 20px 0',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setDd(o => !o),
    style: {
      border: 'none',
      background: 'transparent',
      color: '#fff',
      cursor: 'pointer',
      padding: '6px 8px',
      borderRadius: 6,
      textAlign: 'left',
      fontFamily: 'inherit'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: -0.3
    }
  }, meta.title), /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 11 11",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    style: {
      opacity: .7
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 4l3.5 3.5L9 4"
  }))), meta.subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13,
      opacity: .6,
      fontWeight: 400,
      marginTop: 2
    }
  }, meta.subtitle)), ddOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: 4,
      background: '#2a251f',
      borderRadius: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,.4)',
      padding: 4,
      minWidth: 200,
      zIndex: 10
    }
  }, sectionOrder.filter(sid => sectionMeta[sid].slotIds.length).map(sid => /*#__PURE__*/React.createElement("button", {
    key: sid,
    onClick: () => {
      setDd(false);
      const f = sectionMeta[sid].slotIds[0];
      if (f) ctx.setFocus(`${sid}/${f}`);
    },
    style: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      border: 'none',
      cursor: 'pointer',
      background: sid === sectionId ? 'rgba(255,255,255,.1)' : 'transparent',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: 5,
      fontSize: 14,
      fontWeight: sid === sectionId ? 600 : 400,
      fontFamily: 'inherit'
    }
  }, sectionMeta[sid].title)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => ctx.setFocus(null),
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,.12)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent',
    style: {
      border: 'none',
      background: 'transparent',
      color: 'rgba(255,255,255,.7)',
      width: 32,
      height: 32,
      borderRadius: 16,
      fontSize: 20,
      cursor: 'pointer',
      lineHeight: 1,
      transition: 'background .12s'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 64,
      bottom: 56,
      left: 100,
      right: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: width * scale,
      height: height * scale,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      background: '#fff',
      borderRadius: 2,
      overflow: 'hidden',
      boxShadow: '0 20px 80px rgba(0,0,0,.4)'
    }
  }, children || /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb'
    }
  }, aid))), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      fontSize: 14,
      fontWeight: 500,
      opacity: .85,
      textAlign: 'center'
    }
  }, (sec.labels || {})[aid] ?? artboard.props.label, /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .5,
      marginLeft: 10,
      fontVariantNumeric: 'tabular-nums'
    }
  }, idx + 1, " / ", peers.length))), /*#__PURE__*/React.createElement(Arrow, {
    dir: "left",
    onClick: () => go(-1)
  }), /*#__PURE__*/React.createElement(Arrow, {
    dir: "right",
    onClick: () => go(1)
  }), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 8
    }
  }, peers.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: p,
    onClick: () => ctx.setFocus(`${sectionId}/${p}`),
    style: {
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      width: 6,
      height: 6,
      borderRadius: 3,
      background: i === idx ? '#fff' : 'rgba(255,255,255,.3)'
    }
  })))), document.body);
}

// ─────────────────────────────────────────────────────────────
// Post-it — absolute-positioned sticky note
// ─────────────────────────────────────────────────────────────
function DCPostIt({
  children,
  top,
  left,
  right,
  bottom,
  rotate = -2,
  width = 180
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top,
      left,
      right,
      bottom,
      width,
      background: DC.postitBg,
      padding: '14px 16px',
      fontFamily: '"Comic Sans MS", "Marker Felt", "Segoe Print", cursive',
      fontSize: 14,
      lineHeight: 1.4,
      color: DC.postitText,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      transform: `rotate(${rotate}deg)`,
      zIndex: 5
    }
  }, children);
}
Object.assign(window, {
  DesignCanvas,
  DCSection,
  DCArtboard,
  DCPostIt
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/design-canvas.jsx", error: String((e && e.message) || e) }); }

// ui_kits/auth/screens.jsx
try { (() => {
/* Lyra Auth UI kit — telas de login, cadastro e recuperação */
const {
  Button,
  Input,
  Checkbox,
  Select,
  Icon,
  Alert,
  Stepper,
  Badge,
  Avatar,
  Progress
} = window.LyraDesignSystem_e82d95;
function BrandPanel() {
  return /*#__PURE__*/React.createElement("aside", {
    className: "la-brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "la-brand__top"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/lyra-mark-light.svg",
    alt: "",
    className: "la-brand__mark"
  }), /*#__PURE__*/React.createElement("span", {
    className: "la-brand__word"
  }, "Lyra")), /*#__PURE__*/React.createElement("div", {
    className: "la-brand__center"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "la-brand__headline"
  }, "Componentes que escalam do prot\xF3tipo \xE0 produ\xE7\xE3o."), /*#__PURE__*/React.createElement("p", {
    className: "la-brand__sub"
  }, "Open source para React, Vue, Laravel e Phoenix LiveView.")), /*#__PURE__*/React.createElement("figure", {
    className: "la-quote"
  }, /*#__PURE__*/React.createElement("blockquote", {
    className: "la-quote__text"
  }, "\"Migramos tr\xEAs produtos para o Lyra em duas semanas. O modo escuro veio de gra\xE7a.\""), /*#__PURE__*/React.createElement("figcaption", {
    className: "la-quote__author"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Caio Melo",
    size: "sm"
  }), /*#__PURE__*/React.createElement("span", null, "Caio Melo \xB7 eng. front-end"))));
}
function LoginScreen({
  go
}) {
  const [loading, setLoading] = React.useState(false);
  const submit = e => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      go("done");
    }, 900);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "la-card"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "la-title"
  }, "Entrar no Lyra"), /*#__PURE__*/React.createElement("p", {
    className: "la-sub"
  }, "Bem-vindo de volta. Acesse seu workspace."), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    full: true,
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "github",
      size: 18
    })
  }, "Continuar com GitHub"), /*#__PURE__*/React.createElement("div", {
    className: "la-divider"
  }, /*#__PURE__*/React.createElement("span", null, "ou com e-mail")), /*#__PURE__*/React.createElement("form", {
    className: "la-form",
    onSubmit: submit
  }, /*#__PURE__*/React.createElement(Input, {
    label: "E-mail",
    type: "email",
    placeholder: "voce@exemplo.dev",
    required: true
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Input, {
    label: "Senha",
    type: "password",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    required: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "la-row la-row--between",
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Lembrar de mim"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "la-link",
    onClick: () => go("forgot")
  }, "Esqueci a senha"))), /*#__PURE__*/React.createElement(Button, {
    full: true,
    size: "lg",
    loading: loading,
    type: "submit"
  }, "Entrar")), /*#__PURE__*/React.createElement("p", {
    className: "la-foot"
  }, "N\xE3o tem conta? ", /*#__PURE__*/React.createElement("button", {
    className: "la-link",
    onClick: () => go("signup")
  }, "Criar conta gratuita")));
}
function SignupScreen({
  go
}) {
  const [step, setStep] = React.useState(0);
  const [pwd, setPwd] = React.useState("");
  const strength = Math.min(100, pwd.length * 12);
  return /*#__PURE__*/React.createElement("div", {
    className: "la-card la-card--wide"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "la-title"
  }, "Criar conta"), /*#__PURE__*/React.createElement("p", {
    className: "la-sub"
  }, "Gratuito para projetos open source, para sempre."), /*#__PURE__*/React.createElement(Stepper, {
    steps: ["Conta", "Workspace", "Confirmação"],
    active: step,
    style: {
      marginBottom: "var(--space-2)"
    }
  }), step === 0 && /*#__PURE__*/React.createElement("form", {
    className: "la-form",
    onSubmit: e => {
      e.preventDefault();
      setStep(1);
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "E-mail",
    type: "email",
    placeholder: "voce@exemplo.dev",
    required: true
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Input, {
    label: "Senha",
    type: "password",
    placeholder: "M\xEDnimo de 8 caracteres",
    required: true,
    value: pwd,
    onChange: e => setPwd(e.target.value)
  }), pwd.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "la-strength"
  }, /*#__PURE__*/React.createElement(Progress, {
    value: strength,
    tone: strength < 50 ? "danger" : strength < 90 ? undefined : "success"
  }), /*#__PURE__*/React.createElement("span", null, strength < 50 ? "Fraca" : strength < 90 ? "Boa" : "Forte"))), /*#__PURE__*/React.createElement(Button, {
    full: true,
    size: "lg",
    type: "submit",
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 16
    })
  }, "Continuar")), step === 1 && /*#__PURE__*/React.createElement("form", {
    className: "la-form",
    onSubmit: e => {
      e.preventDefault();
      setStep(2);
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Nome do workspace",
    placeholder: "ex.: Time Aurora",
    required: true
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Framework principal",
    defaultValue: "react"
  }, /*#__PURE__*/React.createElement("option", {
    value: "react"
  }, "React"), /*#__PURE__*/React.createElement("option", {
    value: "vue"
  }, "Vue"), /*#__PURE__*/React.createElement("option", {
    value: "laravel"
  }, "Laravel Blade"), /*#__PURE__*/React.createElement("option", {
    value: "phoenix"
  }, "Phoenix LiveView")), /*#__PURE__*/React.createElement("div", {
    className: "la-row"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => setStep(0),
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-left",
      size: 16
    })
  }, "Voltar"), /*#__PURE__*/React.createElement(Button, {
    style: {
      flex: 1
    },
    size: "lg",
    type: "submit",
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 16
    })
  }, "Continuar"))), step === 2 && /*#__PURE__*/React.createElement("form", {
    className: "la-form",
    onSubmit: e => {
      e.preventDefault();
      go("done");
    }
  }, /*#__PURE__*/React.createElement(Alert, {
    tone: "info",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "mail",
      size: 18
    })
  }, "Enviamos um c\xF3digo de confirma\xE7\xE3o para o seu e-mail."), /*#__PURE__*/React.createElement(Input, {
    label: "C\xF3digo de verifica\xE7\xE3o",
    placeholder: "000 000",
    required: true,
    style: {
      fontFamily: "var(--font-mono)",
      letterSpacing: "0.2em"
    }
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Aceito os termos de uso e a pol\xEDtica de privacidade",
    required: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "la-row"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => setStep(1),
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-left",
      size: 16
    })
  }, "Voltar"), /*#__PURE__*/React.createElement(Button, {
    style: {
      flex: 1
    },
    size: "lg",
    type: "submit"
  }, "Criar conta"))), /*#__PURE__*/React.createElement("p", {
    className: "la-foot"
  }, "J\xE1 tem conta? ", /*#__PURE__*/React.createElement("button", {
    className: "la-link",
    onClick: () => go("login")
  }, "Entrar")));
}
function ForgotScreen({
  go
}) {
  const [sent, setSent] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    className: "la-card"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "la-title"
  }, "Recuperar senha"), /*#__PURE__*/React.createElement("p", {
    className: "la-sub"
  }, "Enviaremos um link de redefini\xE7\xE3o para o seu e-mail."), sent ? /*#__PURE__*/React.createElement("div", {
    className: "la-form"
  }, /*#__PURE__*/React.createElement(Alert, {
    tone: "success",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "circle-check",
      size: 18
    }),
    title: "Link enviado"
  }, "Confira sua caixa de entrada. O link vale por 30 minutos."), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    full: true,
    onClick: () => go("login"),
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-left",
      size: 16
    })
  }, "Voltar para o login")) : /*#__PURE__*/React.createElement("form", {
    className: "la-form",
    onSubmit: e => {
      e.preventDefault();
      setSent(true);
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "E-mail",
    type: "email",
    placeholder: "voce@exemplo.dev",
    required: true
  }), /*#__PURE__*/React.createElement(Button, {
    full: true,
    size: "lg",
    type: "submit"
  }, "Enviar link"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    full: true,
    onClick: () => go("login")
  }, "Voltar para o login")));
}
function DoneScreen({
  go
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "la-card la-card--center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "la-done-icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-check",
    size: 28
  })), /*#__PURE__*/React.createElement("h1", {
    className: "la-title"
  }, "Tudo pronto!"), /*#__PURE__*/React.createElement("p", {
    className: "la-sub"
  }, "Sua conta est\xE1 ativa. Esse seria o redirect para o painel."), /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Sess\xE3o autenticada"), /*#__PURE__*/React.createElement("div", {
    className: "la-row",
    style: {
      marginTop: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => go("login")
  }, "Reiniciar fluxo"), /*#__PURE__*/React.createElement(Button, {
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-up-right",
      size: 16
    }),
    onClick: () => {
      window.location.href = "../dashboard/index.html";
    }
  }, "Abrir painel")));
}
Object.assign(window, {
  BrandPanel,
  LoginScreen,
  SignupScreen,
  ForgotScreen,
  DoneScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/auth/screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/screens-admin.jsx
try { (() => {
/* Lyra Dashboard UI kit — telas admin: Membros e Cobrança */
const {
  Card,
  Table,
  Badge,
  Button,
  IconButton,
  Icon,
  Input,
  Select,
  Textarea,
  Avatar,
  Dropdown,
  Drawer,
  Tabs,
  Progress,
  Radio,
  Alert,
  Tooltip,
  Combobox
} = window.LyraDesignSystem_e82d95;
function MemberCell({
  name,
  email
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: name
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "lyra-table__primary"
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-xs)",
      color: "var(--text-muted)"
    }
  }, email)));
}
function RowMenu({
  danger
}) {
  return /*#__PURE__*/React.createElement(Dropdown, {
    align: "end",
    trigger: /*#__PURE__*/React.createElement(IconButton, {
      label: "Mais a\xE7\xF5es",
      variant: "ghost",
      size: "sm"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "ellipsis",
      size: 16
    })),
    items: [{
      id: "role",
      label: "Alterar papel",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "shield",
        size: 16
      })
    }, {
      id: "resend",
      label: "Reenviar convite",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "mail",
        size: 16
      })
    }, {
      type: "separator"
    }, {
      id: "remove",
      label: "Remover do workspace",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "trash-2",
        size: 16
      }),
      danger: true
    }]
  });
}
function MembersScreen() {
  const [invite, setInvite] = React.useState(false);
  const members = [{
    id: 1,
    who: /*#__PURE__*/React.createElement(MemberCell, {
      name: "Ana Souza",
      email: "ana@lyra.dev"
    }),
    role: /*#__PURE__*/React.createElement(Badge, {
      tone: "accent"
    }, "Owner"),
    status: /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, "Ativa"),
    seen: "agora",
    menu: /*#__PURE__*/React.createElement(RowMenu, null)
  }, {
    id: 2,
    who: /*#__PURE__*/React.createElement(MemberCell, {
      name: "L\xE9o Lima",
      email: "leo@lyra.dev"
    }),
    role: /*#__PURE__*/React.createElement(Badge, null, "Admin"),
    status: /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, "Ativo"),
    seen: "há 1h",
    menu: /*#__PURE__*/React.createElement(RowMenu, null)
  }, {
    id: 3,
    who: /*#__PURE__*/React.createElement(MemberCell, {
      name: "Bia Reis",
      email: "bia@lyra.dev"
    }),
    role: /*#__PURE__*/React.createElement(Badge, null, "Dev"),
    status: /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, "Ativa"),
    seen: "ontem",
    menu: /*#__PURE__*/React.createElement(RowMenu, null)
  }, {
    id: 4,
    who: /*#__PURE__*/React.createElement(MemberCell, {
      name: "Caio Melo",
      email: "caio@exemplo.dev"
    }),
    role: /*#__PURE__*/React.createElement(Badge, null, "Dev"),
    status: /*#__PURE__*/React.createElement(Badge, {
      tone: "warning",
      dot: true
    }, "Convite pendente"),
    seen: "—",
    menu: /*#__PURE__*/React.createElement(RowMenu, null)
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "ld-stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-toolbar"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "ld-section-title"
  }, "Membros do workspace"), /*#__PURE__*/React.createElement("p", {
    className: "ld-section-sub"
  }, "4 de 10 assentos usados no plano Pro.")), /*#__PURE__*/React.createElement("div", {
    className: "ld-toolbar__right"
  }, /*#__PURE__*/React.createElement(Input, {
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 16
    }),
    placeholder: "Buscar membro\u2026",
    size: "sm"
  }), /*#__PURE__*/React.createElement(Button, {
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "user-plus",
      size: 16
    }),
    onClick: () => setInvite(true)
  }, "Convidar"))), /*#__PURE__*/React.createElement(Table, {
    hover: true,
    columns: [{
      key: "who",
      label: "Membro"
    }, {
      key: "role",
      label: "Papel"
    }, {
      key: "status",
      label: "Status"
    }, {
      key: "seen",
      label: "Visto por último"
    }, {
      key: "menu",
      label: "",
      align: "right"
    }],
    rows: members
  }), /*#__PURE__*/React.createElement(Drawer, {
    open: invite,
    onClose: () => setInvite(false),
    title: "Convidar membros",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => setInvite(false)
    }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "send",
        size: 16
      }),
      onClick: () => setInvite(false)
    }, "Enviar convites"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-stack",
    style: {
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Textarea, {
    label: "E-mails",
    hint: "Um por linha. M\xE1ximo de 6 assentos restantes.",
    placeholder: "joana@exemplo.dev\npedro@exemplo.dev",
    rows: 4
  }), /*#__PURE__*/React.createElement(Combobox, {
    label: "Papel",
    defaultValue: "dev",
    options: [{
      value: "admin",
      label: "Admin",
      hint: "gerencia membros e cobrança"
    }, {
      value: "dev",
      label: "Dev",
      hint: "edita projetos e tokens"
    }, {
      value: "viewer",
      label: "Viewer",
      hint: "somente leitura"
    }]
  }), /*#__PURE__*/React.createElement(Alert, {
    tone: "info",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "info",
      size: 18
    })
  }, "Convites expiram em 7 dias."))));
}
function PlanCard({
  name,
  price,
  desc,
  current,
  selected,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: ["ld-plan", selected && "ld-plan--selected"].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-plan__head"
  }, /*#__PURE__*/React.createElement(Radio, {
    name: "plan",
    checked: selected,
    onChange: onSelect
  }), /*#__PURE__*/React.createElement("span", {
    className: "ld-plan__name"
  }, name), current && /*#__PURE__*/React.createElement(Badge, {
    tone: "accent"
  }, "Atual")), /*#__PURE__*/React.createElement("div", {
    className: "ld-plan__price"
  }, price, /*#__PURE__*/React.createElement("span", null, "/m\xEAs")), /*#__PURE__*/React.createElement("p", {
    className: "ld-plan__desc"
  }, desc));
}
function BillingScreen() {
  const [plan, setPlan] = React.useState("pro");
  return /*#__PURE__*/React.createElement("div", {
    className: "ld-stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-grid-2-1"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Plano"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-plans"
  }, /*#__PURE__*/React.createElement(PlanCard, {
    name: "Free",
    price: "R$ 0",
    desc: "3 projetos, 2 membros, comunidade.",
    selected: plan === "free",
    onSelect: () => setPlan("free")
  }), /*#__PURE__*/React.createElement(PlanCard, {
    name: "Pro",
    price: "R$ 49",
    desc: "Projetos ilimitados, 10 membros, suporte.",
    current: true,
    selected: plan === "pro",
    onSelect: () => setPlan("pro")
  }), /*#__PURE__*/React.createElement(PlanCard, {
    name: "Team",
    price: "R$ 199",
    desc: "Membros ilimitados, SSO, SLA dedicado.",
    selected: plan === "team",
    onSelect: () => setPlan("team")
  })), /*#__PURE__*/React.createElement("div", {
    className: "ld-plan-actions"
  }, /*#__PURE__*/React.createElement(Button, {
    disabled: plan === "pro"
  }, plan === "pro" ? "Plano atual" : "Mudar de plano"))), /*#__PURE__*/React.createElement("div", {
    className: "ld-stack",
    style: {
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Uso do ciclo"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-stack",
    style: {
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ld-goal-row"
  }, /*#__PURE__*/React.createElement("span", null, "Assentos"), /*#__PURE__*/React.createElement("strong", null, "4/10")), /*#__PURE__*/React.createElement(Progress, {
    value: 40
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ld-goal-row"
  }, /*#__PURE__*/React.createElement("span", null, "Builds de tema"), /*#__PURE__*/React.createElement("strong", null, "1.840/2.000")), /*#__PURE__*/React.createElement(Progress, {
    value: 92,
    tone: "danger"
  })))), /*#__PURE__*/React.createElement(Card, {
    title: "Pagamento",
    actions: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost"
    }, "Trocar")
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-payment"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-payment__chip"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "credit-card",
    size: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "ld-payment__num"
  }, "Mastercard \u2022\u2022\u2022\u2022 4842"), /*#__PURE__*/React.createElement("p", {
    className: "ld-payment__exp"
  }, "Expira 08/2027")))))), /*#__PURE__*/React.createElement(Card, {
    title: "Faturas",
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    columns: [{
      key: "id",
      label: "Fatura"
    }, {
      key: "date",
      label: "Data"
    }, {
      key: "amount",
      label: "Valor"
    }, {
      key: "status",
      label: "Status"
    }, {
      key: "dl",
      label: "",
      align: "right"
    }],
    rows: [{
      id: /*#__PURE__*/React.createElement("span", {
        className: "lyra-table__primary"
      }, "#2026-006"),
      date: "01 jun 2026",
      amount: "R$ 49,00",
      status: /*#__PURE__*/React.createElement(Badge, {
        tone: "success",
        dot: true
      }, "Paga"),
      dl: /*#__PURE__*/React.createElement(Tooltip, {
        tip: "Baixar PDF"
      }, /*#__PURE__*/React.createElement(IconButton, {
        label: "Baixar",
        variant: "ghost",
        size: "sm"
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "download",
        size: 16
      })))
    }, {
      id: /*#__PURE__*/React.createElement("span", {
        className: "lyra-table__primary"
      }, "#2026-005"),
      date: "01 mai 2026",
      amount: "R$ 49,00",
      status: /*#__PURE__*/React.createElement(Badge, {
        tone: "success",
        dot: true
      }, "Paga"),
      dl: /*#__PURE__*/React.createElement(Tooltip, {
        tip: "Baixar PDF"
      }, /*#__PURE__*/React.createElement(IconButton, {
        label: "Baixar",
        variant: "ghost",
        size: "sm"
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "download",
        size: 16
      })))
    }, {
      id: /*#__PURE__*/React.createElement("span", {
        className: "lyra-table__primary"
      }, "#2026-004"),
      date: "01 abr 2026",
      amount: "R$ 49,00",
      status: /*#__PURE__*/React.createElement(Badge, {
        tone: "warning",
        dot: true
      }, "Em aberto"),
      dl: /*#__PURE__*/React.createElement(Tooltip, {
        tip: "Baixar PDF"
      }, /*#__PURE__*/React.createElement(IconButton, {
        label: "Baixar",
        variant: "ghost",
        size: "sm"
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "download",
        size: 16
      })))
    }]
  })));
}
Object.assign(window, {
  MembersScreen,
  BillingScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/screens-admin.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/screens-files.jsx
try { (() => {
/* Lyra Dashboard UI kit — tela Arquivos: FileManager + FileUpload */
const {
  Card: FilesCard,
  FileManager: LyraFileManager,
  FileUpload: LyraFileUpload
} = window.LyraDesignSystem_e82d95;
const FILES_ROOT = [{
  id: "f1",
  name: "Brand",
  type: "folder",
  items: 4,
  updated: "há 2 dias",
  shared: true
}, {
  id: "f2",
  name: "Contratos",
  type: "folder",
  items: 2,
  updated: "há 1 semana"
}, {
  id: "a1",
  name: "proposta-v3.pdf",
  size: 1840000,
  updated: "ontem"
}, {
  id: "a2",
  name: "orçamento-2026.xlsx",
  size: 96000,
  updated: "há 3 dias"
}, {
  id: "a3",
  name: "capa-site.png",
  size: 2400000,
  updated: "há 1 semana",
  shared: true
}];
const FILES_CHILDREN = {
  f1: [{
    id: "b1",
    name: "lyra-mark.svg",
    size: 4200,
    updated: "há 2 dias"
  }, {
    id: "b2",
    name: "wordmark.svg",
    size: 3800,
    updated: "há 2 dias"
  }, {
    id: "b3",
    name: "paleta.png",
    size: 880000,
    updated: "há 5 dias"
  }, {
    id: "b4",
    name: "guidelines.pdf",
    size: 5200000,
    updated: "há 1 semana"
  }],
  f2: [{
    id: "c1",
    name: "contrato-acme.pdf",
    size: 482000,
    updated: "há 1 semana"
  }, {
    id: "c2",
    name: "aditivo-2026.pdf",
    size: 310000,
    updated: "há 2 semanas"
  }]
};
function FilesScreen() {
  const [path, setPath] = React.useState(["Meu Drive"]);
  const [folderId, setFolderId] = React.useState(null);
  const files = folderId ? FILES_CHILDREN[folderId] || [] : FILES_ROOT;
  return /*#__PURE__*/React.createElement("div", {
    className: "ld-grid-2-1"
  }, /*#__PURE__*/React.createElement(LyraFileManager, {
    path: path,
    files: files,
    onOpen: f => {
      if (f.type === "folder") {
        setFolderId(f.id);
        setPath(p => [...p, f.name]);
      }
    },
    onNavigate: i => {
      if (i === 0) {
        setFolderId(null);
        setPath(["Meu Drive"]);
      }
    }
  }), /*#__PURE__*/React.createElement(FilesCard, {
    title: "Enviar arquivos"
  }, /*#__PURE__*/React.createElement(LyraFileUpload, {
    accept: ".pdf,.png,.svg,.xlsx,.zip",
    maxSizeMB: 25,
    label: "Arraste ou clique para enviar"
  })));
}
Object.assign(window, {
  FilesScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/screens-files.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/screens.jsx
try { (() => {
/* Lyra Dashboard UI kit — telas: Overview, Projects, Settings */
const {
  Card,
  Stat,
  Table,
  Badge,
  Button,
  Icon,
  Tabs,
  Tag,
  Avatar,
  AvatarGroup,
  Input,
  Select,
  Switch,
  Checkbox,
  Progress,
  EmptyState,
  Alert,
  Dialog,
  Textarea
} = window.LyraDesignSystem_e82d95;

/* --- mini bar chart (dados fake, desenhado com divs) --- */
function BarChart() {
  const data = [42, 58, 51, 66, 72, 64, 80, 74, 88, 92, 85, 98];
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return /*#__PURE__*/React.createElement("div", {
    className: "ld-chart"
  }, data.map((v, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "ld-chart__col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-chart__bar",
    style: {
      height: `${v}%`,
      opacity: i === data.length - 1 ? 1 : undefined
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "ld-chart__lbl"
  }, months[i]))));
}
function OverviewScreen() {
  const [period, setPeriod] = React.useState("30d");
  return /*#__PURE__*/React.createElement("div", {
    className: "ld-stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-grid-4"
  }, /*#__PURE__*/React.createElement(Card, {
    padded: true
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Downloads mensais",
    value: "48.210",
    delta: "12,4%",
    direction: "up"
  })), /*#__PURE__*/React.createElement(Card, {
    padded: true
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Estrelas no GitHub",
    value: "3.842",
    delta: "214 este m\xEAs",
    direction: "up"
  })), /*#__PURE__*/React.createElement(Card, {
    padded: true
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Issues abertas",
    value: "37",
    delta: "9 fechadas",
    direction: "down"
  })), /*#__PURE__*/React.createElement(Card, {
    padded: true
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Contribuidores",
    value: "214",
    delta: "est\xE1vel",
    direction: "flat"
  }))), /*#__PURE__*/React.createElement(Card, {
    title: "Downloads por m\xEAs",
    actions: /*#__PURE__*/React.createElement(Tabs, {
      variant: "pills",
      active: period,
      onChange: setPeriod,
      items: [{
        id: "30d",
        label: "30 dias"
      }, {
        id: "12m",
        label: "12 meses"
      }]
    })
  }, /*#__PURE__*/React.createElement(BarChart, null)), /*#__PURE__*/React.createElement("div", {
    className: "ld-grid-2-1"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Pacotes",
    actions: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost",
      iconRight: /*#__PURE__*/React.createElement(Icon, {
        name: "arrow-right",
        size: 14
      })
    }, "Ver todos"),
    padded: false
  }, /*#__PURE__*/React.createElement(Table, {
    hover: true,
    columns: [{
      key: "name",
      label: "Pacote"
    }, {
      key: "status",
      label: "Status"
    }, {
      key: "version",
      label: "Versão"
    }, {
      key: "downloads",
      label: "Downloads",
      align: "right"
    }],
    rows: [{
      id: 1,
      name: /*#__PURE__*/React.createElement("span", {
        className: "lyra-table__primary"
      }, "@lyra-ds/react"),
      status: /*#__PURE__*/React.createElement(Badge, {
        tone: "success",
        dot: true
      }, "Est\xE1vel"),
      version: "1.0.4",
      downloads: "21.480"
    }, {
      id: 2,
      name: /*#__PURE__*/React.createElement("span", {
        className: "lyra-table__primary"
      }, "@lyra-ds/vue"),
      status: /*#__PURE__*/React.createElement(Badge, {
        tone: "warning",
        dot: true
      }, "Beta"),
      version: "0.9.1",
      downloads: "12.077"
    }, {
      id: 3,
      name: /*#__PURE__*/React.createElement("span", {
        className: "lyra-table__primary"
      }, "lyra/blade"),
      status: /*#__PURE__*/React.createElement(Badge, {
        tone: "warning",
        dot: true
      }, "Beta"),
      version: "0.8.0",
      downloads: "8.652"
    }, {
      id: 4,
      name: /*#__PURE__*/React.createElement("span", {
        className: "lyra-table__primary"
      }, "lyra_liveview"),
      status: /*#__PURE__*/React.createElement(Badge, {
        tone: "info",
        dot: true
      }, "Em dev"),
      version: "0.3.0",
      downloads: "6.001"
    }]
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Meta da v1.1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-stack",
    style: {
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ld-goal-row"
  }, /*#__PURE__*/React.createElement("span", null, "Componentes migrados"), /*#__PURE__*/React.createElement("strong", null, "28/32")), /*#__PURE__*/React.createElement(Progress, {
    value: 87
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ld-goal-row"
  }, /*#__PURE__*/React.createElement("span", null, "Cobertura de a11y"), /*#__PURE__*/React.createElement("strong", null, "74%")), /*#__PURE__*/React.createElement(Progress, {
    value: 74
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ld-goal-row"
  }, /*#__PURE__*/React.createElement("span", null, "Docs traduzidas"), /*#__PURE__*/React.createElement("strong", null, "41%")), /*#__PURE__*/React.createElement(Progress, {
    value: 41,
    tone: "danger"
  })), /*#__PURE__*/React.createElement(Alert, {
    tone: "info",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "info",
      size: 18
    })
  }, "Release candidate prevista para 28 de junho.")))));
}
function ProjectsScreen() {
  const [tab, setTab] = React.useState("ativos");
  const [open, setOpen] = React.useState(false);
  const projects = [{
    id: 1,
    name: "lyra-react",
    desc: "Componentes React",
    status: /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, "Ativo"),
    team: ["Ana Souza", "Léo Lima", "Bia Reis"],
    updated: "há 2h"
  }, {
    id: 2,
    name: "lyra-vue",
    desc: "Componentes Vue 3",
    status: /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, "Ativo"),
    team: ["Caio Melo", "Ana Souza"],
    updated: "ontem"
  }, {
    id: 3,
    name: "lyra-blade",
    desc: "Componentes Laravel Blade",
    status: /*#__PURE__*/React.createElement(Badge, {
      tone: "warning",
      dot: true
    }, "Beta"),
    team: ["Duda Reis"],
    updated: "há 3 dias"
  }, {
    id: 4,
    name: "lyra_liveview",
    desc: "Phoenix LiveView",
    status: /*#__PURE__*/React.createElement(Badge, {
      tone: "info",
      dot: true
    }, "Em dev"),
    team: ["Léo Lima", "Bia Reis"],
    updated: "há 4 dias"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "ld-stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-toolbar"
  }, /*#__PURE__*/React.createElement(Tabs, {
    active: tab,
    onChange: setTab,
    items: [{
      id: "ativos",
      label: "Ativos",
      count: 4
    }, {
      id: "arquivados",
      label: "Arquivados",
      count: 2
    }]
  }), /*#__PURE__*/React.createElement("div", {
    className: "ld-toolbar__right"
  }, /*#__PURE__*/React.createElement(Input, {
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 16
    }),
    placeholder: "Filtrar projetos\u2026",
    size: "sm"
  }), /*#__PURE__*/React.createElement(Button, {
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 16
    }),
    onClick: () => setOpen(true)
  }, "Novo projeto"))), tab === "ativos" ? /*#__PURE__*/React.createElement("div", {
    className: "ld-grid-2"
  }, projects.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.id,
    interactive: true,
    padded: true
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-proj"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-proj__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ld-proj__name"
  }, p.name), p.status), /*#__PURE__*/React.createElement("p", {
    className: "ld-proj__desc"
  }, p.desc), /*#__PURE__*/React.createElement("div", {
    className: "ld-proj__foot"
  }, /*#__PURE__*/React.createElement(AvatarGroup, null, p.team.map(t => /*#__PURE__*/React.createElement(Avatar, {
    key: t,
    name: t,
    size: "sm"
  }))), /*#__PURE__*/React.createElement("span", {
    className: "ld-proj__time"
  }, "atualizado ", p.updated)))))) : /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(EmptyState, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "archive",
      size: 24
    }),
    title: "Nada arquivado por aqui",
    description: "Projetos arquivados aparecem nesta aba. Voc\xEA pode arquivar um projeto pelo menu de contexto."
  })), /*#__PURE__*/React.createElement(Dialog, {
    open: open,
    onClose: () => setOpen(false),
    title: "Novo projeto",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => setOpen(false)
    }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => setOpen(false)
    }, "Criar projeto"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-stack",
    style: {
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Nome",
    placeholder: "ex.: lyra-svelte"
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Framework",
    defaultValue: "react"
  }, /*#__PURE__*/React.createElement("option", {
    value: "react"
  }, "React"), /*#__PURE__*/React.createElement("option", {
    value: "vue"
  }, "Vue"), /*#__PURE__*/React.createElement("option", {
    value: "laravel"
  }, "Laravel Blade"), /*#__PURE__*/React.createElement("option", {
    value: "phoenix"
  }, "Phoenix LiveView")), /*#__PURE__*/React.createElement(Textarea, {
    label: "Descri\xE7\xE3o",
    placeholder: "O que esse pacote cobre?",
    rows: 3
  }))));
}
function SettingsScreen() {
  return /*#__PURE__*/React.createElement("div", {
    className: "ld-settings"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Perfil"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-stack",
    style: {
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-grid-2",
    style: {
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Nome",
    defaultValue: "Ana Souza"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "E-mail",
    defaultValue: "ana@lyra.dev",
    hint: "Usado para notifica\xE7\xF5es."
  })), /*#__PURE__*/React.createElement(Input, {
    label: "GitHub",
    defaultValue: "github.com/anasouza",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "github",
      size: 16
    })
  }))), /*#__PURE__*/React.createElement(Card, {
    title: "Prefer\xEAncias"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-stack",
    style: {
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Notifica\xE7\xF5es por e-mail",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Resumo semanal do projeto",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Avisos de breaking change"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid var(--border-default)",
      paddingTop: "var(--space-3)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Participar do programa beta",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Compartilhar telemetria an\xF4nima"
  })))), /*#__PURE__*/React.createElement(Card, {
    title: "Zona de perigo"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-danger-row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "ld-danger-row__t"
  }, "Excluir workspace"), /*#__PURE__*/React.createElement("p", {
    className: "ld-danger-row__d"
  }, "Remove todos os projetos e membros. Essa a\xE7\xE3o n\xE3o pode ser desfeita.")), /*#__PURE__*/React.createElement(Button, {
    variant: "danger"
  }, "Excluir"))), /*#__PURE__*/React.createElement("div", {
    className: "ld-settings__save"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, "Descartar"), /*#__PURE__*/React.createElement(Button, {
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 16
    })
  }, "Salvar altera\xE7\xF5es")));
}
function PlaceholderScreen({
  icon,
  title,
  desc
}) {
  return /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(EmptyState, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: icon,
      size: 24
    }),
    title: title,
    description: desc
  }));
}
Object.assign(window, {
  OverviewScreen,
  ProjectsScreen,
  SettingsScreen,
  PlaceholderScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/shell.jsx
try { (() => {
/* Lyra Dashboard UI kit — shell: Sidebar + Topbar (apresentacional) */
const {
  Icon,
  IconButton,
  Avatar,
  Badge,
  Input,
  Tooltip,
  Dropdown,
  WorkspaceSwitcher,
  CreateWorkspaceDialog,
  SidebarGroup,
  CommandPalette
} = window.LyraDesignSystem_e82d95;
function LyraSidebar({
  active,
  onNavigate
}) {
  const [workspaces, setWorkspaces] = React.useState([{
    id: "acme",
    name: "Acme Inc",
    plan: "Pro",
    members: 12
  }, {
    id: "lab",
    name: "Lyra Labs",
    plan: "Free",
    members: 3
  }]);
  const [ws, setWs] = React.useState("acme");
  const [creating, setCreating] = React.useState(false);
  const groups = [{
    label: "Geral",
    items: [{
      id: "overview",
      label: "Visão geral",
      icon: "layout-dashboard"
    }, {
      id: "projects",
      label: "Projetos",
      icon: "folder",
      badge: 8
    }, {
      id: "files",
      label: "Arquivos",
      icon: "hard-drive"
    }, {
      id: "members",
      label: "Membros",
      icon: "users"
    }]
  }, {
    label: "Administração",
    items: [{
      id: "billing",
      label: "Cobrança",
      icon: "credit-card"
    }, {
      id: "settings",
      label: "Configurações",
      icon: "settings"
    }]
  }];
  return /*#__PURE__*/React.createElement("aside", {
    className: "ld-sidebar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-sidebar__brand"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/lyra-mark.svg",
    alt: "",
    className: "ld-sidebar__mark ld-mark-light"
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/lyra-mark-light.svg",
    alt: "",
    className: "ld-sidebar__mark ld-mark-dark"
  }), /*#__PURE__*/React.createElement("span", {
    className: "ld-sidebar__word"
  }, "Lyra"), /*#__PURE__*/React.createElement(Badge, {
    tone: "accent"
  }, "v1.0")), /*#__PURE__*/React.createElement(WorkspaceSwitcher, {
    workspaces: workspaces,
    current: ws,
    onChange: setWs,
    onCreate: () => setCreating(true)
  }), /*#__PURE__*/React.createElement(CreateWorkspaceDialog, {
    open: creating,
    onClose: () => setCreating(false),
    onCreate: ({
      name,
      slug
    }) => {
      setWorkspaces(prev => [...prev, {
        id: slug,
        name,
        plan: "Free",
        members: 1
      }]);
      setWs(slug);
    }
  }), /*#__PURE__*/React.createElement("nav", {
    className: "ld-sidebar__nav"
  }, groups.map(g => /*#__PURE__*/React.createElement(SidebarGroup, {
    key: g.label,
    label: g.label,
    items: g.items.map(n => ({
      id: n.id,
      label: n.label,
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: n.icon,
        size: 17
      }),
      badge: n.badge,
      active: active === n.id
    })),
    onSelect: id => onNavigate(id)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "ld-sidebar__foot"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Ana Souza",
    status: "online"
  }), /*#__PURE__*/React.createElement("div", {
    className: "ld-sidebar__user"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ld-sidebar__name"
  }, "Ana Souza"), /*#__PURE__*/React.createElement("span", {
    className: "ld-sidebar__mail"
  }, "ana@lyra.dev")), /*#__PURE__*/React.createElement(Tooltip, {
    tip: "Sair"
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Sair",
    variant: "ghost",
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "log-out",
    size: 16
  })))));
}
function LyraTopbar({
  title,
  dark,
  onToggleTheme,
  onNavigate,
  onOpenPalette
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "ld-topbar"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "ld-topbar__title"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "ld-topbar__actions"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-topbar__search",
    onMouseDown: e => {
      e.preventDefault();
      onOpenPalette && onOpenPalette();
    }
  }, /*#__PURE__*/React.createElement(Input, {
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 16
    }),
    placeholder: "Buscar\u2026 (\u2318K)",
    size: "sm",
    readOnly: true
  })), /*#__PURE__*/React.createElement(Tooltip, {
    tip: dark ? "Tema claro" : "Tema escuro"
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Alternar tema",
    variant: "ghost",
    onClick: onToggleTheme
  }, /*#__PURE__*/React.createElement(Icon, {
    name: dark ? "sun" : "moon",
    size: 18
  }))), /*#__PURE__*/React.createElement(Tooltip, {
    tip: "Notifica\xE7\xF5es"
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Notifica\xE7\xF5es",
    variant: "ghost"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: 18
  }))), /*#__PURE__*/React.createElement(Dropdown, {
    align: "end",
    trigger: /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "ld-topbar__avatar",
      "aria-label": "Menu do usu\xE1rio"
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Ana Souza",
      size: "md"
    })),
    items: [{
      type: "label",
      label: "ana@lyra.dev"
    }, {
      id: "profile",
      label: "Perfil",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "user",
        size: 16
      })
    }, {
      id: "settings",
      label: "Configurações",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "settings",
        size: 16
      }),
      onSelect: () => onNavigate && onNavigate("settings")
    }, {
      id: "theme",
      label: dark ? "Tema claro" : "Tema escuro",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: dark ? "sun" : "moon",
        size: 16
      }),
      onSelect: onToggleTheme
    }, {
      type: "separator"
    }, {
      id: "logout",
      label: "Sair",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "log-out",
        size: 16
      }),
      danger: true
    }]
  })));
}
function LyraCommandPalette({
  open,
  onOpen,
  onClose,
  onNavigate
}) {
  const go = screen => () => onNavigate(screen);
  return /*#__PURE__*/React.createElement(CommandPalette, {
    open: open,
    onOpen: onOpen,
    onClose: onClose,
    groups: [{
      label: "Ações",
      items: [{
        id: "new-project",
        label: "Novo projeto",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "plus",
          size: 17
        }),
        shortcut: "⌘ N",
        onSelect: go("projects")
      }, {
        id: "upload",
        label: "Enviar arquivo",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "cloud-upload",
          size: 17
        }),
        onSelect: go("files")
      }, {
        id: "invite",
        label: "Convidar membro",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "user-plus",
          size: 17
        }),
        onSelect: go("members")
      }]
    }, {
      label: "Ir para",
      items: [{
        id: "overview",
        label: "Visão geral",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "layout-dashboard",
          size: 17
        }),
        shortcut: "G V",
        onSelect: go("overview")
      }, {
        id: "projects",
        label: "Projetos",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "folder",
          size: 17
        }),
        shortcut: "G P",
        onSelect: go("projects")
      }, {
        id: "files",
        label: "Arquivos",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "hard-drive",
          size: 17
        }),
        shortcut: "G A",
        onSelect: go("files")
      }, {
        id: "members",
        label: "Membros",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "users",
          size: 17
        }),
        shortcut: "G M",
        onSelect: go("members")
      }, {
        id: "billing",
        label: "Cobrança",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "credit-card",
          size: 17
        }),
        onSelect: go("billing")
      }, {
        id: "settings",
        label: "Configurações",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "settings",
          size: 17
        }),
        onSelect: go("settings")
      }]
    }]
  });
}
Object.assign(window, {
  LyraSidebar,
  LyraTopbar,
  LyraCommandPalette
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/docs.jsx
try { (() => {
/* Lyra Website UI kit — página de docs */
const {
  Button,
  Badge,
  Icon,
  Alert,
  Breadcrumb
} = window.LyraDesignSystem_e82d95;
function DocsSidebar({
  active,
  onSelect
}) {
  const groups = [{
    title: "Introdução",
    items: ["Instalação", "Tokens", "Temas"]
  }, {
    title: "Componentes",
    items: ["Button", "Input", "Card", "Dialog", "Table"]
  }];
  return /*#__PURE__*/React.createElement("aside", {
    className: "lw-docs__side"
  }, groups.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.title,
    className: "lw-docs__group"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lw-docs__group-title"
  }, g.title), g.items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it,
    className: ["lw-docs__item", active === it && "lw-docs__item--active"].filter(Boolean).join(" "),
    onClick: () => onSelect(it)
  }, it)))));
}
function DocsContent({
  topic
}) {
  return /*#__PURE__*/React.createElement("article", {
    className: "lw-docs__content"
  }, /*#__PURE__*/React.createElement(Breadcrumb, {
    items: [{
      label: "Docs",
      href: "#"
    }, {
      label: topic
    }]
  }), /*#__PURE__*/React.createElement("h1", {
    className: "lw-docs__title"
  }, topic), topic === "Instalação" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "lw-docs__p"
  }, "Instale o pacote do seu framework e importe o CSS uma \xFAnica vez na raiz do app."), /*#__PURE__*/React.createElement("pre", {
    className: "lw-show__code"
  }, `npm i @lyra-ds/react

// main.jsx
import "@lyra-ds/styles/styles.css";`), /*#__PURE__*/React.createElement(Alert, {
    tone: "info",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "info",
      size: 18
    })
  }, "Vue, Laravel e Phoenix usam as mesmas classes CSS \u2014 s\xF3 muda o adapter."), /*#__PURE__*/React.createElement("h2", {
    className: "lw-docs__h2"
  }, "Tema escuro"), /*#__PURE__*/React.createElement("p", {
    className: "lw-docs__p"
  }, "Adicione ", /*#__PURE__*/React.createElement("code", null, "data-theme=\"dark\""), " ao elemento ", /*#__PURE__*/React.createElement("code", null, "html"), ". Todos os tokens sem\xE2nticos respondem automaticamente."), /*#__PURE__*/React.createElement("pre", {
    className: "lw-show__code"
  }, `<html data-theme="dark">`)) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "lw-docs__p"
  }, "Documenta\xE7\xE3o de ", /*#__PURE__*/React.createElement("strong", null, topic), " \u2014 escrita em andamento pela comunidade. Enquanto isso, veja o uso real no ", /*#__PURE__*/React.createElement("code", null, "components/*/", "{", "Name", "}", ".prompt.md"), " do reposit\xF3rio."), /*#__PURE__*/React.createElement(Alert, {
    tone: "warning",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "pencil",
      size: 18
    })
  }, "Quer contribuir? Esta p\xE1gina aceita PRs no reposit\xF3rio lyra-ds/docs.")), /*#__PURE__*/React.createElement("div", {
    className: "lw-docs__foot"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-left",
      size: 14
    })
  }, "Anterior"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 14
    })
  }, "Pr\xF3xima")));
}
function DocsPage() {
  const [topic, setTopic] = React.useState("Instalação");
  return /*#__PURE__*/React.createElement("div", {
    className: "lw-container lw-docs"
  }, /*#__PURE__*/React.createElement(DocsSidebar, {
    active: topic,
    onSelect: setTopic
  }), /*#__PURE__*/React.createElement(DocsContent, {
    topic: topic
  }));
}
Object.assign(window, {
  DocsPage
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/docs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/sections-marketing.jsx
try { (() => {
/* Lyra Website UI kit — seções comerciais: pricing, comparação, depoimentos, FAQ, CTA */
const {
  Button,
  Badge,
  Icon,
  Card,
  Tabs,
  Avatar,
  Accordion,
  Table,
  Tooltip,
  Dialog,
  Input
} = window.LyraDesignSystem_e82d95;
function CheckItem({
  children,
  muted
}) {
  return /*#__PURE__*/React.createElement("li", {
    className: ["lw-check", muted && "lw-check--muted"].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement(Icon, {
    name: muted ? "minus" : "check",
    size: 16
  }), /*#__PURE__*/React.createElement("span", null, children));
}
function PricingSection() {
  const [cycle, setCycle] = React.useState("monthly");
  const [checkout, setCheckout] = React.useState(false);
  const annual = cycle === "annual";
  return /*#__PURE__*/React.createElement("section", {
    className: "lw-section",
    id: "precos"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-center-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lw-overline"
  }, "Pre\xE7os"), /*#__PURE__*/React.createElement("h2", {
    className: "lw-h2"
  }, "Community para sempre, Pro quando crescer"), /*#__PURE__*/React.createElement("p", {
    className: "lw-section__sub",
    style: {
      margin: "0 auto var(--space-6)"
    }
  }, "O design system inteiro \xE9 MIT. O Pro financia o projeto com ferramentas para times."), /*#__PURE__*/React.createElement(Tabs, {
    variant: "pills",
    active: cycle,
    onChange: setCycle,
    items: [{
      id: "monthly",
      label: "Mensal"
    }, {
      id: "annual",
      label: "Anual · −20%"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    className: "lw-price-grid"
  }, /*#__PURE__*/React.createElement(Card, {
    padded: true,
    className: "lw-price"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-price__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lw-price__name"
  }, "Community"), /*#__PURE__*/React.createElement(Badge, {
    tone: "success"
  }, "Open source")), /*#__PURE__*/React.createElement("div", {
    className: "lw-price__value"
  }, "R$ 0", /*#__PURE__*/React.createElement("span", null, " para sempre")), /*#__PURE__*/React.createElement("p", {
    className: "lw-price__desc"
  }, "Tudo que voc\xEA viu aqui, sem limites de uso."), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    full: true,
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "github",
      size: 16
    })
  }, "Come\xE7ar no GitHub"), /*#__PURE__*/React.createElement("ul", {
    className: "lw-checks"
  }, /*#__PURE__*/React.createElement(CheckItem, null, "Todos os 32 componentes"), /*#__PURE__*/React.createElement(CheckItem, null, "Temas claro e escuro"), /*#__PURE__*/React.createElement(CheckItem, null, "React, Vue, Blade e LiveView"), /*#__PURE__*/React.createElement(CheckItem, null, "Comunidade no Discord"), /*#__PURE__*/React.createElement(CheckItem, {
    muted: true
  }, "Tema custom builder"), /*#__PURE__*/React.createElement(CheckItem, {
    muted: true
  }, "Suporte priorit\xE1rio"))), /*#__PURE__*/React.createElement(Card, {
    padded: true,
    className: "lw-price lw-price--featured"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-price__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lw-price__name"
  }, "Pro"), /*#__PURE__*/React.createElement(Badge, {
    tone: "accent",
    dot: true
  }, "Recomendado")), /*#__PURE__*/React.createElement("div", {
    className: "lw-price__value"
  }, "R$ ", annual ? "39" : "49", /*#__PURE__*/React.createElement("span", null, "/m\xEAs por time", annual ? " · cobrado anualmente" : "")), /*#__PURE__*/React.createElement("p", {
    className: "lw-price__desc"
  }, "Para times que vivem do Lyra no dia a dia."), /*#__PURE__*/React.createElement(Button, {
    full: true,
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 16
    }),
    onClick: () => setCheckout(true)
  }, "Assinar Pro"), /*#__PURE__*/React.createElement("ul", {
    className: "lw-checks"
  }, /*#__PURE__*/React.createElement(CheckItem, null, "Tudo do Community"), /*#__PURE__*/React.createElement(CheckItem, null, "Tema custom builder (white-label)"), /*#__PURE__*/React.createElement(CheckItem, null, "Kit Figma sincronizado com tokens"), /*#__PURE__*/React.createElement(CheckItem, null, "Suporte priorit\xE1rio em 24h"), /*#__PURE__*/React.createElement(CheckItem, null, "Workspace de at\xE9 10 membros"), /*#__PURE__*/React.createElement(CheckItem, null, "Acesso antecipado a componentes")))), /*#__PURE__*/React.createElement("div", {
    className: "lw-compare"
  }, /*#__PURE__*/React.createElement(Table, {
    columns: [{
      key: "feat",
      label: "Recurso"
    }, {
      key: "community",
      label: "Community",
      align: "center"
    }, {
      key: "pro",
      label: "Pro",
      align: "center"
    }],
    rows: [{
      id: 1,
      feat: /*#__PURE__*/React.createElement("span", {
        className: "lyra-table__primary"
      }, "Componentes e tokens"),
      community: /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 18,
        color: "var(--success)",
        title: "Inclu\xEDdo"
      }),
      pro: /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 18,
        color: "var(--success)",
        title: "Inclu\xEDdo"
      })
    }, {
      id: 2,
      feat: /*#__PURE__*/React.createElement("span", {
        className: "lyra-table__primary"
      }, "Uso comercial (MIT)"),
      community: /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 18,
        color: "var(--success)",
        title: "Inclu\xEDdo"
      }),
      pro: /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 18,
        color: "var(--success)",
        title: "Inclu\xEDdo"
      })
    }, {
      id: 3,
      feat: /*#__PURE__*/React.createElement("span", {
        className: "lyra-table__primary"
      }, "Tema custom builder"),
      community: /*#__PURE__*/React.createElement(Icon, {
        name: "minus",
        size: 18,
        color: "var(--text-faint)",
        title: "N\xE3o inclu\xEDdo"
      }),
      pro: /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 18,
        color: "var(--success)",
        title: "Inclu\xEDdo"
      })
    }, {
      id: 4,
      feat: /*#__PURE__*/React.createElement("span", {
        className: "lyra-table__primary"
      }, "Kit Figma sincronizado"),
      community: /*#__PURE__*/React.createElement(Icon, {
        name: "minus",
        size: 18,
        color: "var(--text-faint)",
        title: "N\xE3o inclu\xEDdo"
      }),
      pro: /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 18,
        color: "var(--success)",
        title: "Inclu\xEDdo"
      })
    }, {
      id: 5,
      feat: /*#__PURE__*/React.createElement("span", {
        className: "lyra-table__primary"
      }, "Suporte"),
      community: /*#__PURE__*/React.createElement("span", {
        style: {
          color: "var(--text-muted)",
          fontSize: "var(--text-sm)"
        }
      }, "Comunidade"),
      pro: /*#__PURE__*/React.createElement("span", {
        style: {
          color: "var(--text-muted)",
          fontSize: "var(--text-sm)"
        }
      }, "Priorit\xE1rio \xB7 24h")
    }]
  })), /*#__PURE__*/React.createElement(Dialog, {
    open: checkout,
    onClose: () => setCheckout(false),
    title: "Assinar o Lyra Pro",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => setCheckout(false)
    }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "lock",
        size: 16
      }),
      onClick: () => setCheckout(false)
    }, "Pagar R$ ", annual ? "468/ano" : "49"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "E-mail de cobran\xE7a",
    type: "email",
    placeholder: "financeiro@empresa.dev"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Cart\xE3o",
    placeholder: "0000 0000 0000 0000",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "credit-card",
      size: 16
    })
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: "accent",
    dot: true
  }, "Plano Pro \xB7 ", annual ? "anual (−20%)" : "mensal", " \xB7 cancele quando quiser")))));
}
function Testimonials() {
  const quotes = [{
    name: "Caio Melo",
    role: "Eng. front-end · fintech",
    text: "Migramos três produtos em duas semanas. O modo escuro veio de graça."
  }, {
    name: "Duda Reis",
    role: "Design lead · healthtech",
    text: "O mesmo CSS no Laravel e no React acabou com a deriva visual entre os times."
  }, {
    name: "Léo Lima",
    role: "Fundador · devtools",
    text: "Lancei o MVP num fim de semana usando só o Community. Assinei o Pro no mês seguinte."
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "lw-section lw-section--alt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-center-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lw-overline"
  }, "Comunidade"), /*#__PURE__*/React.createElement("h2", {
    className: "lw-h2"
  }, "Quem usa, recomenda")), /*#__PURE__*/React.createElement("div", {
    className: "lw-quotes"
  }, quotes.map(q => /*#__PURE__*/React.createElement(Card, {
    key: q.name,
    padded: true
  }, /*#__PURE__*/React.createElement("figure", {
    className: "lw-quote-card"
  }, /*#__PURE__*/React.createElement("blockquote", null, "\"", q.text, "\""), /*#__PURE__*/React.createElement("figcaption", null, /*#__PURE__*/React.createElement(Avatar, {
    name: q.name
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "lw-quote-card__name"
  }, q.name), /*#__PURE__*/React.createElement("span", {
    className: "lw-quote-card__role"
  }, q.role)))))))));
}
function FAQSection() {
  return /*#__PURE__*/React.createElement("section", {
    className: "lw-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-container lw-faq"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "lw-overline"
  }, "FAQ"), /*#__PURE__*/React.createElement("h2", {
    className: "lw-h2"
  }, "Perguntas frequentes"), /*#__PURE__*/React.createElement("p", {
    className: "lw-section__sub"
  }, "N\xE3o achou a sua? Pergunte no Discord \u2014 a comunidade responde r\xE1pido.")), /*#__PURE__*/React.createElement(Accordion, {
    defaultOpen: "mit",
    items: [{
      id: "mit",
      title: "Posso usar comercialmente sem pagar?",
      content: "Sim. Todo o design system — componentes, tokens, temas — é MIT. O plano Pro só adiciona ferramentas de produtividade para times; nada do core fica atrás de paywall."
    }, {
      id: "fw",
      title: "Como funciona o suporte a 4 frameworks?",
      content: "O Lyra é CSS-first: a aparência vive em classes .lyra-* compartilhadas. Cada framework recebe um adapter fino (props → classes), então o visual nunca diverge entre stacks."
    }, {
      id: "theme",
      title: "Dá para customizar o tema?",
      content: "Sim — sobrescreva os tokens semânticos (--accent, --surface-card etc.) num CSS próprio. No Pro, o tema builder gera esse arquivo visualmente e mantém o kit Figma em sincronia."
    }, {
      id: "a11y",
      title: "Os componentes são acessíveis?",
      content: "Contraste AA, foco visível e papéis ARIA fazem parte do padrão de aceitação de cada componente. Issues de acessibilidade têm prioridade máxima no repositório."
    }, {
      id: "cancel",
      title: "Posso cancelar o Pro quando quiser?",
      content: "Sim, o cancelamento é imediato e você mantém acesso até o fim do ciclo pago. Seus projetos continuam funcionando — o core é open source."
    }]
  })));
}
function CTASection({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "lw-cta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-container lw-cta__inner"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/lyra-mark-light.svg",
    alt: "",
    className: "lw-cta__mark"
  }), /*#__PURE__*/React.createElement("h2", {
    className: "lw-cta__title"
  }, "Comece pelo Community.", /*#__PURE__*/React.createElement("br", null), "Fique pelo que ele te poupa."), /*#__PURE__*/React.createElement("div", {
    className: "lw-hero__cta"
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 18
    }),
    onClick: () => onNavigate("docs")
  }, "Ler a documenta\xE7\xE3o"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "secondary",
    className: "lw-cta__ghost",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "github",
      size: 18
    })
  }, "Star no GitHub"))));
}
Object.assign(window, {
  PricingSection,
  Testimonials,
  FAQSection,
  CTASection
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/sections-marketing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/sections.jsx
try { (() => {
/* Lyra Website UI kit — seções da landing/docs */
const {
  Button,
  Badge,
  Icon,
  Card,
  Tabs,
  Tag,
  Input
} = window.LyraDesignSystem_e82d95;
function SiteHeader({
  page,
  onNavigate,
  dark,
  onToggleTheme
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "lw-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-container lw-header__inner"
  }, /*#__PURE__*/React.createElement("button", {
    className: "lw-brand",
    onClick: () => onNavigate("home")
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/lyra-mark.svg",
    alt: "",
    className: "lw-mark ld-mark-light"
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/lyra-mark-light.svg",
    alt: "",
    className: "lw-mark ld-mark-dark"
  }), /*#__PURE__*/React.createElement("span", {
    className: "lw-brand__word"
  }, "Lyra")), /*#__PURE__*/React.createElement("nav", {
    className: "lw-nav"
  }, /*#__PURE__*/React.createElement("button", {
    className: ["lw-nav__link", page === "docs" && "lw-nav__link--active"].filter(Boolean).join(" "),
    onClick: () => onNavigate("docs")
  }, "Documenta\xE7\xE3o"), /*#__PURE__*/React.createElement("a", {
    className: "lw-nav__link",
    href: "#componentes"
  }, "Componentes"), /*#__PURE__*/React.createElement("a", {
    className: "lw-nav__link",
    href: "#precos"
  }, "Pre\xE7os")), /*#__PURE__*/React.createElement("div", {
    className: "lw-header__actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "lw-nav__link",
    onClick: onToggleTheme,
    "aria-label": "Alternar tema"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: dark ? "sun" : "moon",
    size: 18
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "github",
      size: 16
    })
  }, "GitHub"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => onNavigate("docs")
  }, "Come\xE7ar"))));
}
function Hero({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "lw-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-container lw-hero__inner"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "accent",
    dot: true
  }, "v1.0 \xB7 open source"), /*#__PURE__*/React.createElement("h1", {
    className: "lw-hero__title"
  }, "Componentes que escalam", /*#__PURE__*/React.createElement("br", null), "do prot\xF3tipo \xE0 produ\xE7\xE3o"), /*#__PURE__*/React.createElement("p", {
    className: "lw-hero__sub"
  }, "Lyra \xE9 um design system open source com tokens, temas claro e escuro e componentes acess\xEDveis para React, Vue, Laravel e Phoenix LiveView."), /*#__PURE__*/React.createElement("div", {
    className: "lw-hero__cta"
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 18
    }),
    onClick: () => onNavigate("docs")
  }, "Come\xE7ar agora"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "secondary",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "terminal",
      size: 18
    })
  }, "npm i @lyra-ds/react")), /*#__PURE__*/React.createElement("div", {
    className: "lw-hero__meta"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "star",
    size: 14
  }), " 3.842 estrelas"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 14
  }), " 48 mil/m\xEAs"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "scale",
    size: 14
  }), " MIT"))));
}
function Frameworks() {
  const fw = [{
    name: "React",
    pkg: "@lyra-ds/react",
    status: /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, "Est\xE1vel")
  }, {
    name: "Vue 3",
    pkg: "@lyra-ds/vue",
    status: /*#__PURE__*/React.createElement(Badge, {
      tone: "warning",
      dot: true
    }, "Beta")
  }, {
    name: "Laravel Blade",
    pkg: "lyra/blade",
    status: /*#__PURE__*/React.createElement(Badge, {
      tone: "warning",
      dot: true
    }, "Beta")
  }, {
    name: "Phoenix LiveView",
    pkg: "lyra_liveview",
    status: /*#__PURE__*/React.createElement(Badge, {
      tone: "info",
      dot: true
    }, "Em dev")
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "lw-section",
    id: "frameworks"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-container"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lw-overline"
  }, "Um sistema, quatro stacks"), /*#__PURE__*/React.createElement("h2", {
    className: "lw-h2"
  }, "CSS-first, adapters finos"), /*#__PURE__*/React.createElement("p", {
    className: "lw-section__sub"
  }, "Toda a apar\xEAncia vive em classes ", /*#__PURE__*/React.createElement("code", null, ".lyra-*"), ". Cada framework recebe s\xF3 um wrapper leve por cima."), /*#__PURE__*/React.createElement("div", {
    className: "lw-fw-grid"
  }, fw.map(f => /*#__PURE__*/React.createElement(Card, {
    key: f.name,
    interactive: true,
    padded: true
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-fw"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-fw__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lw-fw__name"
  }, f.name), f.status), /*#__PURE__*/React.createElement("code", {
    className: "lw-fw__pkg"
  }, f.pkg)))))));
}
function ComponentShowcase() {
  const [tab, setTab] = React.useState("preview");
  return /*#__PURE__*/React.createElement("section", {
    className: "lw-section lw-section--alt",
    id: "componentes"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-container"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lw-overline"
  }, "Componentes"), /*#__PURE__*/React.createElement("h2", {
    className: "lw-h2"
  }, "Acess\xEDveis por padr\xE3o"), /*#__PURE__*/React.createElement("p", {
    className: "lw-section__sub"
  }, "Foco vis\xEDvel, contraste AA e estados completos \u2014 sem esfor\xE7o extra do seu lado."), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-show__tabs"
  }, /*#__PURE__*/React.createElement(Tabs, {
    active: tab,
    onChange: setTab,
    items: [{
      id: "preview",
      label: "Preview"
    }, {
      id: "code",
      label: "Código"
    }]
  })), tab === "preview" ? /*#__PURE__*/React.createElement("div", {
    className: "lw-show__stage"
  }, /*#__PURE__*/React.createElement(Button, null, "Criar projeto"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, "Cancelar"), /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Ativo"), /*#__PURE__*/React.createElement(Tag, null, "design-tokens"), /*#__PURE__*/React.createElement(Input, {
    placeholder: "voce@exemplo.dev",
    size: "sm",
    style: {
      maxWidth: 220
    }
  })) : /*#__PURE__*/React.createElement("pre", {
    className: "lw-show__code"
  }, `import { Button, Badge } from "@lyra-ds/react";

<Button>Criar projeto</Button>
<Badge tone="success" dot>Ativo</Badge>`))));
}
function SiteFooter() {
  return /*#__PURE__*/React.createElement("footer", {
    className: "lw-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-container lw-footer__inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lw-brand",
    style: {
      cursor: "default"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/lyra-mark.svg",
    alt: "",
    className: "lw-mark ld-mark-light"
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/lyra-mark-light.svg",
    alt: "",
    className: "lw-mark ld-mark-dark"
  }), /*#__PURE__*/React.createElement("span", {
    className: "lw-brand__word"
  }, "Lyra")), /*#__PURE__*/React.createElement("span", {
    className: "lw-footer__note"
  }, "Open source sob licen\xE7a MIT. Feito pela comunidade, para a comunidade."), /*#__PURE__*/React.createElement("div", {
    className: "lw-footer__links"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "GitHub"), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Discord"), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "npm"))));
}
Object.assign(window, {
  SiteHeader,
  Hero,
  Frameworks,
  ComponentShowcase,
  SiteFooter
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/sections.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.Accordion = __ds_scope.Accordion;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.AvatarGroup = __ds_scope.AvatarGroup;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.CookieBanner = __ds_scope.CookieBanner;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Drawer = __ds_scope.Drawer;

__ds_ns.Progress = __ds_scope.Progress;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.ToastStack = __ds_scope.ToastStack;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.FileManager = __ds_scope.FileManager;

__ds_ns.FileUpload = __ds_scope.FileUpload;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Combobox = __ds_scope.Combobox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.CommandPalette = __ds_scope.CommandPalette;

__ds_ns.CreateWorkspaceDialog = __ds_scope.CreateWorkspaceDialog;

__ds_ns.Dropdown = __ds_scope.Dropdown;

__ds_ns.Pagination = __ds_scope.Pagination;

__ds_ns.SidebarGroup = __ds_scope.SidebarGroup;

__ds_ns.Stepper = __ds_scope.Stepper;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.WorkspaceSwitcher = __ds_scope.WorkspaceSwitcher;

})();
