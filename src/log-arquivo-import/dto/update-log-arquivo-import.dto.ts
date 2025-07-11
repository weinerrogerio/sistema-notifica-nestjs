import { PartialType } from '@nestjs/mapped-types';
import { CreateLogArquivoImportDto } from './create-log-arquivo-import.dto';
import { IsNumber, IsString } from 'class-validator';

export class UpdateLogArquivoImportDto extends PartialType(
  CreateLogArquivoImportDto,
) {
  @IsNumber()
  registros_duplicados?: string; // total de registros duplicados

  @IsString()
  detalhes_duplicidade?: string; // JSON com duplicidades
}
