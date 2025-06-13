import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  // @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;
}
