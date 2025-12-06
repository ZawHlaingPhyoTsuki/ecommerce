import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = {
	...defaultStatements,
	category: ["create", "read", "update", "delete"],
	product: ["create", "read", "update", "delete"],
	order: ["read", "update"],
} as const;

export const ac = createAccessControl(statement);

export const ADMIN = ac.newRole({
	...adminAc.statements,
	category: ["create", "read", "update", "delete"],
	product: ["create", "read", "update", "delete"],
	order: ["read", "update"],
});

export const BUYER = ac.newRole({
	category: ["read"],
	product: ["read"],
	order: ["read", "update"],
	user: ["list"],
});

export const SELLER = ac.newRole({
	category: ["read"],
	product: ["create", "read", "update", "delete"],
	order: ["read", "update"],
	user: ["list"],
});
