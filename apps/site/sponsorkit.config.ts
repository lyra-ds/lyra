import { defineConfig, tierPresets } from 'sponsorkit';

export default defineConfig({
  github: {
    login: 'lyra-ds',
    type: 'organization',
  },
  // The committed JSON artifact doubles as SponsorKit's cache. The update
  // script always passes --force, so a scheduled refresh never serves stale data.
  cacheFile: 'sponsors.json',
  formats: ['json', 'svg'],
  name: 'sponsors',
  outputDir: './data',
  tiers: [
    {
      title: 'Past Sponsors',
      monthlyDollars: -1,
      preset: tierPresets.xs,
    },
    {
      title: 'Backers',
      preset: tierPresets.base,
    },
    {
      title: 'Sponsors',
      monthlyDollars: 10,
      preset: tierPresets.medium,
    },
  ],
});
