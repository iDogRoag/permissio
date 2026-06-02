# v0.2.0 Release Notes

Permissio is an offline, read-only CLI for reviewing GitHub Actions `GITHUB_TOKEN` permissions and recommending explicit least privilege job-level settings.

Package identity:

- GitHub repository: `iDogRoag/permissio`
- npm package: `@idogee/permissio`
- CLI command: `permissio`

Install and run:

```sh
npx @idogee/permissio check .
npm install --save-dev @idogee/permissio
npm install -g @idogee/permissio
```

Highlights:

- `permissio check` scans workflow YAML for broad, implicit, or risky token permissions.
- `permissio demo` scans a bundled risky example.
- Reports can be printed as table, Markdown, JSON, or HTML.
- Permission score and badge output are available for launch/demo workflows.
- `permissio check --ci` is accepted for CI-friendly documented usage.
- Recommendations are deterministic and explain why each permission is inferred.
- The CLI runs locally without GitHub credentials or API calls.
