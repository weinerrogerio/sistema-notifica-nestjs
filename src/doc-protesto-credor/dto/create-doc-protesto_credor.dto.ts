import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateDocProtestoCredorDto {
  // criar as chaves estrangeiras docProtesto:docProteto_credor (1:n)
  @IsNumber()
  @IsNotEmpty()
  fk_protesto: number;
  // criar as chaves estrangeiras
  @IsNumber()
  @IsNotEmpty()
  fk_credor: number;
}
