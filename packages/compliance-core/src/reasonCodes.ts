/**
 * Compliance reason codes
 * These codes identify specific compliance violations or requirements
 */

export const REASON_CODES = {
  // Age verification failures
  AGE_VERIFICATION_FAILED: 'AGE_VERIFICATION_FAILED',

  // PACT Act violations
  PO_BOX_NOT_ALLOWED: 'PO_BOX_NOT_ALLOWED',

  // California flavor ban violations
  CA_FLAVOR_BAN: 'CA_FLAVOR_BAN',
  CA_SENSORY_BAN: 'CA_SENSORY_BAN',
  CA_UTL_REQUIRED: 'CA_UTL_REQUIRED',
} as const;

export type ReasonCode = typeof REASON_CODES[keyof typeof REASON_CODES];

