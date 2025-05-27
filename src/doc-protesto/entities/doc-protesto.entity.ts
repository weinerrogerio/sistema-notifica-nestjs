//npm i @nestjs/typeorm typeorm pg

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('doc_protesto')
export class DocProtesto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  data_apresentacao: Date;

  @Column()
  num_distribuicao: string;

  @Column()
  data_distribuicao: Date;

  @Column()
  cart_protesto: string;

  @Column()
  num_titulo: string;

  @Column()
  valor: number;

  @Column()
  saldo: number;

  @Column({ nullable: true })
  vencimento: string;

  //FAZER RELAÇÃO COM OUTRAS TABELAS depois
  @Column()
  fk_apresentante: number;

  /* //muitos para um
  @ManyToOne(() => Pessoa, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  //especifica a coluna "de" que armazena o ID da pessoa que enviou o recado
  @JoinColumn({ name: 'de' })
  de: Pessoa;
 */
  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização (data_registro)
  @UpdateDateColumn()
  updatedAt?: Date;
}
