import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
} from "@nestjs/common";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { Reflector } from "@nestjs/core";

export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<string[]>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (requiredRoles && requiredRoles.length > 0) {
			const user = context.switchToHttp().getRequest().user;
			if (!user) {
				throw new ForbiddenException("Authentication required");
			}
			const userRole = user.role;

			let hasRole = false;
			if (Array.isArray(userRole)) {
				hasRole = userRole.some((role) => requiredRoles.includes(role));
			} else if (typeof userRole === "string") {
				hasRole = userRole
					.split(",")
					.some((role) => requiredRoles.includes(role));
			}

			if (!hasRole)
				throw new ForbiddenException(
					`Insufficient permissions. Required roles: ${requiredRoles.join(", ")}`,
				);
		}

		return true;
	}
}
