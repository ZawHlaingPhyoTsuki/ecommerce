import { Prisma } from "generated/prisma/client";

/**
 * Convert Prisma Decimal to JavaScript number
 * Handles Decimal objects, numbers, strings, null, and undefined
 */
export function convertDecimal(
	value: Prisma.Decimal | number | string | null | undefined,
): number {
	// Handle null/undefined
	if (value === null || value === undefined) {
		return 0;
	}

	// Already a number
	if (typeof value === "number") {
		return value;
	}

	// Decimal object
	if (typeof value === "object" && "toNumber" in value) {
		return (value as Prisma.Decimal).toNumber();
	}

	// String
	if (typeof value === "string") {
		const parsed = parseFloat(value);
		return Number.isNaN(parsed) ? 0 : parsed;
	}

	// Fallback
	return 0;
}
