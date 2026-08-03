# ThemeProvider / useTheme

Formaliza o que todo app fazia à mão: `data-theme` no `<html>` + persistência em localStorage, exposto como `{ theme, dark, setTheme, toggle }`. `brand` fixa `data-brand` para white-label. No bundle do preview o hook também está acessível como `ThemeProvider.useTheme` (só exports capitalizados vão para o namespace global).
