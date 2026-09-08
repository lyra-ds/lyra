import { createServer } from '/Volumes/Home/francisross/Projects/lyra/lyra/node_modules/vite/dist/node/index.js';
import { chromium } from '/Volumes/Home/francisross/Projects/lyra/lyra/node_modules/playwright/index.mjs';
import { readFile, writeFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('.', import.meta.url));
const worktree = fileURLToPath(new URL('../../../', import.meta.url));
const main = '/Volumes/Home/francisross/Projects/lyra/lyra';
const files = ['packages/react/src/drawer/drawer.tsx', 'packages/react/src/dialog/dialog.tsx', 'packages/styles/styles.css', 'package.json', 'pnpm-lock.yaml'];
const hashes = async () => Object.fromEntries(await Promise.all(files.map(async f => [f, createHash('sha256').update(await readFile(worktree + f)).digest('hex')])));
const before = await hashes();
const facts = { source: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: worktree, encoding: 'utf8' }).trim(), node: process.version, platform: process.platform, before, scenarios: [], pageErrors: [] };
let server, browser;
try {
  server = await createServer({ configFile: false, root, cacheDir: root + 'cache', resolve: { alias: { 'react-dom': await realpath(main + '/packages/react/node_modules/react-dom'), react: await realpath(main + '/packages/react/node_modules/react') } }, server: { host: '127.0.0.1', port: 0, fs: { allow: [worktree, main] } } });
  await server.listen();
  const address = server.httpServer.address();
  browser = await chromium.launch({ headless: true });
  facts.browser = browser.version();
  for (const component of ['drawer', 'dialog']) {
    for (const gesture of ['backdrop', 'inside', 'inside-to-backdrop']) {
      const page = await browser.newPage({ viewport: { width: 1000, height: 720 } });
      page.on('pageerror', error => facts.pageErrors.push(String(error)));
      await page.goto(`http://127.0.0.1:${address.port}/?component=${component}`);
      await page.getByRole('button', { name: 'Open overlay', exact: true }).click();
      const panel = page.getByRole('dialog');
      await panel.waitFor({ state: 'visible' });
      await panel.evaluate(async el => { await Promise.all(el.getAnimations().map(a => a.finished)); });
      const box = await panel.boundingBox();
      assert.ok(box && box.width > 100 && box.width < 900);
      const inside = { x: box.x + 25, y: box.y + 100 };
      const outside = { x: 10, y: 360 };
      const geometry = await page.evaluate(({ inside, outside }) => {
        const name = el => el?.className || el?.tagName;
        window.pointerTrace = [];
        for (const type of ['mousedown', 'mouseup', 'click']) document.addEventListener(type, e => window.pointerTrace.push({ type, target: name(e.target), trusted: e.isTrusted }), { capture: true });
        return { inside: name(document.elementFromPoint(inside.x, inside.y)), outside: name(document.elementFromPoint(outside.x, outside.y)), overlayPosition: getComputedStyle(document.querySelector('[class$="-overlay"]')).position };
      }, { inside, outside });
      assert.equal(geometry.outside, `lyra-${component}-overlay`);
      assert.equal(geometry.overlayPosition, 'fixed');
      if (gesture === 'inside-to-backdrop') {
        await page.mouse.move(inside.x, inside.y);
        await page.mouse.down();
        await page.mouse.move(outside.x, outside.y, { steps: 8 });
        await page.mouse.up();
      } else {
        const point = gesture === 'backdrop' ? outside : inside;
        await page.mouse.click(point.x, point.y);
      }
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const closeRequests = Number(await page.locator('output').textContent());
      const trace = await page.evaluate(() => window.pointerTrace);
      facts.scenarios.push({ component, gesture, geometry, closeRequests, trace });
      assert.ok(trace.length >= 3 && trace.every(event => event.trusted));
      const expected = gesture === 'backdrop' || (component === 'drawer' && gesture === 'inside-to-backdrop') ? 1 : 0;
      assert.equal(closeRequests, expected, `${component}/${gesture}: current-source diagnostic expectation`);
      await page.close();
    }
  }
  assert.deepEqual(facts.pageErrors, []);
  facts.after = await hashes();
  assert.deepEqual(facts.after, before);
  facts.result = 'REPRODUCED: Drawer requests dismissal for inside-to-backdrop; Dialog does not';
} catch (error) {
  facts.error = String(error.stack || error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await server?.close();
  facts.cleanup = 'owned browser and server closed';
  await writeFile(root + 'result.json', JSON.stringify(facts, null, 2) + '\n');
  console.log(JSON.stringify(facts, null, 2));
}
