import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateContatoTabelionatoDto } from './dto/create-contato-tabelionato.dto';
import { UpdateContatoTabelionatoDto } from './dto/update-contato-tabelionato.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ContatoTabelionato } from './entities/contato-tabelionato.entity';
import { Repository } from 'typeorm';

import { AddressValidator } from '../common';
import { isValidCNPJ, onlyNumbers } from '@brazilian-utils/brazilian-utils';

@Injectable()
export class ContatoTabelionatoService {
  constructor(
    @InjectRepository(ContatoTabelionato)
    private readonly contatoTabelionatoRepository: Repository<ContatoTabelionato>,
  ) {}

  async create(createContatoTabelionatoDto: CreateContatoTabelionatoDto) {
    try {
      // Validação CEP
      if (!AddressValidator.isValidCep(createContatoTabelionatoDto.cep)) {
        throw new BadRequestException(
          'CEP inválido. Formato esperado: 00000-000 ou 00000000',
        );
      }
      // Validação UF
      if (!AddressValidator.isValidUf(createContatoTabelionatoDto.uf)) {
        throw new BadRequestException(
          `UF inválida: ${createContatoTabelionatoDto.uf}`,
        );
      }
      // Validação CNPJ
      if (!isValidCNPJ(createContatoTabelionatoDto.cnpj)) {
        throw new BadRequestException(
          `CNPJ inválido: ${createContatoTabelionatoDto.cnpj}`,
        );
      }

      // Normalizar CNPJ
      createContatoTabelionatoDto.cnpj = onlyNumbers(
        createContatoTabelionatoDto.cnpj as string,
      );
      const newContatoTabelionatoDto = {
        nomeTabelionato: createContatoTabelionatoDto.nomeTabelionato,
        codTabelionato: createContatoTabelionatoDto.codTabelionato,
        cnpj: createContatoTabelionatoDto.cnpj,
        titular: createContatoTabelionatoDto.titular,
        telefone: createContatoTabelionatoDto.telefone,
        email: createContatoTabelionatoDto.email,
        endereco: createContatoTabelionatoDto?.endereco,
        cidade: createContatoTabelionatoDto?.cidade,
        uf: AddressValidator.normalizeUf(createContatoTabelionatoDto?.uf),
        cep: AddressValidator.normalizeCep(createContatoTabelionatoDto?.cep),
        observacao: createContatoTabelionatoDto?.observacao,
      };
      await this.contatoTabelionatoRepository.save(newContatoTabelionatoDto);
      return newContatoTabelionatoDto;
    } catch (error) {
      // Log interno para debug (não vai para o front-end)
      console.error('Erro ao criar contato:', error);
      // Se já é uma HttpException, apenas relança
      if (error instanceof HttpException) {
        throw error;
      }
      // Tratar erros de banco de dados
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new ConflictException('O código de tabelionato já está em uso');
      }
      // Erro genérico para casos não previstos
      throw new InternalServerErrorException('Erro interno do servidor');
    }
  }

  async findAll() {
    const contatoTabelionato = await this.contatoTabelionatoRepository.find({
      order: { id: 'desc' },
    });
    return contatoTabelionato;
  }

  async findOne(id: number) {
    const contatoTabelionato = await this.contatoTabelionatoRepository.findOne({
      where: { id: id },
    });
    return contatoTabelionato;
  }

  async update(
    id: number,
    updateContatoTabelionatoDto: UpdateContatoTabelionatoDto,
  ) {
    const dados = {
      codTabelionato: updateContatoTabelionatoDto.codTabelionato,
      nomeTabelionato: updateContatoTabelionatoDto.nomeTabelionato,
      cnpj: updateContatoTabelionatoDto.cnpj,
      titular: updateContatoTabelionatoDto.titular,
      telefone: updateContatoTabelionatoDto.telefone,
      email: updateContatoTabelionatoDto.email,
      endereco: updateContatoTabelionatoDto.endereco,
      cidade: updateContatoTabelionatoDto.cidade,
      uf: updateContatoTabelionatoDto.uf,
      cep: updateContatoTabelionatoDto.cep,
      observacao: updateContatoTabelionatoDto.observacao,
    };
    const dadosTabelionato = await this.contatoTabelionatoRepository.preload({
      id,
      ...dados,
    });

    if (!dadosTabelionato) {
      throw new NotFoundException(`Dados de tabelionato não encontrados ${id}`);
    }

    return this.contatoTabelionatoRepository.save(dadosTabelionato);
  }

  async remove(id: number) {
    const contatoTabelionato = await this.findOne(id);
    return this.contatoTabelionatoRepository.remove(contatoTabelionato);
  }
}
