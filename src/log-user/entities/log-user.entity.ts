import { User } from '@app/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('log_users')
export class LogUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  log_in: Date;

  @Column({ nullable: true })
  log_out: Date;

  @Column()
  data_registro: Date;

  @Column()
  fk_user: number;

  // NOVOS CAMPOS
  @Column({ type: 'varchar', nullable: true })
  refresh_token_hash: string;

  @Column({ nullable: true })
  refresh_token_expires_at: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @Column({ type: 'boolean', default: true })
  session_active: boolean;

  @Column({ nullable: true })
  last_activity: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  session_end_type: string; // 'explicit', 'expired', 'forced'

  @ManyToOne(() => User)
  @JoinColumn({ name: 'fk_user' })
  user: User;

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização ()
  @UpdateDateColumn()
  updatedAt?: Date;
}
