import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class LogUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  log_in: Date;

  @Column()
  log_out: Date;

  //relacionamento user:log (1:n)
  @Column()
  fk_id_user: number;

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização ()
  @UpdateDateColumn()
  updatedAt?: Date;
}
