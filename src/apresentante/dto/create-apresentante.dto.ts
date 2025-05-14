import { IsString } from 'class-validator';

export class CreateApresentanteDto {
  @IsString()
  nome: string;

  @IsString()
  cod_apresentante: string;
}
