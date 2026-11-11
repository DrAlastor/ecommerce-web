import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SaasLoginDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;
}

export interface SaasUserPayload {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rolGlobal: 'SUPER_ADMIN';
  activo: boolean;
}

export interface SaasLoginResponse {
  accessToken: string;
  user: SaasUserPayload;
  expiresIn: string;
}

