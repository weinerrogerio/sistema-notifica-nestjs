import { IsBoolean, IsDate, IsEmail, IsNumber } from 'class-validator';

export class CreateLogNotificacaoDto {
  @IsEmail()
  email_enviado: boolean;

  @IsDate()
  data_envio: Date;

  @IsBoolean()
  lido: boolean;

  //relacionamentos devedor:log(1:N)
  @IsNumber()
  fk_id_devedor: number;

  //relacionamentos protesto:log(1:N)
  @IsNumber()
  fk_id_protesto: number;
}
