import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  contato: string;

  @Column()
  password_hash: string;

  @Column({ default: false })
  admin: boolean;

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt: Date;
  //data de atualização (data_registro)
  @UpdateDateColumn()
  updatedAt: Date;
}
