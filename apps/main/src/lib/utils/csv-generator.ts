/**
 * CSV Generator Utilities
 * 
 * Pure functions for generating CSV files from data.
 */

export interface PactReportRow {
  recipientName: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientZip: string;
  productBrand: string;
  productSku: string;
  quantity: number;
  netWeightGrams: number;
  shipmentDate: string;
  carrier: string;
  trackingNumber: string;
}

/**
 * Generate CSV content from PACT report rows
 * 
 * @param rows - Array of report rows
 * @returns CSV string
 */
export function generatePactCsv(rows: PactReportRow[]): string {
  // CSV header
  const header = [
    'Recipient Name',
    'Recipient Address',
    'Recipient City',
    'Recipient State',
    'Recipient ZIP',
    'Product Brand',
    'Product SKU',
    'Quantity',
    'Net Weight (grams)',
    'Shipment Date',
    'Carrier',
    'Tracking Number',
  ].join(',');

  // Generate rows
  const csvRows = rows.map((row) => {
    return [
      escapeCsvField(row.recipientName),
      escapeCsvField(row.recipientAddress),
      escapeCsvField(row.recipientCity),
      escapeCsvField(row.recipientState),
      escapeCsvField(row.recipientZip),
      escapeCsvField(row.productBrand),
      escapeCsvField(row.productSku),
      row.quantity.toString(),
      row.netWeightGrams.toString(),
      escapeCsvField(row.shipmentDate),
      escapeCsvField(row.carrier),
      escapeCsvField(row.trackingNumber),
    ].join(',');
  });

  return [header, ...csvRows].join('\n');
}

/**
 * Escape CSV field values
 * Handles commas, quotes, and newlines
 */
function escapeCsvField(value: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
