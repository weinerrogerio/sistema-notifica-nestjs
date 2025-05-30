import { DocProtesto } from '@app/doc-protesto/entities/doc-protesto.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('apresentante')
export class Apresentante {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  nome: string;

  @Column({ unique: true })
  cod_apresentante: string;

  //muitos para muitos com doc protesto(1:n - log_notificacao)
  //muitos para um --> um devedor pode ter muitas intimações (log_notificacao)
  // Um apresentante pode ter muitos documentos de protesto
  @OneToMany(() => DocProtesto, (docProtesto) => docProtesto.apresentante)
  documentos: DocProtesto[];

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização (data_registro)
  @UpdateDateColumn()
  updatedAt?: Date;
}
