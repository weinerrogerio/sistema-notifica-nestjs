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
  //ATENÇÃO: para salvar tem de existir um apresntenta pois ele associa o protesto ao apresentante
  //relacionamento apresentante:doc-protesto(1:n)
  async create(createDocProtestoDto: CreateDocProtestoDto) {
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
      /* throw new Error(
          'Falha ao processar os dados importados para Documento de protesto.',
        ); */
      throw new BadRequestException(
        `Falha ao processar os dados importados para Documento de protesto.  ${createDocProtestoDto}       ${error}   `,
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
  findOne(id: number) {
    return `This action returns a #${id} docProtesto`;
  }

  update(id: number, updateDocProtestoDto: UpdateDocProtestoDto) {
    console.log(updateDocProtestoDto);

    return `This action updates a #${id} docProtesto`;
  }

  remove(id: number) {
    return `This action removes a #${id} docProtesto`;
  }
}
