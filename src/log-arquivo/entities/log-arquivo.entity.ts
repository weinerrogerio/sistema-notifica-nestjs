import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class LogArquivo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  arquivo_importado: string;

  @Column()
  data_importacao: Date;

  //fazer relacionamento com user:log (1:n) --> quem importou
  @Column()
  fk_id_user: number;

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização (data_registro)
  @UpdateDateColumn()
  updatedAt?: Date;
}
