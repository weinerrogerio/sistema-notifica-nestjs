import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('apresentante')
export class Apresentante {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  cod_apresentante: string;

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização (data_registro)
  @UpdateDateColumn()
  updatedAt?: Date;
}
