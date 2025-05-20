import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateLogEventAdminUserDto {
  @IsNumber()
  @IsNotEmpty()
  fk_id_user: number;

  @IsNumber()
  fk_id_target: number;

  @IsString()
  event: string;

  @IsString()
  descricao: string;
}
