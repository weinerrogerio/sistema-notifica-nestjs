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

  //relacionamento user:log (1:n)
  @Column()
  fk_id_user: number;

  @Column()
  log_in: Date;

  @Column({ nullable: true })
  log_out: Date;

  // Tipo de encerramento da sessão: 'explícito' (usuário clicou em logout) ou 'implícito' (token expirou)
  @Column({ nullable: true, default: null })
  session_end_type: string;

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização ()
  @UpdateDateColumn()
  updatedAt?: Date;
}
