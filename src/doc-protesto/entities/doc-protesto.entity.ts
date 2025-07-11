import { Apresentante } from '@app/apresentante/entities/apresentante.entity';
import { DocProtestoCredor } from '@app/doc-protesto-credor/entities/doc-protesto-credor.entity';
import { LogImportacaoArquivo } from '@app/log-arquivo-import/entities/log-arquivo-import.entity';
import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('doc_protesto')
@Index(
  'idx_doc_protesto_unique',
  [
    'num_distribuicao',
    'cart_protesto',
    'num_titulo',
    'fk_apresentante',
    'vencimento',
  ],
  { unique: true },
)
export class DocProtesto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  data_apresentacao: Date;

  @Column()
  num_distribuicao: string;

  @Column()
  data_distribuicao: Date;

  @Column()
  cart_protesto: string;

  @Column()
  num_titulo: string;

  @Column({ default: 0 })
  valor: number;

  @Column({ default: 0 })
  saldo: number;

  @Column({ nullable: true })
  vencimento: string; // data astring pois pode ser "a vista"

  //RELAÇÃO COM ARQUIIVO --> um arquivo tem muitos registros
  @Column()
  fk_file: number;
  @ManyToOne(() => LogImportacaoArquivo, (file) => file.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'fk_file' })
  file: LogImportacaoArquivo;

  //FAZER RELAÇÃO COM OUTRAS TABELAS depois
  @Column()
  fk_apresentante: number;
  //muitos para muitos com devedores(1:n -- log_notificacao:n)
  //muitos para um --> um protesto pode ter muitos devedores
  // Relacionamento Many-to-One com Apresentante
  @ManyToOne(() => Apresentante, (apresentante) => apresentante.documentos, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'fk_apresentante' })
  apresentante: Apresentante;

  // Um documento de protesto pode ter muitas notificações
  @OneToMany(() => LogNotificacao, (logNotificacao) => logNotificacao.protesto)
  notificacao: LogNotificacao[];

  // Um documento de protesto pode ter muitos credores associados
  @OneToMany(
    () => DocProtestoCredor,
    (docProtestoCredor) => docProtestoCredor.protesto,
  )
  credores: DocProtestoCredor[];

  //data de criação (data_registro)
  @CreateDateColumn()
  createdAt?: Date;
  //data de atualização (data_registro)
  @UpdateDateColumn()
  updatedAt?: Date;
}
