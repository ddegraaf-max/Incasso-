// sprzedamfakture.pl — versie-info (footer + /health)
// Versie uit package.json; commit uit Railway-env (RAILWAY_GIT_COMMIT_SHA) of lokaal uit git.
const pkg = require('../package.json');

function gitCommit() {
  try {
    return require('child_process')
      .execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 })
      .toString().trim();
  } catch (e) {
    return '';
  }
}

const full = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.SOURCE_VERSION || process.env.GIT_COMMIT || gitCommit();

module.exports = {
  version: pkg.version,
  commit: full ? full.slice(0, 7) : '',
  commitFull: full,
  startedAt: new Date().toISOString(),
};
