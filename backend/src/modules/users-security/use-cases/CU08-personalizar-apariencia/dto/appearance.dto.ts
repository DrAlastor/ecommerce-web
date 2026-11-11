import { IsString, IsOptional, Matches, MaxLength } from 'class-validator';

export class UpdateAppearanceDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  site_title?: string;
  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo_empresa?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'El color primario debe ser un código hexadecimal válido (#RRGGBB)',
  })
  primary_color?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'El color secundario debe ser un código hexadecimal válido (#RRGGBB)',
  })
  secondary_color?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'El color de acento debe ser un código hexadecimal válido (#RRGGBB)',
  })
  accent_color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  font_family?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  hero_headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  hero_subheadline?: string;

  @IsOptional()
  @IsString()
  hero_description?: string;

  @IsOptional()
  @IsString()
  hero_banner_url?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  badge?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cta_primary_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cta_secondary_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  trust1_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  trust1_desc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  trust2_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  trust2_desc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  trust3_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  trust3_desc?: string;

  @IsOptional()
  @IsString()
  admin_sidebar_color?: string;

  @IsOptional()
  @IsString()
  admin_accent_color?: string;

  @IsOptional()
  @IsString()
  storefront_bg_color?: string;

  @IsOptional()
  @IsString()
  storefront_page_bg?: string;

  @IsOptional()
  @IsString()
  card_bg_color?: string;

  @IsOptional()
  @IsString()
  preset_name?: string;
}
