export const USER_ROLE = {
	BUYER: "BUYER",
	SELLER: "SELLER",
	ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const USER_ROLES = Object.values(USER_ROLE);
