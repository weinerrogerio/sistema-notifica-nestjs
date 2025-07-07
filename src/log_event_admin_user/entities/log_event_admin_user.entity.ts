import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('log_event_admin_user')
export class LogEventAdminUser {
  @PrimaryGeneratedColumn()
  id: number;

  // fazer relacionamento com user(sessão)--> logUser: fk_id_user --> 1:n
  @Column()
  id_user: number;

  // fazer relacionamento com target --> fk_id_target:user --> 1:1
  @Column()
  id_target: number;

  @Column()
  id_session: number;

  @Column()
  event: string;

  @Column()
  descricao: string;

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt: Date;
}
