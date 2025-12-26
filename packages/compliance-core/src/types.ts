import type { FlavorType, AgeVerificationStatus, ComplianceDecision } from '@lumi/shared';

/**
 * Shipping address input for compliance checks
 */
export interface ShippingAddress {
  state: string;
  is_po_box: boolean;
}

/**
 * Product input for compliance checks
 */
export interface ProductInput {
  flavor_type: FlavorType;
  ca_utl_approved: boolean;
  sensory_cooling: boolean;
}

/**
 * Order item input
 */
export interface OrderItemInput {
  product: ProductInput;
  quantity: number;
}

/**
 * Complete order input for compliance evaluation
 */
export interface OrderInput {
  shippingAddress: ShippingAddress;
  items: OrderItemInput[];
  isFirstTimeRecipient: boolean;
  ageVerificationStatus: AgeVerificationStatus;
}

/**
 * Compliance evaluation result
 */
export interface ComplianceResult {
  decision: ComplianceDecision;
  reasonCodes: string[];
  stakeCallRequired: boolean;
}

