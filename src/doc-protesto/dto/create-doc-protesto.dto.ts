import { IsDate, IsString } from 'class-validator';

export class CreateDocProtestoDto {
  @IsDate()
  data_apresentacao: Date;

  @IsString()
  num_distribuicao: string;

  @IsDate()
  data_distribuicao: Date;

  @IsString()
  cart_protesto: string;

  @IsString()
  num_titulo: string;

  @IsDate()
  vencimento: Date;
}
