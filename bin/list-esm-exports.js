#!/usr/bin/env node
const fs = require('fs');
const yargs = require('yargs');

const getExportNames = require('../index');

/** @type {['type', 'value']} */
const kindChoices = ['type', 'value'];

const argv = yargs
  .scriptName('list-esm-exports')
  .usage(
    '$0 source',
    'Print named exports of ES module or TypeScript module or declartion.'
  )
  .showHelpOnFail(true)
  .options({
    kind: {
      choices: kindChoices,
      description: 'Filter export kind',
    },
    json: {
      type: 'boolean',
      description: 'Output export names with JSON',
    },
  })
  .strict().argv;

try {
  const exportNames = getExportNames(
    /** @type {string} */ (argv.source),
    argv.kind
  );

  if (argv.json) {
    console.log(JSON.stringify(exportNames));
  } else {
    const { EOL } = require('os');
    console.log(exportNames.join(`,${EOL}`));
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
