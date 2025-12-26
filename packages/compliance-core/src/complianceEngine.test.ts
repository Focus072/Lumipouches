import { describe, it, expect } from 'vitest';
import { evaluateCompliance } from './complianceEngine';
import { REASON_CODES } from './reasonCodes';
import type { OrderInput } from './types';

describe('Compliance Engine', () => {
  // Helper to create a valid base order input
  const createBaseOrder = (overrides: Partial<OrderInput> = {}): OrderInput => ({
    shippingAddress: {
      state: 'NY',
      is_po_box: false,
    },
    items: [
      {
        product: {
          flavor_type: 'TOBACCO',
          ca_utl_approved: true,
          sensory_cooling: false,
        },
        quantity: 1,
      },
    ],
    isFirstTimeRecipient: false,
    ageVerificationStatus: 'PASS',
    ...overrides,
  });

  describe('Age Verification (MANDATORY)', () => {
    it('should BLOCK when age verification fails', () => {
      const input = createBaseOrder({
        ageVerificationStatus: 'FAIL',
      });

      const result = evaluateCompliance(input);

      expect(result.decision).toBe('BLOCK');
      expect(result.reasonCodes).toContain(REASON_CODES.AGE_VERIFICATION_FAILED);
      expect(result.stakeCallRequired).toBe(false);
    });

    it('should ALLOW when age verification passes', () => {
      const input = createBaseOrder({
        ageVerificationStatus: 'PASS',
      });

      const result = evaluateCompliance(input);

      expect(result.decision).toBe('ALLOW');
      expect(result.reasonCodes).not.toContain(REASON_CODES.AGE_VERIFICATION_FAILED);
    });
  });

  describe('PO Box Check (PACT Act)', () => {
    it('should BLOCK when shipping to PO box', () => {
      const input = createBaseOrder({
        shippingAddress: {
          state: 'NY',
          is_po_box: true,
        },
      });

      const result = evaluateCompliance(input);

      expect(result.decision).toBe('BLOCK');
      expect(result.reasonCodes).toContain(REASON_CODES.PO_BOX_NOT_ALLOWED);
      expect(result.stakeCallRequired).toBe(false);
    });

    it('should ALLOW when shipping to regular address', () => {
      const input = createBaseOrder({
        shippingAddress: {
          state: 'NY',
          is_po_box: false,
        },
      });

      const result = evaluateCompliance(input);

      expect(result.decision).toBe('ALLOW');
      expect(result.reasonCodes).not.toContain(REASON_CODES.PO_BOX_NOT_ALLOWED);
    });
  });

  describe('California Flavor Ban', () => {
    it('should BLOCK non-TOBACCO flavors in CA', () => {
      const flavors: Array<'MENTHOL' | 'FRUIT' | 'DESSERT' | 'OTHER'> = [
        'MENTHOL',
        'FRUIT',
        'DESSERT',
        'OTHER',
      ];

      for (const flavor of flavors) {
        const input = createBaseOrder({
          shippingAddress: {
            state: 'CA',
            is_po_box: false,
          },
          items: [
            {
              product: {
                flavor_type: flavor,
                ca_utl_approved: true,
                sensory_cooling: false,
              },
              quantity: 1,
            },
          ],
        });

        const result = evaluateCompliance(input);

        expect(result.decision).toBe('BLOCK');
        expect(result.reasonCodes).toContain(REASON_CODES.CA_FLAVOR_BAN);
      }
    });

    it('should ALLOW TOBACCO flavor in CA when UTL approved', () => {
      const input = createBaseOrder({
        shippingAddress: {
          state: 'CA',
          is_po_box: false,
        },
        items: [
          {
            product: {
              flavor_type: 'TOBACCO',
              ca_utl_approved: true,
              sensory_cooling: false,
            },
            quantity: 1,
          },
        ],
        isFirstTimeRecipient: false,
      });

      const result = evaluateCompliance(input);

      expect(result.decision).toBe('ALLOW');
      expect(result.reasonCodes).not.toContain(REASON_CODES.CA_FLAVOR_BAN);
    });

    it('should BLOCK sensory cooling products in CA', () => {
      const input = createBaseOrder({
        shippingAddress: {
          state: 'CA',
          is_po_box: false,
        },
        items: [
          {
            product: {
              flavor_type: 'TOBACCO',
              ca_utl_approved: true,
              sensory_cooling: true,
            },
            quantity: 1,
          },
        ],
      });

      const result = evaluateCompliance(input);

      expect(result.decision).toBe('BLOCK');
      expect(result.reasonCodes).toContain(REASON_CODES.CA_SENSORY_BAN);
    });

    it('should BLOCK non-UTL approved products in CA', () => {
      const input = createBaseOrder({
        shippingAddress: {
          state: 'CA',
          is_po_box: false,
        },
        items: [
          {
            product: {
              flavor_type: 'TOBACCO',
              ca_utl_approved: false,
              sensory_cooling: false,
            },
            quantity: 1,
          },
        ],
      });

      const result = evaluateCompliance(input);

      expect(result.decision).toBe('BLOCK');
      expect(result.reasonCodes).toContain(REASON_CODES.CA_UTL_REQUIRED);
    });

    it('should accumulate multiple CA violations', () => {
      const input = createBaseOrder({
        shippingAddress: {
          state: 'CA',
          is_po_box: false,
        },
        items: [
          {
            product: {
              flavor_type: 'FRUIT',
              ca_utl_approved: false,
              sensory_cooling: true,
            },
            quantity: 1,
          },
        ],
      });

      const result = evaluateCompliance(input);

      expect(result.decision).toBe('BLOCK');
      expect(result.reasonCodes).toContain(REASON_CODES.CA_FLAVOR_BAN);
      expect(result.reasonCodes).toContain(REASON_CODES.CA_SENSORY_BAN);
      expect(result.reasonCodes).toContain(REASON_CODES.CA_UTL_REQUIRED);
      expect(result.reasonCodes.length).toBe(3);
    });

    it('should not apply CA rules to non-CA states', () => {
      const input = createBaseOrder({
        shippingAddress: {
          state: 'NY',
          is_po_box: false,
        },
        items: [
          {
            product: {
              flavor_type: 'FRUIT',
              ca_utl_approved: false,
              sensory_cooling: true,
            },
            quantity: 1,
          },
        ],
      });

      const result = evaluateCompliance(input);

      expect(result.decision).toBe('ALLOW');
      expect(result.reasonCodes).not.toContain(REASON_CODES.CA_FLAVOR_BAN);
      expect(result.reasonCodes).not.toContain(REASON_CODES.CA_SENSORY_BAN);
      expect(result.reasonCodes).not.toContain(REASON_CODES.CA_UTL_REQUIRED);
    });
  });

  describe('California STAKE Act', () => {
    it('should require STAKE call for first-time CA recipient', () => {
      const input = createBaseOrder({
        shippingAddress: {
          state: 'CA',
          is_po_box: false,
        },
        items: [
          {
            product: {
              flavor_type: 'TOBACCO',
              ca_utl_approved: true,
              sensory_cooling: false,
            },
            quantity: 1,
          },
        ],
        isFirstTimeRecipient: true,
      });

      const result = evaluateCompliance(input);

      expect(result.decision).toBe('ALLOW');
      expect(result.stakeCallRequired).toBe(true);
    });

    it('should not require STAKE call for returning CA recipient', () => {
      const input = createBaseOrder({
        shippingAddress: {
          state: 'CA',
          is_po_box: false,
        },
        items: [
          {
            product: {
              flavor_type: 'TOBACCO',
              ca_utl_approved: true,
              sensory_cooling: false,
            },
            quantity: 1,
          },
        ],
        isFirstTimeRecipient: false,
      });

      const result = evaluateCompliance(input);

      expect(result.decision).toBe('ALLOW');
      expect(result.stakeCallRequired).toBe(false);
    });

    it('should not require STAKE call for non-CA states', () => {
      const input = createBaseOrder({
        shippingAddress: {
          state: 'NY',
          is_po_box: false,
        },
        isFirstTimeRecipient: true,
      });

      const result = evaluateCompliance(input);

      expect(result.decision).toBe('ALLOW');
      expect(result.stakeCallRequired).toBe(false);
    });
  });

  describe('Multiple Items', () => {
    it('should check all items for CA compliance', () => {
      const input = createBaseOrder({
        shippingAddress: {
          state: 'CA',
          is_po_box: false,
        },
        items: [
          {
            product: {
              flavor_type: 'TOBACCO',
              ca_utl_approved: true,
              sensory_cooling: false,
            },
            quantity: 1,
          },
          {
            product: {
              flavor_type: 'FRUIT',
              ca_utl_approved: true,
              sensory_cooling: false,
            },
            quantity: 2,
          },
        ],
      });

      const result = evaluateCompliance(input);

      expect(result.decision).toBe('BLOCK');
      expect(result.reasonCodes).toContain(REASON_CODES.CA_FLAVOR_BAN);
    });
  });

  describe('Valid Non-CA Order', () => {
    it('should ALLOW valid order to non-CA state', () => {
      const input = createBaseOrder({
        shippingAddress: {
          state: 'NY',
          is_po_box: false,
        },
        items: [
          {
            product: {
              flavor_type: 'FRUIT',
              ca_utl_approved: false,
              sensory_cooling: true,
            },
            quantity: 1,
          },
        ],
        isFirstTimeRecipient: false,
      });

      const result = evaluateCompliance(input);

      expect(result.decision).toBe('ALLOW');
      expect(result.reasonCodes).toEqual([]);
      expect(result.stakeCallRequired).toBe(false);
    });
  });

  describe('Rule Priority', () => {
    it('should check age verification before other rules', () => {
      const input = createBaseOrder({
        ageVerificationStatus: 'FAIL',
        shippingAddress: {
          state: 'CA',
          is_po_box: true,
        },
        items: [
          {
            product: {
              flavor_type: 'FRUIT',
              ca_utl_approved: false,
              sensory_cooling: true,
            },
            quantity: 1,
          },
        ],
      });

      const result = evaluateCompliance(input);

      // Should only have age verification failure
      expect(result.decision).toBe('BLOCK');
      expect(result.reasonCodes).toEqual([REASON_CODES.AGE_VERIFICATION_FAILED]);
    });

    it('should check PO box after age verification but before CA rules', () => {
      const input = createBaseOrder({
        shippingAddress: {
          state: 'CA',
          is_po_box: true,
        },
        items: [
          {
            product: {
              flavor_type: 'FRUIT',
              ca_utl_approved: false,
              sensory_cooling: true,
            },
            quantity: 1,
          },
        ],
      });

      const result = evaluateCompliance(input);

      // Should only have PO box violation
      expect(result.decision).toBe('BLOCK');
      expect(result.reasonCodes).toEqual([REASON_CODES.PO_BOX_NOT_ALLOWED]);
    });
  });
});

