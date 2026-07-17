Banner fixo de consentimento de cookies conforme LGPD; gerencia a própria visibilidade e persiste a escolha em localStorage.

```jsx
<CookieBanner
  policyHref="/privacidade"
  onAccept={() => enableAnalytics()}
/>
```

- A escolha ("all" / "essentials") fica em `localStorage[storageKey]` — o banner não reaparece.
- `children` substitui o texto padrão se o produto precisar de outra redação jurídica.
