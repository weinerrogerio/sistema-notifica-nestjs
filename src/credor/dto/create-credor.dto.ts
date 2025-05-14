import { IsString } from 'class-validator';

export class CreateCredorDto {
  @IsString()
  cedente: string;

  @IsString()
  sacador: string;

  @IsString()
  doc_credor: string;
}
