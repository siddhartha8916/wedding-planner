import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatINR,
  formatINRCompact,
  formatINRInputDisplay,
  parseINRInput,
} from '../currency.ts';

describe('INR currency utilities', () => {
  it('formats standard Indian rupee amounts with en-IN grouping', () => {
    assert.equal(formatINR(0), '₹0');
    assert.equal(formatINR(50000), '₹50,000');
    assert.equal(formatINR(200000), '₹2,00,000');
    assert.equal(formatINR(2500000), '₹25,00,000');
    assert.equal(formatINR(-15000), '-₹15,000');
  });

  it('formats compact INR values for tight cards and charts', () => {
    assert.equal(formatINRCompact(850), '₹850');
    assert.equal(formatINRCompact(35000), '₹35K');
    assert.equal(formatINRCompact(200000), '₹2L');
    assert.equal(formatINRCompact(2550000), '₹25.5L');
    assert.equal(formatINRCompact(12000000), '₹1.2Cr');
    assert.equal(formatINRCompact(-250000), '-₹2.5L');
  });

  it('safely parses dirty or formatted INR strings without NaN', () => {
    assert.equal(parseINRInput('₹2,00,000'), 200000);
    assert.equal(parseINRInput('50,000'), 50000);
    assert.equal(parseINRInput(''), 0);
    assert.equal(parseINRInput('abc'), 0);
    assert.equal(parseINRInput('1,25,000.75'), 125001);
  });

  it('formats raw integer amounts for numeric input display', () => {
    assert.equal(formatINRInputDisplay(0), '');
    assert.equal(formatINRInputDisplay(200000), '2,00,000');
  });
});
