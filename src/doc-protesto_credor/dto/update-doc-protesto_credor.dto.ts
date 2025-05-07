import { PartialType } from '@nestjs/mapped-types';
import { CreateDocProtestoCredorDto } from './create-doc-protesto_credor.dto';

export class UpdateDocProtestoCredorDto extends PartialType(CreateDocProtestoCredorDto) {}
