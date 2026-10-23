import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { runAudit } from '../tools/contrast-audit.mjs';

// Fewest text, placeholder and icon items each page should yield, so an audit that measures nothing cannot pass
const MINIMUM_MEASURED = {
  controls: 20,
  notes: 20,
  'sign-in': 6,
  components: 15,
  showcase: 30,
  'showcase-materials': 15,
  'showcase-controls': 400,
  'showcase-glass': 15,
  'showcase-examples': 10,
};
const WIDTHS = [1440, 375];

// Each audit has its own browser context and temp directory, so they can run side by side
describe('contrast', { concurrency: 4 }, () => {
  for (const [name, minimum] of Object.entries(MINIMUM_MEASURED)) {
    for (const width of WIDTHS) {
      test(`${name} has no contrast failures at the worst pixel at ${width}px wide`, async () => {
        const { measured, failures } = await runAudit(name, { width });
        const report = failures
          .map((failure) => `${failure.kind} "${failure.text}" in ${failure.sel}: worst ${failure.worst.toFixed(2)}, needs ${failure.needed}`)
          .join('\n');
        assert.equal(failures.length, 0, `${failures.length} of ${measured} items fail:\n${report}`);
        assert.ok(measured >= minimum, `only ${measured} items were measured, expected at least ${minimum}`);
      });
    }
  }
});
