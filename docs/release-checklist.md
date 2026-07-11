# Release Checklist

- [ ] Run `npm ci`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm pack --dry-run`.
- [ ] Run `npm publish --access public --dry-run`.
- [ ] Run `permissio demo`.
- [ ] Run `permissio check examples/risky --show-snippets`.
- [ ] Validate built SARIF output and exact locations.
- [ ] Update `CHANGELOG.md`.
- [ ] Update versioned release notes.
- [ ] Tag release.
- [ ] Publish npm package.
- [ ] Verify `npm view @idogee/permissio version`.
- [ ] Verify `npx @idogee/permissio@latest demo`.
- [ ] Create GitHub release.
- [ ] Post launch links.
