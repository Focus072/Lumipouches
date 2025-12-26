import type { FlavorType, AgeVerificationStatus, ComplianceDecision } from '@lumi/shared';
import type { OrderInput, ComplianceResult, ProductInput } from './types';
import { REASON_CODES } from './reasonCodes';

/**
 * Pure compliance engine for nicotine commerce
 * 
 * This module contains ZERO side effects:
 * - No database access
 * - No HTTP calls
 * - No logging
 * - No environment variables
 * - No async operations
 * 
 * All functions are pure, deterministic, and testable.
 */

/**
 * Check if age verification passed
 */
function checkAgeVerification(status: AgeVerificationStatus): string | null {
  if (status !== 'PASS') {
    return REASON_CODES.AGE_VERIFICATION_FAILED;
  }
  return null;
}

/**
 * Check if shipping address is a PO box (PACT Act restriction)
 */
function checkPoBox(isPoBox: boolean): string | null {
  if (isPoBox) {
    return REASON_CODES.PO_BOX_NOT_ALLOWED;
  }
  return null;
}

/**
 * Check California flavor ban compliance
 * 
 * Rules:
 * - Only TOBACCO flavor allowed in CA
 * - No sensory cooling products allowed in CA
 * - Product must be CA UTL approved
 */
function checkCaliforniaCompliance(
  state: string,
  items: Array<{ product: ProductInput; quantity: number }>
): string[] {
  const violations: string[] = [];

  if (state !== 'CA') {
    return violations;
  }

  for (const item of items) {
    const { product } = item;

    // Check flavor ban - only TOBACCO allowed
    if (product.flavor_type !== 'TOBACCO') {
      violations.push(REASON_CODES.CA_FLAVOR_BAN);
    }

    // Check sensory cooling ban
    if (product.sensory_cooling) {
      violations.push(REASON_CODES.CA_SENSORY_BAN);
    }

    // Check UTL approval requirement
    if (!product.ca_utl_approved) {
      violations.push(REASON_CODES.CA_UTL_REQUIRED);
    }
  }

  return violations;
}

/**
 * Determine if STAKE Act call is required
 * 
 * STAKE Act requires phone verification for first-time recipients in California
 */
function checkStakeCallRequired(
  state: string,
  isFirstTimeRecipient: boolean
): boolean {
  return state === 'CA' && isFirstTimeRecipient;
}

/**
 * Evaluate order compliance
 * 
 * Rules are evaluated in order:
 * 1. Age verification (mandatory - blocks if failed)
 * 2. PO Box check (PACT Act - blocks if PO box)
 * 3. California compliance (blocks if violations found)
 * 4. STAKE Act requirement (does not block, but flags for phone call)
 * 
 * @param input - Order input with address, items, and verification status
 * @returns Compliance result with decision, reason codes, and STAKE call requirement
 */
export function evaluateCompliance(input: OrderInput): ComplianceResult {
  const reasonCodes: string[] = [];

  // Rule 1: Age Verification (MANDATORY)
  const ageCheck = checkAgeVerification(input.ageVerificationStatus);
  if (ageCheck) {
    reasonCodes.push(ageCheck);
    return {
      decision: 'BLOCK',
      reasonCodes,
      stakeCallRequired: false,
    };
  }

  // Rule 2: PO Box Check (PACT Act)
  const poBoxCheck = checkPoBox(input.shippingAddress.is_po_box);
  if (poBoxCheck) {
    reasonCodes.push(poBoxCheck);
    return {
      decision: 'BLOCK',
      reasonCodes,
      stakeCallRequired: false,
    };
  }

  // Rule 3: California Flavor Ban
  const caViolations = checkCaliforniaCompliance(
    input.shippingAddress.state,
    input.items
  );
  if (caViolations.length > 0) {
    reasonCodes.push(...caViolations);
    return {
      decision: 'BLOCK',
      reasonCodes,
      stakeCallRequired: false,
    };
  }

  // Rule 4: STAKE Act (does not block, but requires phone call)
  const stakeCallRequired = checkStakeCallRequired(
    input.shippingAddress.state,
    input.isFirstTimeRecipient
  );

  return {
    decision: 'ALLOW',
    reasonCodes: [],
    stakeCallRequired,
  };
}

