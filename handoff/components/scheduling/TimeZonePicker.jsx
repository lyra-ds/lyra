import React from "react";
import { Combobox } from "../forms/Combobox.jsx";

const ZONES = [
  { value: "America/Sao_Paulo", label: "São Paulo / Brasília", region: "América", keywords: "brasil brt horario de brasilia" },
  { value: "America/Manaus", label: "Manaus", region: "América", keywords: "brasil amazonas amt" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires", region: "América", keywords: "argentina art" },
  { value: "America/Santiago", label: "Santiago", region: "América", keywords: "chile clt" },
  { value: "America/Bogota", label: "Bogotá", region: "América", keywords: "colombia cot" },
  { value: "America/Lima", label: "Lima", region: "América", keywords: "peru pet" },
  { value: "America/Mexico_City", label: "Cidade do México", region: "América", keywords: "mexico cst" },
  { value: "America/New_York", label: "Nova York", region: "América", keywords: "eua usa est edt eastern toronto miami" },
  { value: "America/Chicago", label: "Chicago", region: "América", keywords: "eua usa cst central texas" },
  { value: "America/Denver", label: "Denver", region: "América", keywords: "eua usa mst mountain" },
  { value: "America/Los_Angeles", label: "Los Angeles", region: "América", keywords: "eua usa pst pacific san francisco seattle" },
  { value: "Europe/Lisbon", label: "Lisboa", region: "Europa", keywords: "portugal wet" },
  { value: "Europe/London", label: "Londres", region: "Europa", keywords: "reino unido uk gmt bst" },
  { value: "Europe/Madrid", label: "Madri", region: "Europa", keywords: "espanha cet" },
  { value: "Europe/Paris", label: "Paris", region: "Europa", keywords: "franca cet" },
  { value: "Europe/Berlin", label: "Berlim", region: "Europa", keywords: "alemanha cet amsterdam roma" },
  { value: "Africa/Cairo", label: "Cairo", region: "África", keywords: "egito eet" },
  { value: "Africa/Lagos", label: "Lagos", region: "África", keywords: "nigeria wat" },
  { value: "Africa/Johannesburg", label: "Joanesburgo", region: "África", keywords: "africa do sul sast" },
  { value: "Asia/Dubai", label: "Dubai", region: "Ásia", keywords: "emirados gst" },
  { value: "Asia/Kolkata", label: "Mumbai / Nova Déli", region: "Ásia", keywords: "india ist" },
  { value: "Asia/Singapore", label: "Singapura", region: "Ásia", keywords: "sgt kuala lumpur" },
  { value: "Asia/Shanghai", label: "Pequim / Xangai", region: "Ásia", keywords: "china cst hong kong" },
  { value: "Asia/Tokyo", label: "Tóquio", region: "Ásia", keywords: "japao jst" },
  { value: "Asia/Seoul", label: "Seul", region: "Ásia", keywords: "coreia kst" },
  { value: "Australia/Sydney", label: "Sydney", region: "Oceania", keywords: "australia aest melbourne" },
  { value: "Pacific/Auckland", label: "Auckland", region: "Oceania", keywords: "nova zelandia nzst" },
];

const gmt = (tz, date) => {
  try {
    const parts = new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(date);
    const name = (parts.find((p) => p.type === "timeZoneName") || {}).value || "";
    return name.replace("UTC", "GMT") || "GMT";
  } catch (e) { return ""; }
};
const nowIn = (tz, locale) => {
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date());
  } catch (e) { return ""; }
};

/**
 * Seletor de fuso horário — Combobox com busca (cidade, país, sigla),
 * grupos por região, offset GMT±X (calculado na data da sessão) e hora
 * atual ao vivo em cada opção. Valores sempre IANA, nunca offset fixo.
 */
export function TimeZonePicker({ value, defaultValue, onChange, referenceDate, recentZones = [], detectedZone, zones, locale = "pt-BR", label, hint, error, placeholder = "Selecionar fuso horário", disabled, className = "", ...rest }) {
  const [, tick] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => { const t = setInterval(tick, 60000); return () => clearInterval(t); }, []);
  const refDate = referenceDate ? new Date(String(referenceDate).length <= 10 ? referenceDate + "T12:00:00" : referenceDate) : new Date();
  const base = zones || ZONES;
  const decorate = (z, group) => ({
    value: z.value,
    label: `${z.label} (${gmt(z.value, refDate)})`,
    keywords: `${z.keywords || ""} ${z.value.replace(/[_/]/g, " ")} ${gmt(z.value, refDate).toLowerCase()}`,
    group,
    trailing: nowIn(z.value, locale),
  });
  const find = (v) => base.find((z) => z.value === v) || { value: v, label: v.split("/").pop().replace(/_/g, " "), keywords: "" };
  const top = [];
  if (detectedZone) top.push({ ...find(detectedZone), _g: "Detectado" });
  recentZones.filter((v) => v !== detectedZone).forEach((v) => top.push({ ...find(v), _g: "Recentes" }));
  const topValues = top.map((z) => z.value);
  const options = [
    ...top.map((z) => decorate(z, z._g)),
    ...base.filter((z) => !topValues.includes(z.value)).map((z) => decorate(z, z.region)),
  ];
  return (
    <Combobox
      className={["lyra-tzpicker", className].filter(Boolean).join(" ")}
      label={label}
      hint={hint}
      error={error}
      options={options}
      value={value}
      defaultValue={defaultValue}
      onChange={(v, opt) => onChange && onChange(v, opt)}
      placeholder={placeholder}
      searchPlaceholder="Buscar cidade, país ou sigla…"
      emptyMessage="Nenhum fuso encontrado."
      disabled={disabled}
      {...rest}
    />
  );
}

TimeZonePicker.ZONES = ZONES;
