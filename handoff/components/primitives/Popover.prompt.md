# Popover / Portal

Unifica o posicionamento/outside-click que Dropdown, Combobox e WorkspaceSwitcher implementavam cada um do seu jeito — novos overlays (DatePicker, filtros) compõem este primitivo. Ancorado ao wrapper relativo (sem medição JS): `side` + `align` viram classes, e o painel usa a mesma superfície raised/shadow-lg dos menus. Controlado ou não via `open`/`onOpenChange`.
