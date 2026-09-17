import { writeFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { afterAll, describe, expect, it } from 'vitest';
import { P1Compatibility, P1PortalServerComposition } from './p1';

afterAll(() => {
  writeFileSync('p1-ssr.html', renderToString(<P1Compatibility />));
});

describe('packed P1 SSR compatibility', () => {
  it('P1SSR: Dialog', () => {
    expect(renderToString(<P1PortalServerComposition />)).not.toContain('P1 server dialog body');
  });

  it('P1SSR: Drawer', () => {
    expect(renderToString(<P1PortalServerComposition />)).not.toContain('P1 server drawer body');
  });

  it('P1SSR: BottomSheet', () => {
    expect(renderToString(<P1PortalServerComposition />)).not.toContain(
      'P1 server bottom sheet body',
    );
  });

  it('P1SSR: Popover', () => {
    expect(renderToString(<P1Compatibility />)).toContain('Open P1 popover');
  });

  it('P1SSR: Dropdown', () => {
    expect(renderToString(<P1Compatibility />)).toContain('Open P1 dropdown');
  });

  it('P1SSR: Tooltip', () => {
    expect(renderToString(<P1Compatibility />)).toContain('role="tooltip"');
  });

  it('P1SSR: CommandPalette', () => {
    expect(renderToString(<P1PortalServerComposition />)).not.toContain('P1 server commands');
  });

  it('P1SSR: WorkspaceSwitcher', () => {
    expect(renderToString(<P1Compatibility />)).toContain('North workspace');
  });

  it('P1SSR: CreateWorkspaceDialog', () => {
    expect(renderToString(<P1PortalServerComposition />)).not.toContain('lyra-wscreate');
  });

  it('P1SSR: Tabs', () => {
    const markup = renderToString(<P1Compatibility />);
    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('role="tabpanel"');
  });

  it('P1SSR: DataTable', () => {
    const markup = renderToString(<P1Compatibility />);
    expect(markup).toContain('lyra-table');
    expect(markup).toContain('North project');
  });
});
