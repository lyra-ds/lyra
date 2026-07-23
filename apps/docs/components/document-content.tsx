import type { ComponentType } from 'react';
import EnDialog from '@/content/docs/en/components/dialog.mdx';
import EnIndex from '@/content/docs/en/index.mdx';
import PtBrDialog from '@/content/docs/pt-BR/components/dialog.mdx';
import PtBrIndex from '@/content/docs/pt-BR/index.mdx';
import type { Locale } from '@/lib/i18n';
import { CodeBlock } from './code-block';
import { DialogPreview } from './dialog-preview';
import { PropTable } from './prop-table';

type PageKind = 'dialog' | 'index';

const content: Record<
  Locale,
  Record<PageKind, ComponentType<{ components?: Record<string, ComponentType<any>> }>>
> = {
  en: { dialog: EnDialog, index: EnIndex },
  'pt-BR': { dialog: PtBrDialog, index: PtBrIndex },
};

export function DocumentContent({ locale, page }: { locale: Locale; page: PageKind }) {
  const Content = content[locale][page];

  return <Content components={{ CodeBlock, DialogPreview, PropTable }} />;
}
