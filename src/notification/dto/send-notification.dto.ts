import { IsString, IsNumber, IsEmail } from 'class-validator';

export class SendNotificationDto {
  @IsNumber()
  logNotificacaoId: number;

  @IsString()
  nomeDevedor: string;

  @IsEmail()
  devedorEmail: string;

  @IsString()
  docDevedor: string;

  @IsString()
  distribuicao: string;

  @IsString()
  dataDistribuicao: Date;

  @IsString()
  numTitulo: string;

  @IsNumber()
  valorTotal: number;

  @IsString()
  dataVencimento: string; // data de vencimento string pois pode ser "a vista"

  @IsString()
  tabelionato: string;

  @IsString()
  credor: string;

  @IsString()
  portador: string;
  /* 
  @IsDate()
  createdAt?: Date; */
}
