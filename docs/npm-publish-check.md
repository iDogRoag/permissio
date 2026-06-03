# npm Publish Check

Use the npm registry package `@idogee/permissio` for public releases.
The GitHub repository remains `iDogRoag/permissio`, and the CLI binary remains `permissio`.

## Preflight

```sh
npm whoami
npm view @idogee/permissio version
npm pack --dry-run
npm publish --access public --dry-run
```

For the first public publish of a scoped package, include `--access public`.
Publishing must be done manually by the maintainer.

## Publish

```sh
npm publish --access public
```

## Verify Published Package

```sh
npm view @idogee/permissio version
npx @idogee/permissio@latest --version
npx @idogee/permissio@latest demo
npx @idogee/permissio@latest check . --format markdown
```

The CLI binary remains `permissio` after install:

```sh
npm install -g @idogee/permissio
permissio check .
```

Without a local or global install, users should run the scoped package through `npx`:

```sh
npx @idogee/permissio check .
npx @idogee/permissio demo
```
