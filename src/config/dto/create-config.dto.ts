import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateConfigDto {
  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsNumber()
  SMTP_PORT?: number;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASS?: string;

  @IsOptional()
  @IsString()
  SMTP_FROM?: string;

  @IsOptional()
  @IsString()
  EXTERNAL_SERVICE_API_KEY?: string;

  @IsOptional()
  @IsString()
  EXTERNAL_SERVICE_SENDER_EMAIL?: string;
}
