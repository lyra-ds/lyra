---
'@lyra-ds/alpine': minor
---

Exporta as interfaces de opções dos bindings das ondas iniciais (`LyraDropdownOptions`, `LyraDialogOptions`, `LyraCalendarOptions`, `LyraTimePickerLabels`, `LyraThemeStore`, …) no entry do pacote. As dos bindings mais novos já saíam; estas 29 existiam só no fonte, então o consumidor não conseguia tipar o objeto passado em `x-data` e a documentação não tinha de onde ler o contrato. Nenhuma mudança de runtime — o bundle segue idêntico.
