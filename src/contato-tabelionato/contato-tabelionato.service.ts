import { Injectable } from '@nestjs/common';
import { CreateContatoTabelionatoDto } from './dto/create-contato-tabelionato.dto';
import { UpdateContatoTabelionatoDto } from './dto/update-contato-tabelionato.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ContatoTabelionato } from './entities/contato-tabelionato.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ContatoTabelionatoService {
  constructor(
    @InjectRepository(ContatoTabelionato)
    private readonly contatoTabelionatoRepository: Repository<ContatoTabelionato>,
  ) {}

  async create(createContatoTabelionatoDto: CreateContatoTabelionatoDto) {
    const newContatoTabelionatoDto = {
      nomeTabelionato: createContatoTabelionatoDto.nomeTabelionato,
      codTabelionato: createContatoTabelionatoDto.codTabelionato,
      cnpj: createContatoTabelionatoDto?.cnpj,
      titular: createContatoTabelionatoDto.titular,
      telefone: createContatoTabelionatoDto.telefone,
      email: createContatoTabelionatoDto.email,
      endereco: createContatoTabelionatoDto?.endereco,
      cidade: createContatoTabelionatoDto?.cidade,
      uf: createContatoTabelionatoDto?.uf,
      cep: createContatoTabelionatoDto?.cep,
      observacao: createContatoTabelionatoDto?.observacao,
    };
    /* const newContatoTabelionato = this.contatoTabelionatoRepository.create(
      newContatoTabelionatoDto,
    ); */
    await this.contatoTabelionatoRepository.save(newContatoTabelionatoDto);
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
