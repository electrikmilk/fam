# Fam UI

## Testing

- The full suite (`npm test`) takes multiple minutes. Run targeted tests as much as possible.
- Build first, then run only the test files for what you changed: `npm run build && node --test --test-concurrency=4 tests/<file>.test.mjs`.
