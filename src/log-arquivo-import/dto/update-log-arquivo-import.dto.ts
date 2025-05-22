import { PartialType } from '@nestjs/mapped-types';
import { CreateLogArquivoImportDto } from './create-log-arquivo-import.dto';

export class UpdateLogArquivoImportDto extends PartialType(CreateLogArquivoImportDto) {}
