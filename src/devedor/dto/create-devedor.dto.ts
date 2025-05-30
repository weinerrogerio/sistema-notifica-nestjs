import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateDevedorDto {
  //nome: string; doc_devedor: string; devedor_pj: boolean;
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

  @IsNotEmpty()
  @IsNumber()
  fk_protesto: number;
}
