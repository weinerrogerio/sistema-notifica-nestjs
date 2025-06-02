import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { CreateDevedorDto } from './dto/create-devedor.dto';
import { UpdateDevedorDto } from './dto/update-devedor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Devedor } from './entities/devedor.entity';
import { Repository } from 'typeorm';
import { EmailLookupService } from '@app/email-lookup/email-lookup.service';
import {
  EmailResult,
  EmailUpdateResult,
} from '@app/common/interfaces/email.interface';

@Injectable()
export class DevedorService {
  private readonly logger = new Logger(DevedorService.name);
  constructor(
    @InjectRepository(Devedor)
    private readonly devedorRepository: Repository<Devedor>,
    private readonly emailLookupService: EmailLookupService,
  ) {}
  async create(createDevedorDto: CreateDevedorDto) {
    try {
      const newDevedorDto = {
        nome: createDevedorDto?.nome,
        doc_devedor: createDevedorDto?.doc_devedor,
        devedor_pj: createDevedorDto?.devedor_pj,
      };
      const newDevedor = this.devedorRepository.create(newDevedorDto);
      await this.devedorRepository.save(newDevedor);
      return newDevedor;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new ConflictException('Email ja cadastrado');
      }
      throw error;
    }
  }

  async findOrCreate(createDevedorDto: CreateDevedorDto) {
    try {
      // Primeiro, tenta encontrar o devedor pelo documento
      const existingDevedor = await this.findOneByDoc(
        createDevedorDto.doc_devedor,
      );
      // Se o devedor já existe, retorna ele
      if (existingDevedor) {
        return existingDevedor;
      }
      // Se não existe, cria um novo
      return await this.create(createDevedorDto);
    } catch (error) {
      // Ainda mantemos o tratamento de erro para caso ocorra outro tipo de erro
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new ConflictException('Devedor já cadastrado');
      }
      throw error;
    }
  }

  async findOneByDoc(doc_devedor: string) {
    const devedor = await this.devedorRepository.findOne({
      where: { doc_devedor: doc_devedor },
    });
    return devedor;
  }

  async findOneBrEmail(email: string) {
    const devedor = await this.devedorRepository.findOne({
      where: { email: email },
    });
    return devedor;
  }
  async findOneByPj() {
    const devedor = await this.devedorRepository.findOne({
      where: { email: null, devedor_pj: true },
    });
    return devedor;
  }

  async findOneAllByPj() {
    const devedor = await this.devedorRepository.find({
      where: { email: null, devedor_pj: true },
    });
    return devedor;
  }

  async findOne(id: number) {
    const devedor = await this.devedorRepository.findOne({ where: { id: id } });
    if (!devedor || !devedor.id) throw new Error('Usuário não encontrado');
    return devedor;
  }

  findAll() {
    return `This action returns all devedor`;
  }
  update(id: number, updateDevedorDto: UpdateDevedorDto) {
    console.log(updateDevedorDto);

    return `This action updates a #${id} devedor`;
  }

  remove(id: number) {
    return `This action removes a #${id} devedor`;
  }

  async updateEmail(
    resultadosEmails: EmailResult[],
  ): Promise<EmailUpdateResult[]> {
    const updates: EmailUpdateResult[] = [];

    for (const resultado of resultadosEmails) {
      if (resultado.email) {
        try {
          // Encontrar o devedor pelo CNPJ
          const devedor = await this.devedorRepository.findOne({
            where: { doc_devedor: resultado.cnpj },
          });

          if (devedor) {
            // Atualizar o email
            await this.devedorRepository.update(
              { id: devedor.id },
              { email: resultado.email },
            );

            updates.push({
              id: devedor.id,
              cnpj: devedor.doc_devedor,
              email: resultado.email,
            });
          } else {
            this.logger.warn(
              `Devedor não encontrado para CNPJ: ${resultado.cnpj}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Erro ao atualizar email para CNPJ ${resultado.cnpj}:`,
            error,
          );
        }
      }
    }

    this.logger.log(`${updates.length} emails atualizados`);
    return updates;
  }

  //função para buscar email de um devedor pelo documento - CNPJ
  // Apenas buscar emails (sem salvar)
  async buscarEmailsDevedores() {
    this.logger.log('Iniciando busca de emails para devedores');

    // Buscar devedores PJ no banco
    const devedores = await this.findOneAllByPj();
    console.log('devedores: ', devedores);

    if (!devedores) {
      return {
        emails: [],
        estatisticas: {
          total: 0,
          encontrados: 0,
          naoEncontrados: 0,
          taxaSucesso: '0%',
        },
      };
    }

    // Extrair CNPJs
    const cnpjs = devedores.map((d) => d.doc_devedor);
    console.log('cnpjs: ', cnpjs);

    // Buscar emails nas APIs externas
    const resultadosEmails: EmailResult[] =
      await this.emailLookupService.buscarEmailsPorCNPJs(cnpjs);

    // Salvar emails no banco
    const emailsAtualizados = await this.updateEmail(resultadosEmails);

    // Combinar dados
    const devedoresComEmail = this.combinarDevedoresComEmails(
      devedores,
      resultadosEmails,
    );

    // Estatísticas
    const estatisticas =
      this.emailLookupService.gerarEstatisticas(resultadosEmails);

    return {
      emails: devedoresComEmail,
      emailsAtualizados, // opcional: retornar quais foram atualizados
      estatisticas,
    };
  }

  //async findEmailsDevAndSave() {}

  private combinarDevedoresComEmails(
    devedores: Devedor[],
    emails: EmailResult[],
  ): Array<{
    id: number;
    cnpj: string;
    nome: string;
    email: string | null;
    fonte: string | null;
    dataBusca: Date;
  }> {
    return devedores.map((devedor) => {
      const emailEncontrado = emails.find(
        (e) =>
          e.cnpj.replace(/[^\d]/g, '') ===
          devedor.doc_devedor.replace(/[^\d]/g, ''),
      );

      return {
        id: devedor.id,
        cnpj: devedor.doc_devedor,
        nome: devedor.nome,
        email: emailEncontrado?.email || null,
        fonte: emailEncontrado?.fonte || null,
        dataBusca: new Date(),
      };
    });
  }
}
