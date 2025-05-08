import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDevedorDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  doc_devedor: string;

  /* comentado por enquanto - será enviado no update apos a busca 
  @IsString()
  @IsEmail()
  email: string; */

  @IsString()
  @IsNotEmpty()
  devedor_pj: boolean;
}
