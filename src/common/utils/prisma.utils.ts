/**
 * Convert Prisma Decimal to number
 * Handles both Prisma Decimal objects and regular numbers
 */
export function convertDecimal(value: any): number {
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return value.toNumber();
  }
  return Number(value || 0);
}
