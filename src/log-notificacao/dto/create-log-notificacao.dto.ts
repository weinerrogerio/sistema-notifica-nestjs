import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateLogNotificacaoDto {
  //relacionamentos devedor:log(1:N)
  @IsNumber()
  @IsNotEmpty()
  fk_devedor: number;

  //relacionamentos protesto:log(1:N)
  @IsNumber()
  @IsNotEmpty()
  fk_protesto: number;
}
