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

@Entity()
export class LogNotificacao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email_enviado: boolean;

  @Column({ nullable: true })
  data_envio: Date;

  @Column()
  lido: boolean;

  // Nova coluna para armazenar quando foi lido
  @Column({ nullable: true })
  data_leitura: Date;

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
