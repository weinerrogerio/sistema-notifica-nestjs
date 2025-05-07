import { PartialType } from '@nestjs/mapped-types';
import { CreateLogUserDto } from './create-log-user.dto';

export class UpdateLogUserDto extends PartialType(CreateLogUserDto) {}
