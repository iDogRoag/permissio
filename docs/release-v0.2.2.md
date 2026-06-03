# v0.2.2 Release Notes

Permissio v0.2.2 fixes installed CLI execution through npm.

Changes:

- Fixed the CLI entrypoint so `permissio` runs correctly through npm's `.bin/permissio` symlink.
- Added regression coverage for symlinked npm bin invocation.

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
- `npx @idogee/permissio@latest --version`
- `npx @idogee/permissio@latest demo`
