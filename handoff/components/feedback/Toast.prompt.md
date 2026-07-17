Notificação transitória para confirmar eventos (salvou, copiou, erro de rede); empilha no canto inferior direito via ToastStack.

```jsx
<ToastStack>
  <Toast tone="success" icon={<Icon name="circle-check" size={18} />} onClose={dismiss}>
    Projeto criado com sucesso.
  </Toast>
</ToastStack>
```
