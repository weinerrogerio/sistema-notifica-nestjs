import { PartialType } from '@nestjs/mapped-types';
import { CreateDevedorDto } from './create-devedor.dto';

export class UpdateDevedorDto extends PartialType(CreateDevedorDto) {}
