# v0.2.1 Release Notes

Permissio v0.2.1 is the npm publish readiness release.

Changes:

- Finalized npm package identity as `@idogee/permissio`.
- Kept the GitHub repository at `iDogRoag/permissio`.
- Kept the CLI binary as `permissio`.
- Added `publishConfig` for public scoped npm publishing.
- Updated README, npm publish docs, release docs, and tests.
- Added CI-compatible `--ci` flag support.

Install:

```sh
npx @idogee/permissio check .
```

Verification:

- `npm test`
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `npm pack --dry-run`
- `npm view @idogee/permissio version`
- `npx @idogee/permissio@latest demo`
