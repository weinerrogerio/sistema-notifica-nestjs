import { PartialType } from '@nestjs/mapped-types';
import { CreateDocProtestoDto } from './create-doc-protesto.dto';

export class UpdateDocProtestoDto extends PartialType(CreateDocProtestoDto) {}
