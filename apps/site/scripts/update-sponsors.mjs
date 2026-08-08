import { access, copyFile, readFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const outputPaths = {
  json: resolve(siteRoot, 'data/sponsors.json'),
  svg: resolve(siteRoot, 'data/sponsors.svg'),
};
export const committedOutputPaths = {
  json: outputPaths.json,
  svg: resolve(siteRoot, 'public/sponsors.svg'),
};

function requireGitHubToken(token = process.env.SPONSORKIT_GITHUB_TOKEN) {
  if (!token) {
    throw new Error(
      'Missing SPONSORKIT_GITHUB_TOKEN. Refusing to regenerate sponsor artifacts without it.',
    );
  }

  return token;
}

function runSponsorKit(token) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn('pnpm', ['exec', 'sponsorkit', '--force'], {
      cwd: siteRoot,
      env: {
        ...process.env,
        SPONSORKIT_GITHUB_TOKEN: token,
      },
      stdio: 'inherit',
    });

    child.once('error', rejectRun);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolveRun();
        return;
      }

      rejectRun(
        new Error(
          `SponsorKit exited with ${signal ? `signal ${signal}` : `code ${code ?? 'unknown'}`}.`,
        ),
      );
    });
  });
}

async function removeIfPresent(path) {
  try {
    await rm(path);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function requireFile(path, label) {
  try {
    await access(path);
  } catch {
    throw new Error(`SponsorKit did not create the expected ${label} artifact: ${path}`);
  }
}

export async function updateSponsors({ token } = {}) {
  const githubToken = requireGitHubToken(token);
  await runSponsorKit(githubToken);

  const sponsors = JSON.parse(await readFile(outputPaths.json, 'utf8'));
  if (!Array.isArray(sponsors)) {
    throw new Error('SponsorKit wrote an invalid sponsors.json artifact; expected an array.');
  }

  if (sponsors.length === 0) {
    await removeIfPresent(outputPaths.svg);
    await removeIfPresent(committedOutputPaths.svg);
    return sponsors;
  }

  await requireFile(outputPaths.svg, 'SVG');
  await removeIfPresent(committedOutputPaths.svg);
  await copyFile(outputPaths.svg, committedOutputPaths.svg);
  await removeIfPresent(outputPaths.svg);

  return sponsors;
}

await updateSponsors();
