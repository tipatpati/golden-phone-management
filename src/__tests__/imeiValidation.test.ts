import { describe, it, expect } from 'vitest';
import { validateIMEI, formatIMEI, generateIMEICheckDigit } from '@/utils/imeiValidation';

describe('imeiValidation utilities', () => {
  it('validates a known good IMEI', () => {
    // Known valid IMEI test number
    const valid = '490154203237518';
    const res = validateIMEI(valid);
    expect(res.isValid).toBe(true);
    expect(res.formattedIMEI).toBe('490154203237518');
    expect(res.deviceInfo?.tac).toBe('49015420');
    expect(res.deviceInfo?.snr).toBe('323751');
    expect(res.deviceInfo?.cd).toBe('8');
  });

  it('rejects non-15-digit input', () => {
    const res = validateIMEI('12345');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('15 digits');
  });

  it('rejects invalid check digit', () => {
    const invalid = '490154203237519'; // last digit altered
    const res = validateIMEI(invalid);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('check digit');
  });

  it('formats IMEI with dashes', () => {
    const formatted = formatIMEI('490154203237518');
    expect(formatted).toBe('49-015420-323751-8');
  });

  it('generates check digit for 14-digit partial', () => {
    const partial = '49015420323751';
    const cd = generateIMEICheckDigit(partial);
    expect(cd).toBe('8');
  });

  it('throws for invalid partial length', () => {
    expect(() => generateIMEICheckDigit('1234')).toThrow();
  });
});
