/**
 * Seletor de fuso horário sobre o Combobox — busca por cidade/país/sigla
 * nos dois idiomas, grupos por região + "Detectado"/"Recentes" no topo,
 * offset GMT±X calculado na data de referência (horário de verão correto)
 * e hora atual ao vivo em cada opção. Valores sempre IANA.
 */
export interface TimeZoneOption {
  /** IANA, ex. "America/Sao_Paulo" */
  value: string;
  label: string;
  region: string;
  /** Termos extras de busca (siglas, cidades cobertas) */
  keywords?: string;
}
export interface TimeZonePickerProps {
  /** IANA (ex. "America/Sao_Paulo") — modo controlado */
  value?: string;
  defaultValue?: string;
  onChange?: (zone: string) => void;
  /** Data usada para calcular o GMT±X exibido (ex.: data da sessão). Padrão: agora */
  referenceDate?: string | Date;
  /** Zonas fixadas no topo, grupo "Recentes" */
  recentZones?: string[];
  /** Zona fixada no topo, grupo "Detectado" */
  detectedZone?: string;
  /** Sobrepõe a lista curada padrão (TimeZonePicker.ZONES) */
  zones?: TimeZoneOption[];
  /** Locale da hora ao vivo. Padrão "pt-BR" */
  locale?: string;
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}
export declare function TimeZonePicker(props: TimeZonePickerProps): JSX.Element;
