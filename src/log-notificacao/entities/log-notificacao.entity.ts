import { Devedor } from '@app/devedor/entities/devedor.entity';
import { DocProtesto } from '@app/doc-protesto/entities/doc-protesto.entity';
import { Template } from '@app/template/entities/template.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum NotificacaoStatus {
  PENDENTE = 'PENDENTE',
  ENVIADO = 'ENVIADO', // Saiu da sua aplicação
  ENTREGUE = 'ENTREGUE', // Chegou no servidor de destino (webhook)
  FALHA = 'FALHA', // Erro no envio
  BOUNCE = 'BOUNCE', // Email inválido / Caixa cheia
  LIDO = 'LIDO',
}

@Entity()
export class LogNotificacao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email_enviado: boolean;

  @Column({
    type: 'enum',
    enum: NotificacaoStatus,
    default: NotificacaoStatus.PENDENTE,
  })
  status: NotificacaoStatus;

  @Column({ nullable: true })
  data_envio: Date;

  @Column({ nullable: true })
  data_entrega: Date;

  @Column({ nullable: true })
  data_leitura: Date;

  // Se houver erro ou bounce, guarde o motivo
  @Column({ type: 'text', nullable: true })
  mensagem_erro: string;

  // Nova coluna para o token de tracking
  @Column({ nullable: true, unique: true })
  tracking_token: string;

  @Column({ name: 'fk_devedor' })
  fk_devedor: number;

  @Column({ name: 'fk_protesto' })
  fk_protesto: number;

  @Column({ name: 'fk_template', nullable: true }) // Nullable caso o log seja criado antes do envio
  fk_template: number;

  // Relacionamento Many-to-One com Devedor
  @ManyToOne(() => Devedor, (devedor) => devedor.notificacao, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'fk_devedor' })
  devedor: Devedor;

  // Relacionamento Many-to-One com DocProtesto
  @ManyToOne(() => DocProtesto, (docProtesto) => docProtesto.notificacao, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'fk_protesto' })
  protesto: DocProtesto;

  @ManyToOne(() => Template, (template) => template.notificacoes, {
    onDelete: 'SET NULL', // Se o template for deletado, não apague o log, apenas a relação
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'fk_template' })
  template: Template; // Propriedade para acessar o objeto Template

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização ()
  @UpdateDateColumn()
  updatedAt?: Date;
}
