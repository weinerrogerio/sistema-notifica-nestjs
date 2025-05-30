import { Credor } from '@app/credor/entities/credor.entity';
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

@Entity('doc_protesto_credor')
export class DocProtestoCredor {
  @PrimaryGeneratedColumn()
  id: number;

  // Colunas para armazenar os IDs das chaves estrangeiras
  @Column()
  fk_credor: number;

  @Column()
  fk_protesto: number;

  // Relacionamento Many-to-One com Credor
  @ManyToOne(() => Credor, (credor) => credor.documentosProtesto, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'fk_credor' })
  credor: Credor;

  // Relacionamento Many-to-One com DocProtesto
  @ManyToOne(() => DocProtesto, (docProtesto) => docProtesto.credores, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'fk_protesto' })
  protesto: DocProtesto;

  /* // criar as chaves estrangeiras
  @Column()
  fk_credor: number;
 */
  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização (data_registro)
  @UpdateDateColumn()
  updatedAt?: Date;
}
