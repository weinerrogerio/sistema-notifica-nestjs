import { IsString } from 'class-validator';

export class CreateContatoTabelionatoDto {
  @IsString()
  nomeTabelionato: string;

  @IsString()
  codTabelionato: string;

  @IsString()
  cnpj?: string;

  @IsString()
  titular: string;

  @IsString()
  telefone: string;

  @IsString()
  email: string;

  @IsString()
  endereco?: string;

  @IsString()
  cidade?: string;

  @IsString()
  uf?: string;

  @IsString()
  cep?: string;

  @IsString()
  observacao?: string;
}
