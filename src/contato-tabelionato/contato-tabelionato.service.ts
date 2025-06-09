import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
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

  findAll() {
    return `This action returns all contatoTabelionato`;
  }

  findOne(id: number) {
    return `This action returns a #${id} contatoTabelionato`;
  }

  update(id: number, updateContatoTabelionatoDto: UpdateContatoTabelionatoDto) {
    console.log(updateContatoTabelionatoDto);
    return `This action updates a #${id} contatoTabelionato::: ${updateContatoTabelionatoDto}`;
  }

  remove(id: number) {
    return `This action removes a #${id} contatoTabelionato`;
  }
}
