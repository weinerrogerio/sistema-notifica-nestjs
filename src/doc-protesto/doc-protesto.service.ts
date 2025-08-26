import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDocProtestoDto } from './dto/create-doc-protesto.dto';
import { UpdateDocProtestoDto } from './dto/update-doc-protesto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DocProtesto } from './entities/doc-protesto.entity';
import { Between, Repository } from 'typeorm';

@Injectable()
export class DocProtestoService {
  constructor(
    @InjectRepository(DocProtesto)
    private readonly docProtestoRepository: Repository<DocProtesto>,
  ) {}
  //ATENÇÃO: para salvar tem de existir um apresntente pois ele associa o /distribuição ao apresentante
  //relacionamento apresentante:doc-protesto(1:n)
  /* async create(createDocProtestoDto: CreateDocProtestoDto) {
    try {
      const existingDocProtesto = await this.docProtestoRepository.findOne({
        where: {
          num_distribuicao: createDocProtestoDto.num_distribuicao,
          cart_protesto: createDocProtestoDto.cart_protesto,
          num_titulo: createDocProtestoDto.num_titulo,
          fk_apresentante: createDocProtestoDto.fk_apresentante,
          vencimento: createDocProtestoDto.vencimento,
          // Adicione outros campos que, combinados, definem a unicidade
          // Por exemplo, para um protesto único:
          // data_apresentacao: createDocProtestoDto.data_apresentacao,
          // cart_protesto: createDocProtestoDto.cart_protesto,
        },
      });

      if (existingDocProtesto) {
        // Se um registro duplicado for encontrado, lançar uma exceção específica
        throw new BadRequestException(
          `Registro duplicado: Título '${createDocProtestoDto.num_titulo}' do apresentante '${createDocProtestoDto.fk_apresentante}' já existe.`,
        );
      }

      const newDocProtestoDto = {
        data_apresentacao: createDocProtestoDto.data_apresentacao,
        num_distribuicao: createDocProtestoDto.num_distribuicao,
        data_distribuicao: createDocProtestoDto.data_distribuicao,
        cart_protesto: createDocProtestoDto.cart_protesto,
        num_titulo: createDocProtestoDto.num_titulo,
        valor: createDocProtestoDto.valor,
        saldo: createDocProtestoDto.saldo,
        vencimento: createDocProtestoDto.vencimento,
        fk_file: createDocProtestoDto.fk_file,
        fk_apresentante: createDocProtestoDto.fk_apresentante,
      };

      if (newDocProtestoDto) {
        // Se um registro duplicado for encontrado, lançar uma exceção específica
        throw new BadRequestException(
          `Registro duplicado: Título '${createDocProtestoDto.num_titulo}' do apresentante '${createDocProtestoDto.fk_apresentante}' já existe.`,
        );
      }

      const newDocProtesto =
        this.docProtestoRepository.create(newDocProtestoDto);
      return await this.docProtestoRepository.save(newDocProtesto);
    } catch (error) {
      console.log(error);
      
      throw new BadRequestException(
        `Falha ao processar os dados importados para Documento de protesto.  ${createDocProtestoDto}       ${error}   `,
      );
    }
  } */

  // Nova função para busca em lote de registros únicos
  async findByUniqueKeys(uniqueKeys: string[]): Promise<DocProtesto[]> {
    if (uniqueKeys.length === 0) return [];

    // Criar condições WHERE para busca em lote
    const whereConditions = uniqueKeys.map((key) => {
      const [
        num_distribuicao,
        cart_protesto,
        num_titulo,
        apresentante,
        vencimento,
      ] = key.split('|');
      return {
        num_distribuicao,
        cart_protesto,
        num_titulo,
        vencimento,
        // Buscar por apresentante através do relacionamento
        apresentante: apresentante ? { nome: apresentante } : undefined,
      };
    });

    // Usar IN ou OR para buscar todos de uma vez
    const queryBuilder = this.docProtestoRepository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.apresentante', 'apresentante');

    // Adicionar condições OR para cada registro único
    whereConditions.forEach((condition, index) => {
      const paramPrefix = `param${index}`;
      if (index === 0) {
        queryBuilder.where(`(
          doc.num_distribuicao = :${paramPrefix}_dist AND 
          doc.cart_protesto = :${paramPrefix}_cart AND 
          doc.num_titulo = :${paramPrefix}_titulo AND 
          doc.vencimento = :${paramPrefix}_venc
          ${condition.apresentante ? `AND apresentante.nome = :${paramPrefix}_apres` : ''}
        )`);
      } else {
        queryBuilder.orWhere(`(
          doc.num_distribuicao = :${paramPrefix}_dist AND 
          doc.cart_protesto = :${paramPrefix}_cart AND 
          doc.num_titulo = :${paramPrefix}_titulo AND 
          doc.vencimento = :${paramPrefix}_venc
          ${condition.apresentante ? `AND apresentante.nome = :${paramPrefix}_apres` : ''}
        )`);
      }

      // Definir parâmetros
      queryBuilder.setParameter(
        `${paramPrefix}_dist`,
        condition.num_distribuicao,
      );
      queryBuilder.setParameter(`${paramPrefix}_cart`, condition.cart_protesto);
      queryBuilder.setParameter(`${paramPrefix}_titulo`, condition.num_titulo);
      queryBuilder.setParameter(`${paramPrefix}_venc`, condition.vencimento);
      if (condition.apresentante) {
        queryBuilder.setParameter(
          `${paramPrefix}_apres`,
          condition.apresentante.nome,
        );
      }
    });

    return await queryBuilder.getMany();
  }

  // Função create simplificada (sem verificação de duplicidade)
  async create(createDocProtestoDto: CreateDocProtestoDto) {
    try {
      const newDocProtesto =
        this.docProtestoRepository.create(createDocProtestoDto);
      return await this.docProtestoRepository.save(newDocProtesto);
    } catch (error) {
      // Se der erro de constraint unique, será capturado aqui
      if (error.code === '23505') {
        // PostgreSQL unique violation
        throw new BadRequestException(
          `Registro duplicado: Distribuição '${createDocProtestoDto.num_distribuicao}' já existe.`,
        );
      }
      throw new BadRequestException(
        `Falha ao processar documento de protesto: ${error.message}`,
      );
    }
  }

  async findAll() {
    return await this.docProtestoRepository.find({
      order: { id: 'desc' },
    });
  }

  async findByDateRange(startDate?: Date, endDate?: Date) {
    console.log('Service - parâmetros recebidos:', { startDate, endDate });

    // Verificar se as datas são válidas
    if (startDate && isNaN(startDate.getTime())) {
      throw new Error('startDate inválida');
    }
    if (endDate && isNaN(endDate.getTime())) {
      throw new Error('endDate inválida');
    }

    // Usar datas atuais se nenhuma for fornecida
    if (!startDate || !endDate) {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 15);
      console.log('Usando período padrão:', { startDate, endDate });
    }

    // Ajustar para início e fim do dia
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Período final de busca:', { startOfDay, endOfDay });

    return await this.docProtestoRepository.find({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
      order: { createdAt: 'ASC' },
    });
  }

  async findByDateRangeAllData(startDate?: Date, endDate?: Date) {
    // Verificar se as datas são válidas
    if (startDate && isNaN(startDate.getTime())) {
      throw new Error('startDate inválida');
    }
    if (endDate && isNaN(endDate.getTime())) {
      throw new Error('endDate inválida');
    }

    // Usar datas atuais se nenhuma for fornecida
    if (!startDate || !endDate) {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 15);
      console.log('Usando período padrão:', { startDate, endDate });
    }

    // Ajustar para início e fim do dia
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return await this.docProtestoRepository
      .createQueryBuilder('doc')
      // Relacionamento com apresentante
      .leftJoinAndSelect('doc.apresentante', 'apresentante')
      // Relacionamento com arquivo de importação
      .leftJoinAndSelect('doc.file', 'file')
      // Relacionamento com credores (através da tabela de junção)
      .leftJoinAndSelect('doc.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor')
      // Relacionamento com notificações e seus devedores
      .leftJoinAndSelect('doc.notificacao', 'logNotificacao')
      .leftJoinAndSelect('logNotificacao.devedor', 'devedor')
      // Filtro por data de distribuição
      .where('doc.createdAt BETWEEN :start AND :end', {
        start,
        end,
      })
      // Ordenar por data mais recente
      .orderBy('doc.data_distribuicao', 'DESC')
      .getMany();
  }

  async findByDateRangeDistAllData(startDate?: Date, endDate?: Date) {
    // Verificar se as datas são válidas
    if (startDate && isNaN(startDate.getTime())) {
      throw new Error('startDate inválida');
    }
    if (endDate && isNaN(endDate.getTime())) {
      throw new Error('endDate inválida');
    }

    // Usar datas atuais se nenhuma for fornecida
    if (!startDate || !endDate) {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 15);
      console.log('Usando período padrão:', { startDate, endDate });
    }

    // Ajustar para início e fim do dia
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return await this.docProtestoRepository
      .createQueryBuilder('doc')
      // Relacionamento com apresentante
      .leftJoinAndSelect('doc.apresentante', 'apresentante')
      // Relacionamento com arquivo de importação
      .leftJoinAndSelect('doc.file', 'file')
      // Relacionamento com credores (através da tabela de junção)
      .leftJoinAndSelect('doc.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor')
      // Relacionamento com notificações e seus devedores
      .leftJoinAndSelect('doc.notificacao', 'logNotificacao')
      .leftJoinAndSelect('logNotificacao.devedor', 'devedor')
      // Filtro por data de distribuição
      .where('doc.data_distribuicao BETWEEN :start AND :end', {
        start,
        end,
      })
      // Ordenar por data mais recente
      .orderBy('doc.data_distribuicao', 'DESC')
      .getMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} docProtesto`;
  }

  update(id: number, updateDocProtestoDto: UpdateDocProtestoDto) {
    console.log(updateDocProtestoDto);

    return `This action updates a #${id} docProtesto`;
  }

  async remove(id: number) {
    return await this.docProtestoRepository.delete(id);
  }

  async removeAllByFile(id: number) {
    // Use o Query Builder para garantir que o 'where' seja aceito
    return await this.docProtestoRepository
      .createQueryBuilder()
      .delete()
      .from(DocProtesto)
      .where('fk_file = :id', { id: id })
      .execute();
  }
}
