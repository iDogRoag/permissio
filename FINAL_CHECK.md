# Final Check

## npm scope fix

### What changed

- Switched npm package metadata to `@idogee/permissio`.
- Kept the GitHub repository as `https://github.com/iDogRoag/permissio`.
- Kept the CLI binary as `permissio`.
- Updated README, share copy, changelog, npm publish notes, and v0.2.0 release notes to use `@idogee/permissio`.
- Added tests for package metadata and install-command documentation.
- Added `permissio check --ci` as a CI-compatible flag so the documented GitHub Actions command is accepted.
- No npm publish or GitHub release was created for this fix.

### Commands run

- `npm install`
- `npm test`
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `npm pack --dry-run`
- `env npm_config_cache=/private/tmp/permissio-npm-cache npm pack --dry-run`

### Commands passed

- `npm install`
- `npm test` with 28 passing tests
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `env npm_config_cache=/private/tmp/permissio-npm-cache npm pack --dry-run`

### Any failures

- `npm pack --dry-run` failed with `EPERM` while opening the default user npm cache.
- The same pack dry-run passed with the temp npm cache at `/private/tmp/permissio-npm-cache`.
- An initial `npm test` run failed because the new CI-mode test expected `# Permissio report` while the existing Markdown renderer emits `# permissio report`; the test was corrected and the full suite passed.

### Manual next steps

- Run `npm publish --access public`.
- Verify `npm view @idogee/permissio version`.
- Verify `npx @idogee/permissio demo`.
- Edit GitHub `v0.2.0` release notes if needed.
- Create GitHub `v0.2.1` release after npm publish.
- Open seed issues.
- Post launch.

## pre-publish consistency

### Commands run

- Stale text scan for legacy package scope, old release tag, local home path, placeholders, and draft install wording.
- `npm install`
- `npm test`
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `env npm_config_cache=/private/tmp/permissio-npm-cache npm pack --dry-run`

### Commands passed

- Stale text scan returned no matches.
- `npm install`
- `npm test` with 28 passing tests
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `env npm_config_cache=/private/tmp/permissio-npm-cache npm pack --dry-run`

### Files changed

- `CHANGELOG.md`
- `README.md`
- `docs/npm-publish-check.md`
- `docs/release-v0.2.0.md`
- `docs/share-copy.md`
- `package-lock.json`
- `package.json`
- `src/cli.ts`
- `test/cli.test.ts`
- `test/launch.test.ts`
- `FINAL_CHECK.md`

### Manual next steps

- `git add .`
- `git commit -m "Prepare permissio scoped npm release"`
- `git push origin main`
- `env npm_config_cache=/private/tmp/permissio-npm-cache npm publish --access public`
- `npm view @idogee/permissio version`
- `npx @idogee/permissio@latest demo`
- Edit GitHub `v0.2.0` release notes if needed.
- Create GitHub `v0.2.1` release after npm publish.

## final npm publish readiness

### Commands run

- `npm install`
- `npm test`
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `env npm_config_cache=/private/tmp/permissio-npm-cache npm pack --dry-run`
- Stale text scan for legacy package/install placeholders and draft launch wording.

### Commands passed

- `npm install`
- `npm test` with 28 passing tests
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `env npm_config_cache=/private/tmp/permissio-npm-cache npm pack --dry-run`
- The final pack dry-run produced `@idogee/permissio@0.2.1`.
- Stale text scan has no disallowed matches. The local binary command appears only in the README section after `npm install --save-dev @idogee/permissio`.

### Files changed

- `CHANGELOG.md`
- `docs/npm-publish-check.md`
- `docs/release-v0.2.1.md`
- `package-lock.json`
- `package.json`
- `test/cli.test.ts`
- `test/launch.test.ts`
- `FINAL_CHECK.md`

### Manual next steps

- `env npm_config_cache=/private/tmp/permissio-npm-cache npm publish --access public`
- `npm view @idogee/permissio version`
- `npx @idogee/permissio@latest demo`
- `npx @idogee/permissio@latest check . --format markdown`
- Edit GitHub `v0.2.0` release notes if needed.
- Create GitHub `v0.2.1` release.
- Open seed issues.
- Post launch.
