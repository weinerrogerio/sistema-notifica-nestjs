import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../common/enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Se não houver roles definidas, permite o acesso
    }

    const request = context.switchToHttp().getRequest();
    // Usa a chave REQUEST_TOKEN_PAYLOAD_KEY onde o payload do token está armazenado
    const userPayload = request['REQUEST_TOKEN_PAYLOAD_KEY'];

    // Verifica se existe o payload e se ele tem a propriedade role
    if (!userPayload || !userPayload.role) {
      return false; // Acesso negado se não houver payload ou role
    }

    return requiredRoles.some((role) => userPayload.role === role);
  }
}
