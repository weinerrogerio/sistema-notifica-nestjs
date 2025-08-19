import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity'; // ajuste o caminho conforme sua estrutura
import { StatusImportacao } from '../enum/log-arquivo.enum';
import { DocProtesto } from '@app/doc-protesto/entities/doc-protesto.entity';

@Entity('log_arquivo_import')
export class LogImportacaoArquivo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nome_arquivo: string;

  @Column({ type: 'varchar', length: 50 })
  mimetype: string;

  @Column({ type: 'bigint' })
  tamanho_arquivo: number; // em bytes

  @Column({
    type: 'enum',
    enum: StatusImportacao,
    default: StatusImportacao.SUCESSO,
  })
  status: StatusImportacao;

  @Column({ type: 'int', default: 0 })
  total_registros: number;

  @Column({ type: 'int', default: 0 })
  registros_processados: number;

  @Column({ type: 'int', default: 0 })
  registros_com_erro: number;

  @Column({ type: 'text', nullable: true })
  detalhes_erro: string; // JSON com detalhes dos erros

  @Column({ type: 'int', default: 0 })
  registros_duplicados: number; // total de registros duplicados

  @Column({ type: 'text', nullable: true })
  detalhes_duplicidade: string; // JSON com duplicidades

  @Column({ type: 'text', nullable: true })
  detalhes_progresso: string;

  @CreateDateColumn()
  data_importacao: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  duracao: string; // formato: "00:01:23"

  @Column()
  id_session: number;

  //Relacionamento com usuário
  @ManyToOne(() => User)
  @JoinColumn({ name: 'fk_usuario' })
  usuario: User;

  @Column()
  fk_usuario: number;

  @OneToMany(() => DocProtesto, (docProtesto) => docProtesto.file)
  registros: DocProtesto[];

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização (data_registro)
  @UpdateDateColumn()
  updatedAt?: Date;
}
