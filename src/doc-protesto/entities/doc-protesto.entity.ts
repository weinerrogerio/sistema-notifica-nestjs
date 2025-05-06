//npm i @nestjs/typeorm typeorm pg

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class DocProtesto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  data_apresentacao: Date;

  @Column()
  num_distribuicao: number;

  @Column()
  data_distribuicao: Date;

  @Column()
  cart_protesto: string;

  @Column()
  num_titulo: string;

  @Column()
  vencimento: Date;

  /* //muitos para um
  @ManyToOne(() => Pessoa, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  //especifica a coluna "de" que armazena o ID da pessoa que enviou o recado
  @JoinColumn({ name: 'de' })
  de: Pessoa;
 */
  @CreateDateColumn()
  createdAt?: Date;
  @CreateDateColumn()
  updatedAt?: Date;
}
