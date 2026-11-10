import { IsString, IsOptional, Allow } from 'class-validator';

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

  @IsOptional()
  @IsString()
  password_confirm?: string;
}

export class RestoreUploadDto {
  @Allow()
  backup_data: any;

  @IsOptional()
  @IsString()
  password_confirm?: string;
}
