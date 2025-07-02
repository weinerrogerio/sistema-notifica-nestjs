import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { StatusImportacao } from '../enum/log-arquivo.enum';

export class CreateLogArquivoImportDto {
  @IsString()
  @IsNotEmpty()
  nome_arquivo: string;

  @IsString()
  mimetype: string;

  @IsNumber()
  tamanho_arquivo?: number; // em bytes

  @IsString()
  status: StatusImportacao;

  @IsNumber()
  total_registros?: number;

  @IsNumber()
  registros_processados?: number;

  @IsNumber()
  registros_com_erro?: number;

  @IsString()
  detalhes_erro?: string; // JSON com detalhes dos erros

  @IsString()
  duracao?: string; // formato: "00:01:23"

  // Relacionamento com usuário
  @IsNumber()
  @IsNotEmpty()
  fk_usuario: number;
}
