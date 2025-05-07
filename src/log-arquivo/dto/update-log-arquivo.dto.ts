import { PartialType } from '@nestjs/mapped-types';
import { CreateLogArquivoDto } from './create-log-arquivo.dto';

export class UpdateLogArquivoDto extends PartialType(CreateLogArquivoDto) {}
