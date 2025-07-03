import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateDocProtestoDto {
  @IsDate()
  data_apresentacao: Date;

  @IsString()
  num_distribuicao: string;

  @IsDate()
  data_distribuicao: Date;

  @IsNotEmpty()
  @IsString()
  cart_protesto: string;

  @IsNotEmpty()
  @IsString()
  num_titulo: string;

  @IsNotEmpty()
  @IsNumber()
  valor: number;

  @IsNotEmpty()
  @IsNumber()
  saldo: number;

  @IsNotEmpty()
  @IsString()
  vencimento: string;

  @IsNotEmpty()
  @IsNumber()
  fk_file: number;

  @IsNotEmpty()
  @IsNumber()
  fk_apresentante: number;
}
