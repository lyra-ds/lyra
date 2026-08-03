# ToastProvider / useToast

Toast e ToastStack eram só apresentacionais — cada app reimplementava fila, timeout e remoção. O provider centraliza isso: `useToast()` devolve `toast/success/error/info/dismiss`, auto-dismiss configurável, ícone padrão por tom (substituível). No bundle do preview o hook também está em `ToastProvider.useToast`.
