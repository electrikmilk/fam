import assert from 'node:assert/strict';
import test from 'node:test';
import { runAudit } from '../tools/contrast-audit.mjs';

// Fewest text, placeholder and icon items each page should yield, so an audit that measures nothing cannot pass
const MINIMUM_MEASURED = { controls: 20, notes: 20, 'sign-in': 6 };

for (const [name, minimum] of Object.entries(MINIMUM_MEASURED)) {
  test(`${name} has no contrast failures at the worst pixel`, async () => {
    const { measured, failures } = await runAudit(name);
    const report = failures
      .map((failure) => `${failure.kind} "${failure.text}" in ${failure.sel}: worst ${failure.worst.toFixed(2)}, needs ${failure.needed}`)
      .join('\n');
    assert.equal(failures.length, 0, `${failures.length} of ${measured} items fail:\n${report}`);
    assert.ok(measured >= minimum, `only ${measured} items were measured, expected at least ${minimum}`);
  });
}
