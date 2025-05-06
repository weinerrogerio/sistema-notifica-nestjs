import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Devedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  doc_devedor: string;

  @Column()
  email: string;

  @Column()
  devedor_pj: boolean;

  /* //muitos para um
    @ManyToOne(() => Pessoa, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    //especifica a coluna "de" que armazena o ID da pessoa que enviou o recado
    @JoinColumn({ name: 'de' })
    de: Pessoa;
   */
  @CreateDateColumn()
  createdAt?: Date;
  @CreateDateColumn()
  updatedAt?: Date;
}
