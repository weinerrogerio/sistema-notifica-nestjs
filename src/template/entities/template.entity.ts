import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('template')
@Index(['ativo'])
@Index(['ehPadrao'])
@Index(['nomeArquivo'])
export class Template {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  nomeArquivo: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  descricao: string;

  @Column({
    nullable: false,
  })
  conteudoHtml: string;

  @Column({
    type: 'bigint',
    default: 0,
  })
  tamanhoArquivo: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'text/html',
  })
  tipoMime: string;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: 'Hash SHA-256 para verificação de integridade',
  })
  hashConteudo: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  ehPadrao: boolean;

  @Column({
    type: 'boolean',
    default: true,
  })
  ativo: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  criadoEm: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  atualizadoEm: Date;

  // Relacionamentos --> fazer relacionamento com sessão
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Usuário que criou o template',
  })
  criadoPor: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Usuário que fez a última modificação',
  })
  modificadoPor: string;
}
