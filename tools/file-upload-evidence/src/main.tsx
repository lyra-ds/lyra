import { createRoot } from 'react-dom/client';
import { bootstrapAlpine, parseAlpineDelay } from './alpine-bootstrap';
import type { Locale } from './contracts';
import { HarnessApp } from './harness-app';

function routeLocale(): Locale {
  const language = document.documentElement.lang;
  if (language === 'en' || language === 'pt-BR') return language;
  throw new Error(`Unsupported evidence route locale: ${language}`);
}

function requiredText(selector: string): string {
  const element = document.querySelector(selector);
  const value = element?.textContent?.trim();
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing authored evidence metadata: ${selector}`);
  }
  return value;
}

const root = document.querySelector<HTMLElement>('#react-evidence-root');
if (root === null) throw new Error('Missing the React evidence root.');

const alpineRoot = document.querySelector<HTMLElement>('#alpine-evidence-root');
if (alpineRoot !== null) void bootstrapAlpine(alpineRoot);

createRoot(root).render(
  <HarnessApp
    locale={routeLocale()}
    revision={requiredText('header code')}
    buildTime={requiredText('header time')}
    deploymentUrl={window.location.href}
    alpineDelayMilliseconds={parseAlpineDelay(window.location.search)}
  />,
);
