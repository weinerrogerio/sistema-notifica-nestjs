import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('doc_protesto_credor')
export class DocProtestoCredor {
  @PrimaryGeneratedColumn()
  id: number;

  // criar as chaves estrangeiras docProtesto:docProteto_credor (1:n)
  @Column()
  fk_doc_protesto: number;
  // criar as chaves estrangeiras
  @Column()
  fk_credor: number;

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização (data_registro)
  @UpdateDateColumn()
  updatedAt?: Date;
}
