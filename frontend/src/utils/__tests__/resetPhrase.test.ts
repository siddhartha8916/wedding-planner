import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  RESET_PHRASES,
  matchesResetPhrase,
  pickRandomResetPhrase,
} from '../resetPhrase.ts';

describe('resetPhrase utilities', () => {
  it('provides between 10 and 15 distinct non-empty confirmation phrases', () => {
    assert.ok(RESET_PHRASES.length >= 10 && RESET_PHRASES.length <= 15);
    const unique = new Set(RESET_PHRASES);
    assert.equal(unique.size, RESET_PHRASES.length);
  });

  it('picks a phrase from RESET_PHRASES and avoids repeating the previous phrase', () => {
    const first = RESET_PHRASES[0];
    for (let i = 0; i < 20; i += 1) {
      const next = pickRandomResetPhrase(first);
      assert.ok(RESET_PHRASES.includes(next as (typeof RESET_PHRASES)[number]));
      assert.notEqual(next, first);
    }
  });

  it('matches confirmation input accurately while tolerating outer whitespace and casing', () => {
    assert.equal(matchesResetPhrase('fresh marigold bloom', 'fresh marigold bloom'), true);
    assert.equal(matchesResetPhrase('  Fresh Marigold Bloom  ', 'fresh marigold bloom'), true);
    assert.equal(matchesResetPhrase('fresh marigold', 'fresh marigold bloom'), false);
    assert.equal(matchesResetPhrase('', ''), false);
  });
});
