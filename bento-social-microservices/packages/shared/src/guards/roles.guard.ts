import {
	Injectable,
	CanActivate,
	ExecutionContext,
	ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
	UserRole,
	Requester,
} from '../interfaces/requester.interface';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<
			UserRole[]
		>(ROLES_KEY, [context.getHandler(), context.getClass()]);

		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const requester: Requester = request.requester;

		if (!requester) {
			throw new ForbiddenException('Access denied');
		}

		const hasRole = requiredRoles.some(
			(role: UserRole) => requester.role === role
		);

		if (!hasRole) {
			throw new ForbiddenException('Insufficient permissions');
		}

		return true;
	}
}
