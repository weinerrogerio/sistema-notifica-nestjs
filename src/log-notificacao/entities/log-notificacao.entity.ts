import { Devedor } from '@app/devedor/entities/devedor.entity';
import { DocProtesto } from '@app/doc-protesto/entities/doc-protesto.entity';
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

  @Column({ name: 'fk_devedor' })
  fk_devedor: number;

  @Column({ name: 'fk_protesto' })
  fk_protesto: number;

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

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização ()
  @UpdateDateColumn()
  updatedAt?: Date;
}
