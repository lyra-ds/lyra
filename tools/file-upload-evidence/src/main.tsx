import { createRoot } from 'react-dom/client';
import {
  bootstrapAlpine,
  parseAlpineDelay,
  reconnectAlpineFixture,
  teardownAlpineFixture,
} from './alpine-bootstrap';
import { deploymentUrlFromLocation, type Locale } from './contracts';
import { HarnessApp } from './harness-app';

declare global {
  interface Window {
    __LYRA_FILE_UPLOAD_EVIDENCE__?: {
      reconnectAlpineFixture(root: HTMLElement): Promise<void>;
      teardownAlpineFixture(root: HTMLElement): Promise<void>;
    };
  }
}

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

// vite.config.ts refuses to create this private bundle unless FILE_UPLOAD_EVIDENCE=1.
window.__LYRA_FILE_UPLOAD_EVIDENCE__ = {
  reconnectAlpineFixture,
  teardownAlpineFixture,
};

createRoot(root).render(
  <HarnessApp
    locale={routeLocale()}
    revision={requiredText('header code')}
    buildTime={requiredText('header time')}
    deploymentUrl={deploymentUrlFromLocation(window.location)}
    alpineDelayMilliseconds={parseAlpineDelay(window.location.search)}
  />,
);
