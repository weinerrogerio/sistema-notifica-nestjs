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
  /* 
      @Column()
      nomeTabelionato: string; // 1ª Tabelionato, 2ª Tabelionato, 3ª Tabelionato,...
    
      @Column({ unique: true })
      codTabelionato: string; //01, 02, 03,...
    
      @Column()
      cnpj?: string;
    
      @Column()
      titular: string;
    
      @Column()
      telefone: string;
    
      @Column()
      email: string;
    
      @Column()
      endereco?: string;
    
      @Column()
      cidade?: string;
    
      @Column()
      uf?: string;
    
      @Column()
      cep?: string;
    
      @Column()
      observacao?: string; // pode ser utilizado para dicionar mais emails, ou outra informação... */
}
