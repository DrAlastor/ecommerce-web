import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Si no hay token o es inválido, no lanzar excepción, devolver null
    if (err || !user) {
      return null;
    }
    return user;
  }
}
