import { IsString, IsOptional, IsEmail, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo_empresa?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'La razón social debe tener al menos 3 caracteres' })
  @MaxLength(200)
  razon_social?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre comercial debe tener al menos 2 caracteres' })
  @MaxLength(200)
  nombre_comercial?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9A-Za-z-]{5,30}$/, {
    message: 'El NIT debe contener entre 5 y 30 caracteres alfanuméricos válidos',
  })
  nit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pais?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  moneda_principal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  moneda_secundaria?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico debe ser una dirección válida' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  ciudad_nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;
}
