import React from "react";
import { Toast, ToastStack } from "../feedback/Toast.jsx";
import { Icon } from "../icons/Icon.jsx";

export const ToastContext = React.createContext(null);
let toastSeq = 0;
const TONE_ICON = { success: "circle-check", danger: "circle-alert", info: "info" };

/**
 * Provider de toasts — renderiza a ToastStack e expõe a API imperativa
 * via useToast(): toast(msg), success(msg), error(msg), info(msg).
 */
export function ToastProvider({ duration = 4000, children }) {
  const [toasts, setToasts] = React.useState([]);
  const dismiss = React.useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = React.useCallback((msg, opts = {}) => {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, msg, tone: opts.tone || "info", icon: opts.icon }]);
    const ms = opts.duration != null ? opts.duration : duration;
    if (ms > 0) setTimeout(() => dismiss(id), ms);
    return id;
  }, [duration, dismiss]);
  const api = React.useMemo(() => ({
    toast: push,
    success: (m, o) => push(m, { ...o, tone: "success" }),
    error: (m, o) => push(m, { ...o, tone: "danger" }),
    info: (m, o) => push(m, { ...o, tone: "info" }),
    dismiss,
  }), [push, dismiss]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastStack>
        {toasts.map((t) => (
          <Toast key={t.id} tone={t.tone} icon={t.icon !== undefined ? t.icon : <Icon name={TONE_ICON[t.tone]} size={17} />} onClose={() => dismiss(t.id)}>
            {t.msg}
          </Toast>
        ))}
      </ToastStack>
    </ToastContext.Provider>
  );
}

/**
 * Hook de toasts — { toast, success, error, info, dismiss }. Requer <ToastProvider>.
 */
export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast requer <ToastProvider>");
  return ctx;
}
ToastProvider.useToast = useToast;
