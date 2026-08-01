/** A highlighter-agnostic code panel for already-highlighted markup. */
export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional language badge shown in the code panel bar. */
  language?: string;
  /** Draw line numbers beside descendants whose class list includes `line`. */
  lineNumbers?: boolean;
  /** Translated visible label for the copy button. Omit with `copiedLabel` to hide copying. */
  copyLabel?: React.ReactNode;
  /** Translated visible label and polite announcement shown after a successful copy. */
  copiedLabel?: React.ReactNode;
  /** Text copied instead of the rendered text content of this code block's `<pre>`. */
  copyText?: string;
}
export declare function CodeBlock(props: CodeBlockProps): JSX.Element;
