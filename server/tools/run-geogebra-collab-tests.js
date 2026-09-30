#!/usr/bin/env node

const { runGeogebraCollabProtocolRunner } = require('./geogebraCollabProtocolRunner');

async function main() {
  try {
    const report = await runGeogebraCollabProtocolRunner({ verbose: true });

    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log(`GeoGebra protocol tests: ${report.summary.passed}/${report.summary.total} passed`);

    if (!report.ok) {
      report.tests
        .filter((entry) => entry.status === 'failed')
        .forEach((entry) => {
          // eslint-disable-next-line no-console
          console.error(` - ${entry.name}: ${entry.error || 'Unknown error'}`);
        });
      process.exitCode = 1;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to run GeoGebra protocol tests:', error && error.message ? error.message : error);
    process.exitCode = 1;
  }
}

main();
