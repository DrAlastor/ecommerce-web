import { IsString, IsOptional } from 'class-validator';

export class CreateBackupDto {
  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  tipo?: string;
}

export class RestoreBackupDto {
  @IsString()
  backup_id: string;

  @IsString()
  password_confirm: string;
}

