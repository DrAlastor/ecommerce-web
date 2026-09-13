import { SetMetadata } from '@nestjs/common';

export const FunctionRequired = (modulo: string, permiso: string) => 
  SetMetadata('function_required', { modulo, permiso });
