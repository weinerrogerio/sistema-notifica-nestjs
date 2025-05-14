import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('credor')
export class Credor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  sacador: string;

  @Column({ nullable: true })
  cedente: string;

  @Column({ nullable: false })
  doc_credor: string;

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização (data_registro)
  @UpdateDateColumn()
  updatedAt?: Date;
}
