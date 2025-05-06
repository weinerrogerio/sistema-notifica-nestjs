import { PartialType } from '@nestjs/mapped-types';
import { CreateCredorDto } from './create-credor.dto';

export class UpdateCredorDto extends PartialType(CreateCredorDto) {}
