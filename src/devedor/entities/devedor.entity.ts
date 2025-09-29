import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('devedor')
export class Devedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ unique: true })
  doc_devedor: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  devedor_pj: boolean;

  @Column({ default: false })
  email_searched: boolean;

  //muitos para muitos com doc protesto(1:n - log_notificacao)
  //muitos para um --> um devedor pode ter muitas intimações (log_notificacao)
  // Um devedor pode ter muitas notificações
  @OneToMany(() => LogNotificacao, (logNotificacao) => logNotificacao.devedor)
  notificacao: LogNotificacao[];

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização (data_registro)
  @UpdateDateColumn()
  updatedAt?: Date;
}
