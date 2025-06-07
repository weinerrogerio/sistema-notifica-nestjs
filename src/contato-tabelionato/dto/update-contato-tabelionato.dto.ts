import { PartialType } from '@nestjs/mapped-types';
import { CreateContatoTabelionatoDto } from './create-contato-tabelionato.dto';

export class UpdateContatoTabelionatoDto extends PartialType(CreateContatoTabelionatoDto) {}
