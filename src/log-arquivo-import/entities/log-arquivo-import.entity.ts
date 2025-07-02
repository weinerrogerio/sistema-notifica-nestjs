import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity'; // ajuste o caminho conforme sua estrutura
import { StatusImportacao } from '../enum/log-arquivo.enum';

@Entity('log_arquivo_import')
export class LogImportacaoArquivo {
  @PrimaryGeneratedColumn()
  id: number;

  // alterar para unique --> nao pode importar o mesmo arquivo mais de uma vez
  @Column({ type: 'varchar', length: 255, unique: true })
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

  @CreateDateColumn()
  data_importacao: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  duracao: string; // formato: "00:01:23"

  // Relacionamento com usuário
  @ManyToOne(() => User)
  @JoinColumn({ name: 'fk_usuario' })
  usuario: User;

  @Column()
  fk_usuario: number;
}
