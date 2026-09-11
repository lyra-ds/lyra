#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { arch, platform, release, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installPackedArtifacts, runCommand } from '../react-compat/file-upload.mjs';

const TOOL_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY = resolve(TOOL_DIRECTORY, '..', '..');
const REACT_19_FIXTURE = join(REPOSITORY, 'tools', 'react-compat', 'fixtures', 'react19');
const FIXTURE_SOURCE = join(TOOL_DIRECTORY, 'fixtures', 'dialog.tsx');
const PROFILES = Object.freeze([
  'axe-light',
  'axe-dark',
  'forced-colors',
  'reduced-motion',
  'ltr',
  'rtl',
]);
const ENGINES = Object.freeze(['chromium', 'firefox', 'webkit']);
const REQUIRE = createRequire(import.meta.url);

function usage() {
  return [
    'Usage: node tools/v1-profiles/dialog.mjs --react-tarball PATH --styles-tarball PATH --output PATH [--browser chromium|firefox|webkit]',
    '',
    'Runs the React 19 packed Dialog six-profile slice. The output path must not exist.',
  ].join('\n');
}

function parseArguments(argumentsList) {
  const values = {};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--help') return { help: true };
    if (!['--react-tarball', '--styles-tarball', '--output', '--browser'].includes(argument)) {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const value = argumentsList[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value`);
    if (values[argument]) throw new Error(`${argument} may be supplied only once`);
    values[argument] = value;
    index += 1;
  }
  for (const required of ['--react-tarball', '--styles-tarball', '--output']) {
    if (!values[required]) throw new Error(`Missing required ${required}`);
  }
  if (values['--browser'] && !ENGINES.includes(values['--browser'])) {
    throw new Error('--browser must be chromium, firefox, or webkit');
  }
  return {
    reactTarball: resolve(values['--react-tarball']),
    stylesTarball: resolve(values['--styles-tarball']),
    output: resolve(values['--output']),
    engines: values['--browser'] ? [values['--browser']] : [...ENGINES],
  };
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function sourceFileHashes() {
  return Object.fromEntries(
    [join(TOOL_DIRECTORY, 'dialog.mjs'), FIXTURE_SOURCE].map((path) => [
      path.slice(REPOSITORY.length + 1),
      sha256(path),
    ]),
  );
}

function json(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function commandOutput(command, args, cwd = REPOSITORY) {
  return runCommand(command, args, { cwd }).stdout.trim();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function copyConsumerFixture(destination) {
  mkdirSync(destination, { recursive: true });
  for (const name of ['package.json', 'pnpm-lock.yaml']) {
    cpSync(join(REACT_19_FIXTURE, name), join(destination, name));
  }
  mkdirSync(join(destination, 'src'), { recursive: true });
  cpSync(FIXTURE_SOURCE, join(destination, 'src', 'dialog.tsx'));
  writeFileSync(join(destination, 'src', 'main.tsx'), "import './dialog';\n");
  writeFileSync(
    join(destination, 'index.html'),
    '<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Lyra packed Dialog profiles</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n',
  );
}

function validatePackedPackage(tarball, expectedName) {
  assert(existsSync(tarball), `Tarball does not exist: ${tarball}`);
  const listing = commandOutput('tar', ['-xOzf', tarball, 'package/package.json']);
  const manifest = JSON.parse(listing);
  assert(
    manifest.name === expectedName,
    `${tarball} contains ${manifest.name}, expected ${expectedName}`,
  );
  return manifest;
}

function prepareConsumer({ consumer, store, reactTarball, stylesTarball }) {
  const fixtureLock = join(REACT_19_FIXTURE, 'pnpm-lock.yaml');
  const originalLock = readFileSync(fixtureLock);
  copyConsumerFixture(consumer);
  runCommand('pnpm', ['install', '--frozen-lockfile', '--store-dir', store, '--ignore-workspace'], {
    cwd: consumer,
  });
  assert(
    readFileSync(join(consumer, 'pnpm-lock.yaml')).equals(originalLock),
    'React 19 fixture lockfile changed during frozen installation',
  );
  assert(
    json(join(consumer, 'node_modules', 'react', 'package.json')).version === '19.2.8',
    'Installed React is not 19.2.8',
  );
  installPackedArtifacts(consumer, { react: reactTarball, styles: stylesTarball });
  const reactManifest = json(join(consumer, 'node_modules', '@lyra-ds', 'react', 'package.json'));
  const stylesManifest = json(join(consumer, 'node_modules', '@lyra-ds', 'styles', 'package.json'));
  assert(
    reactManifest.name === '@lyra-ds/react',
    'Installed packed React package identity is wrong',
  );
  assert(
    stylesManifest.name === '@lyra-ds/styles',
    'Installed packed Styles package identity is wrong',
  );
  assert(
    Object.hasOwn(reactManifest.exports, './dialog'),
    'Packed React artifact does not export ./dialog',
  );
  assert(
    existsSync(join(consumer, 'node_modules', '@lyra-ds', 'styles', 'styles.css')),
    'Packed Styles artifact has no styles.css',
  );
  assert(
    readFileSync(join(consumer, 'pnpm-lock.yaml')).equals(originalLock),
    'React 19 fixture lockfile changed after tarball extraction',
  );
  assert(
    readFileSync(fixtureLock).equals(originalLock),
    'Source React 19 fixture lockfile changed during the run',
  );
  return {
    fixtureReact: '19.2.8',
    packedReact: reactManifest.version,
    packedStyles: stylesManifest.version,
    fixtureLockSha256: createHash('sha256').update(originalLock).digest('hex'),
  };
}

function consumerViteBinary(consumer) {
  const vite = join(consumer, 'node_modules', 'vite', 'bin', 'vite.js');
  assert(existsSync(vite), 'Pinned fixture Vite binary is missing');
  assert(
    json(join(consumer, 'node_modules', 'vite', 'package.json')).version === '8.2.1',
    'Consumer Vite is not 8.2.1',
  );
  return vite;
}

function buildConsumer(consumer, vite) {
  runCommand(process.execPath, [vite, 'build'], { cwd: consumer });
  assert(
    existsSync(join(consumer, 'dist', 'index.html')),
    'Vite production build did not emit index.html',
  );
}

function startPreview(consumer, vite) {
  const child = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', '0'], {
    cwd: consumer,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  const address = new Promise((resolveAddress, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Vite preview did not start:\n${output}`)),
      15_000,
    );
    const receive = (chunk) => {
      output += chunk.toString();
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolveAddress(`http://127.0.0.1:${match[1]}`);
      }
    };
    child.stdout.on('data', receive);
    child.stderr.on('data', receive);
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Vite preview exited ${code}:\n${output}`));
    });
  });
  return { child, address };
}

async function stopPreview(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return { status: 'already-exited', exitCode: child.exitCode, signalCode: child.signalCode };
  }
  const exited = new Promise((resolveExit) => {
    child.once('exit', (exitCode, signalCode) => resolveExit({ exitCode, signalCode }));
  });
  async function boundedExit() {
    let timer;
    try {
      return await Promise.race([
        exited,
        new Promise((resolveTimeout) => {
          timer = setTimeout(() => resolveTimeout(null), 2000);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  assert(child.kill('SIGTERM'), 'Vite preview did not accept SIGTERM');
  const terminated = await boundedExit();
  if (terminated) return { status: 'terminated', ...terminated };
  child.kill('SIGKILL');
  const killed = await boundedExit();
  throw new Error(
    killed
      ? 'Vite preview ignored SIGTERM for 2000ms and required SIGKILL'
      : 'Vite preview did not exit after SIGTERM and SIGKILL deadlines',
  );
}

async function waitForDialogEntrance(page) {
  return page.locator('.lyra-dialog-overlay').evaluate(async (overlay) => {
    const panel = overlay.querySelector('.lyra-dialog');
    const close = panel?.querySelector('.lyra-dialog__close');
    if (!(panel instanceof HTMLElement) || !(close instanceof HTMLElement)) {
      throw new Error('Dialog entrance did not expose its owned panel and close control');
    }
    const closeSize = () => {
      const rect = close.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    };
    const animations = [overlay, panel]
      .flatMap((element) =>
        element.getAnimations({ subtree: false }).map((animation) => ({ element, animation })),
      )
      .filter(({ animation }) => {
        const timing = animation.effect?.getComputedTiming();
        return Number.isFinite(timing?.activeDuration) && timing.activeDuration > 0;
      });
    const before = closeSize();
    const observedAnimations = animations.map(({ element, animation }) => ({
      target: element.className,
      name: 'animationName' in animation ? animation.animationName : animation.id,
      playState: animation.playState,
      activeDuration: animation.effect?.getComputedTiming().activeDuration,
    }));
    await Promise.all(animations.map(({ animation }) => animation.finished));
    return { animations: observedAnimations, close: { before, after: closeSize() } };
  });
}

async function openDialog(page, { waitForEntrance = true } = {}) {
  await page.getByRole('button', { name: 'Open preferences' }).click();
  await page
    .getByRole('dialog', { name: 'Edit notification preferences' })
    .waitFor({ state: 'visible' });
  return waitForEntrance ? waitForDialogEntrance(page) : undefined;
}

async function expectClosedAndRestored(page) {
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await page.getByRole('button', { name: 'Open preferences' }).evaluate((element) => {
    if (document.activeElement !== element) throw new Error('Focus did not return to the opener');
  });
}

async function pageMeasurements(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('.lyra-dialog');
    const overlay = document.querySelector('.lyra-dialog-overlay');
    const close = document.querySelector('.lyra-dialog__close');
    const title = document.querySelector('.lyra-dialog__title');
    const body = document.querySelector('.lyra-dialog__body');
    const disabled = document.querySelector('button:disabled');
    const enabled = document.getElementById('send-test-notification');
    if (!(
      panel instanceof HTMLElement &&
      overlay instanceof HTMLElement &&
      close instanceof HTMLElement &&
      title instanceof HTMLElement &&
      body instanceof HTMLElement &&
      disabled instanceof HTMLButtonElement &&
      enabled instanceof HTMLButtonElement &&
      !enabled.disabled
    )) {
      throw new Error('Dialog fixture did not render its required elements');
    }
    const panelStyle = getComputedStyle(panel);
    const closeStyle = getComputedStyle(close);
    const disabledStyle = getComputedStyle(disabled);
    const enabledStyle = getComputedStyle(enabled);
    const closeRect = close.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    return {
      direction: panelStyle.direction,
      panel: {
        display: panelStyle.display,
        borderStyle: panelStyle.borderStyle,
        borderWidth: panelStyle.borderWidth,
        borderColor: panelStyle.borderColor,
        backgroundColor: panelStyle.backgroundColor,
        color: panelStyle.color,
        animationName: panelStyle.animationName,
        animationDuration: panelStyle.animationDuration,
      },
      overlay: {
        display: getComputedStyle(overlay).display,
        animationName: getComputedStyle(overlay).animationName,
        animationDuration: getComputedStyle(overlay).animationDuration,
      },
      close: {
        width: closeRect.width,
        height: closeRect.height,
        focus: {
          focusVisible: close.matches(':focus-visible'),
          outlineStyle: closeStyle.outlineStyle,
          outlineWidth: closeStyle.outlineWidth,
          outlineColor: closeStyle.outlineColor,
          outlineOffset: closeStyle.outlineOffset,
          boxShadow: closeStyle.boxShadow,
          backgroundColor: closeStyle.backgroundColor,
          color: closeStyle.color,
          borderColor: closeStyle.borderColor,
          borderWidth: closeStyle.borderWidth,
        },
        x: closeRect.x,
      },
      titleX: titleRect.x,
      body: {
        textAlign: getComputedStyle(body).textAlign,
        color: getComputedStyle(body).color,
        backgroundColor: getComputedStyle(body).backgroundColor,
      },
      disabled: {
        disabled: disabled.disabled,
        color: disabledStyle.color,
        borderStyle: disabledStyle.borderStyle,
        opacity: disabledStyle.opacity,
      },
      enabled: {
        color: enabledStyle.color,
        borderStyle: enabledStyle.borderStyle,
        opacity: enabledStyle.opacity,
      },
      description: document.getElementById('dialog-description')?.textContent,
    };
  });
}

function assertOpenDialog(measurements) {
  assert(
    measurements.panel.display !== 'none' && measurements.overlay.display !== 'none',
    'Dialog panel or overlay is not visible',
  );
  assert(
    parseFloat(measurements.close.width) >= 44 && parseFloat(measurements.close.height) >= 44,
    'Close target is smaller than 44 by 44 CSS pixels',
  );
  assert(
    measurements.description === 'Choose how this workspace sends notifications.',
    'Dialog descriptive content is missing',
  );
}

function assertNoPageFailures({ consoleErrors, pageErrors }, operation) {
  assert(
    consoleErrors.length === 0,
    `${operation} emitted console errors: ${consoleErrors.join('\n')}`,
  );
  assert(pageErrors.length === 0, `${operation} emitted page errors: ${pageErrors.join('\n')}`);
}

function assertForcedColorsSurface(measurements) {
  assert(
    measurements.panel.borderStyle !== 'none' &&
      parseFloat(measurements.panel.borderWidth) > 0 &&
      measurements.panel.borderColor !== measurements.panel.backgroundColor,
    'Forced-colors panel boundary is not perceivable against its background',
  );
  assert(
    measurements.body.color !== measurements.panel.backgroundColor,
    'Forced-colors dialog content is not perceivable against the panel background',
  );
  assert(
    measurements.disabled.disabled &&
      measurements.disabled.opacity !== '0' &&
      (measurements.disabled.color !== measurements.enabled.color ||
        measurements.disabled.opacity !== measurements.enabled.opacity ||
        measurements.disabled.borderStyle !== measurements.enabled.borderStyle),
    'Forced-colors disabled control is not distinguishable from the comparable enabled control',
  );
}

function hasVisibleFocusIndicator(unfocused, focused, panelBackground) {
  const hasOutline =
    focused.outlineStyle !== 'none' &&
    parseFloat(focused.outlineWidth) > 0 &&
    focused.outlineColor !== panelBackground &&
    focused.outlineColor !== 'transparent' &&
    !/rgba\([^)]*,\s*0\)$/.test(focused.outlineColor);
  const hasBoxShadow =
    focused.boxShadow !== 'none' &&
    focused.boxShadow !== unfocused.boxShadow &&
    focused.color !== focused.backgroundColor;
  const hasBorder =
    parseFloat(focused.borderWidth) > 0 &&
    focused.borderColor !== focused.backgroundColor &&
    (focused.borderColor !== unfocused.borderColor ||
      focused.borderWidth !== unfocused.borderWidth);
  const hasBackground =
    focused.backgroundColor !== unfocused.backgroundColor &&
    focused.color !== focused.backgroundColor;
  return hasOutline || hasBoxShadow || hasBorder || hasBackground;
}

async function assertNativeCloseFocus(page, observation) {
  await page.waitForFunction(
    () =>
      document.activeElement instanceof HTMLElement &&
      document.activeElement.matches('.lyra-dialog__close'),
  );
  await page.keyboard.press('Shift+Tab');
  await page.getByRole('button', { name: 'Save changes' }).evaluate((element) => {
    if (document.activeElement !== element)
      throw new Error('Backward boundary navigation did not reach the final action');
  });
  const unfocused = await pageMeasurements(page);
  await page.keyboard.press('Tab');
  const focused = await pageMeasurements(page);
  observation.nativeFocus = { unfocused: unfocused.close.focus, focused: focused.close.focus };
  assert(
    focused.close.focus.focusVisible,
    'Native boundary Tab did not place :focus-visible focus on the Close control',
  );
  await page.getByRole('button', { name: 'Close' }).evaluate((element) => {
    if (document.activeElement !== element)
      throw new Error('Native boundary Tab did not focus Close');
  });
  assert(
    hasVisibleFocusIndicator(
      unfocused.close.focus,
      focused.close.focus,
      focused.panel.backgroundColor,
    ),
    'Forced-colors focus indicator is not perceivable after native keyboard focus',
  );
}

async function assertKeyboardDialog(page) {
  await page.waitForFunction(
    () =>
      document.activeElement instanceof HTMLElement &&
      document.activeElement.matches('.lyra-dialog__close'),
  );
  await page.getByRole('button', { name: 'Close' }).evaluate((element) => {
    if (document.activeElement !== element)
      throw new Error('Dialog did not place initial focus on the close button');
  });
  await page.keyboard.press('Tab');
  await page.getByLabel('Notification email').evaluate((element) => {
    if (document.activeElement !== element)
      throw new Error('Tab did not move to the labelled input');
  });
  await page.keyboard.press('Tab');
  await page.getByLabel('Notification sender').evaluate((element) => {
    if (document.activeElement !== element)
      throw new Error('Tab order skipped the second labelled input');
  });
}

async function runAxe(page) {
  await page.addScriptTag({ path: REQUIRE.resolve('axe-core/axe.min.js') });
  const result = await page.evaluate(async () => {
    const axeResult = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
    });
    return {
      violations: axeResult.violations.map((violation) => ({
        id: violation.id,
        help: violation.help,
        nodes: violation.nodes.length,
      })),
      passes: axeResult.passes.length,
    };
  });
  assert(
    result.violations.length === 0,
    `axe WCAG 2.2 AA violations: ${JSON.stringify(result.violations)}`,
  );
  return result;
}

async function executeProfile(page, profile, screenshotPath, observation, failures) {
  if (profile === 'axe-light' || profile === 'axe-dark') {
    const theme = profile === 'axe-dark' ? 'dark' : 'light';
    observation.theme = theme;
    await page.emulateMedia({ colorScheme: theme });
    await page.evaluate((activeTheme) => {
      document.documentElement.toggleAttribute('data-theme', activeTheme === 'dark');
      if (activeTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    }, theme);
    observation.entrance = await openDialog(page);
    observation.measurements = await pageMeasurements(page);
    await page.evaluate(
      (otherTheme) => {
        document.documentElement.setAttribute('data-theme', otherTheme);
      },
      theme === 'dark' ? 'light' : 'dark',
    );
    observation.oppositeTheme = await pageMeasurements(page);
    await page.evaluate((activeTheme) => {
      if (activeTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    }, theme);
    observation.measurements = await pageMeasurements(page);
    assert(
      observation.measurements.panel.backgroundColor !==
        observation.oppositeTheme.panel.backgroundColor &&
        observation.measurements.body.color !== observation.oppositeTheme.body.color,
      `${theme} theme did not change the actual Dialog surface and content colors`,
    );
    assertOpenDialog(observation.measurements);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    assert(
      (await page.locator('html').getAttribute('data-theme')) ===
        (theme === 'dark' ? 'dark' : null),
      `${theme} theme did not activate`,
    );
    observation.axe = await runAxe(page);
    assertNoPageFailures(failures, `${profile} axe scan`);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expectClosedAndRestored(page);
    observation.committedOutput = await page.locator('output').textContent();
    assert(
      observation.committedOutput === 'Preferences saved',
      'Footer action did not commit visible output',
    );
    assertNoPageFailures(failures, `${profile} close lifecycle`);
    return observation;
  }

  if (profile === 'forced-colors') {
    await page.emulateMedia({ forcedColors: 'active' });
    observation.mediaActive = await page.evaluate(
      () => matchMedia('(forced-colors: active)').matches,
    );
    if (!observation.mediaActive) {
      observation.unavailable = 'This browser does not expose forced-colors: active.';
      return observation;
    }
    observation.entrance = await openDialog(page);
    observation.measurements = await pageMeasurements(page);
    assertOpenDialog(observation.measurements);
    assertForcedColorsSurface(observation.measurements);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await assertNativeCloseFocus(page, observation);
    await page.keyboard.press('Escape');
    await expectClosedAndRestored(page);
    assertNoPageFailures(failures, 'forced-colors close lifecycle');
    return observation;
  }

  if (profile === 'reduced-motion') {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    observation.mediaActive = await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    if (!observation.mediaActive) {
      observation.unavailable = 'This browser does not expose prefers-reduced-motion: reduce.';
      return observation;
    }
    observation.bodyBefore = await page.evaluate(() => ({
      overflow: document.body.style.overflow,
      rootInert: document.getElementById('root')?.inert ?? false,
    }));
    await openDialog(page, { waitForEntrance: false });
    observation.measurements = await pageMeasurements(page);
    assertOpenDialog(observation.measurements);
    assert(
      observation.measurements.panel.animationName === 'none' &&
        observation.measurements.overlay.animationName === 'none',
      'Reduced-motion animations did not collapse',
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    observation.bodyDuring = await page.evaluate(() => ({
      overflow: document.body.style.overflow,
      rootInert: document.getElementById('root')?.inert ?? false,
    }));
    assert(
      observation.bodyDuring.overflow === 'hidden' && observation.bodyDuring.rootInert,
      'Open Dialog did not lock scroll and inert the background',
    );
    await page.keyboard.press('Escape');
    await expectClosedAndRestored(page);
    observation.bodyAfter = await page.evaluate(() => ({
      overflow: document.body.style.overflow,
      rootInert: document.getElementById('root')?.inert ?? false,
    }));
    assert(
      JSON.stringify(observation.bodyAfter) === JSON.stringify(observation.bodyBefore),
      'Reduced-motion close did not restore body state',
    );
    assertNoPageFailures(failures, 'reduced-motion close lifecycle');
    return observation;
  }

  const direction = profile;
  observation.direction = direction;
  await page.evaluate((activeDirection) => {
    document.documentElement.dir = activeDirection;
  }, direction);
  observation.entrance = await openDialog(page);
  await assertKeyboardDialog(page);
  observation.measurements = await pageMeasurements(page);
  assertOpenDialog(observation.measurements);
  assert(
    observation.measurements.direction === direction,
    `${direction} did not reach the portalled Dialog`,
  );
  assert(
    observation.measurements.body.textAlign === 'start',
    `${direction} dialog content is not logically aligned`,
  );
  if (direction === 'ltr')
    assert(
      observation.measurements.close.x > observation.measurements.titleX,
      'LTR close control is not at logical end',
    );
  else
    assert(
      observation.measurements.close.x < observation.measurements.titleX,
      'RTL close control is not at logical end',
    );
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.keyboard.press('Escape');
  await expectClosedAndRestored(page);
  assertNoPageFailures(failures, `${profile} close lifecycle`);
  return observation;
}

async function runCase({ browserType, engine, profile, address, output }) {
  const consoleErrors = [];
  const pageErrors = [];
  const record = {
    engine,
    profile,
    expected: 'PASS',
    result: 'FAIL',
    consoleErrors,
    pageErrors,
    observation: {},
    cleanup: [],
  };
  const openScreenshot = `${engine}-${profile}-open.png`;
  let context;
  let page;
  try {
    context = await browserType.newContext({
      viewport: { width: 1280, height: 720 },
      locale: 'en-US',
    });
    page = await context.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(address, { waitUntil: 'load' });
    await executeProfile(page, profile, join(output, openScreenshot), record.observation, record);
    assertNoPageFailures(record, `${profile} profile`);
    if (record.observation.unavailable) {
      record.result = 'unavailable';
    } else {
      record.result = 'PASS';
      record.screenshot = openScreenshot;
    }
  } catch (error) {
    record.error = error instanceof Error ? (error.stack ?? error.message) : String(error);
  } finally {
    if (record.result !== 'PASS' && page) {
      const finalScreenshot = `${engine}-${profile}-final.png`;
      record.screenshot = finalScreenshot;
      await page
        .screenshot({ path: join(output, finalScreenshot), fullPage: true })
        .catch((error) => {
          record.screenshotError = error instanceof Error ? error.message : String(error);
        });
    }
    if (context) {
      try {
        await context.close();
        record.cleanup.push({ resource: 'context', status: 'closed' });
      } catch (error) {
        record.cleanup.push({
          resource: 'context',
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
        record.result = 'FAIL';
      }
    }
  }
  return record;
}

async function cleanupOwnedResources({ browser, preview, temporaryRoot }) {
  const outcomes = [];
  for (const [resource, cleanup] of [
    ['browser', browser ? () => browser.close() : null],
    ['preview process', preview ? () => stopPreview(preview.child) : null],
    [
      'temporary root',
      () => {
        rmSync(temporaryRoot, { recursive: true, force: true });
        return { status: 'removed', path: temporaryRoot };
      },
    ],
  ]) {
    if (cleanup === null) continue;
    try {
      outcomes.push({ resource, status: 'closed', detail: await cleanup() });
    } catch (error) {
      outcomes.push({
        resource,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return outcomes;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  assert(!existsSync(options.output), `Output path already exists: ${options.output}`);
  const reactTarball = validatePackedPackage(options.reactTarball, '@lyra-ds/react');
  const stylesTarball = validatePackedPackage(options.stylesTarball, '@lyra-ds/styles');
  mkdirSync(options.output, { recursive: false });
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'lyra-dialog-profiles-'));
  let preview;
  let browser;
  const report = {
    schemaVersion: 1,
    scope:
      'React19 packed Dialog six-profile browser-media emulation slice only; no OS high-contrast, hydration, coarse-pointer, other-components, historical-baseline, or release claims.',
    revision: commandOutput('git', ['rev-parse', 'HEAD']),
    command: process.argv.map((value) => JSON.stringify(value)).join(' '),
    sourceFiles: sourceFileHashes(),
    inputTarballs: {
      react: {
        path: options.reactTarball,
        sha256: sha256(options.reactTarball),
        packageVersion: reactTarball.version,
      },
      styles: {
        path: options.stylesTarball,
        sha256: sha256(options.stylesTarball),
        packageVersion: stylesTarball.version,
      },
    },
    environment: {
      operatingSystem: `${platform()} ${release()}`,
      architecture: arch(),
      node: process.version,
      playwright: json(REQUIRE.resolve('playwright/package.json')).version,
      axeCore: json(REQUIRE.resolve('axe-core/package.json')).version,
    },
    cases: [],
    cleanup: [],
  };
  try {
    const consumer = join(temporaryRoot, 'consumer');
    report.consumer = prepareConsumer({
      consumer,
      store: join(temporaryRoot, 'pnpm-store'),
      reactTarball: options.reactTarball,
      stylesTarball: options.stylesTarball,
    });
    const vite = consumerViteBinary(consumer);
    report.consumer.vite = json(join(consumer, 'node_modules', 'vite', 'package.json')).version;
    buildConsumer(consumer, vite);
    preview = startPreview(consumer, vite);
    const previewAddress = await preview.address;
    const playwright = await import('playwright');
    for (const engine of options.engines) {
      const browserType = playwright[engine];
      assert(browserType, `Pinned Playwright API is missing ${engine}`);
      browser = await browserType.launch({ headless: true });
      report.environment[engine] = {
        version: browser.version(),
        executablePath: browserType.executablePath(),
      };
      for (const profile of PROFILES) {
        report.cases.push(
          await runCase({
            browserType: browser,
            engine,
            profile,
            address: previewAddress,
            output: options.output,
          }),
        );
      }
      try {
        await browser.close();
        report.cleanup.push({ resource: `${engine} browser`, status: 'closed' });
        browser = undefined;
      } catch (error) {
        report.cleanup.push({
          resource: `${engine} browser`,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  } catch (error) {
    report.fatalError = error instanceof Error ? (error.stack ?? error.message) : String(error);
  } finally {
    report.cleanup.push(...(await cleanupOwnedResources({ browser, preview, temporaryRoot })));
    if (report.cleanup.some((entry) => entry.status === 'failed')) {
      report.cleanupFailure = 'One or more owned resources failed cleanup.';
    }
    report.finishedAt = new Date().toISOString();
    writeFileSync(join(options.output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  const expectedCases = options.engines.length * PROFILES.length;
  if (
    report.fatalError ||
    report.cleanupFailure ||
    report.cases.length !== expectedCases ||
    report.cases.some((entry) => entry.result !== 'PASS')
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
