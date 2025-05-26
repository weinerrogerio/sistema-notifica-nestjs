import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class LogNotificacao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email_enviado: boolean;

  @Column()
  data_envio: Date;

  @Column()
  lido: boolean;

  //relacionamentos devedor:log(1:N)
  @Column()
  fk_id_devedor: number;

  //relacionamentos protesto:log(1:N)
  @Column()
  fk_id_protesto: number;

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização ()
  @UpdateDateColumn()
  updatedAt?: Date;
}
