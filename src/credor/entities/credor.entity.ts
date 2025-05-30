import { DocProtestoCredor } from '@app/doc-protesto-credor/entities/doc-protesto-credor.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('credor')
export class Credor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  sacador: string;

  @Column({ nullable: true })
  cedente: string;

  @Column({ nullable: false })
  doc_credor: string;

  // Um credor pode estar em muitos relacionamentos doc_protesto_credor
  @OneToMany(
    () => DocProtestoCredor,
    (docProtestoCredor) => docProtestoCredor.credor,
  )
  documentosProtesto: DocProtestoCredor[];

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização (data_registro)
  @UpdateDateColumn()
  updatedAt?: Date;
}
