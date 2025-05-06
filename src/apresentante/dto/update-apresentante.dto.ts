import { PartialType } from '@nestjs/mapped-types';
import { CreateApresentanteDto } from './create-apresentante.dto';

export class UpdateApresentanteDto extends PartialType(CreateApresentanteDto) {}
