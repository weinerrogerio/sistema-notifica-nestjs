import {
  Column,
  CreateDateColumn,
  Entity,
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

  //fazer logica relação muitos para um com doc protesto
  @Column()
  fk_doc_protesto: number;

  /* //muitos para um
    @ManyToOne(() => Pessoa, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    //especifica a coluna "de" que armazena o ID da pessoa que enviou o recado
    @JoinColumn({ name: 'de' })
    de: Pessoa;
   */
  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização (data_registro)
  @UpdateDateColumn()
  updatedAt?: Date;
}
