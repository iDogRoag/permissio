# npm Publish Check

Use the npm registry package `@idogee/permissio` for public releases.
The GitHub repository remains `iDogRoag/permissio`, and the CLI binary remains `permissio`.

## Preflight

```sh
npm whoami
npm view @idogee/permissio version
npm pack --dry-run
```

For the first publish of this scoped public package, include `--access public`:

```sh
npm publish --access public --dry-run
npm publish --access public
```

After a global install, users run the CLI binary:

```sh
npm install -g @idogee/permissio
permissio check .
```

Without a local or global install, users should run the scoped package through `npx`:

```sh
npx @idogee/permissio check .
npx @idogee/permissio demo
```
