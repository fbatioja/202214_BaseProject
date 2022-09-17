import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BusinessLogicException,
  BusinessError,
} from '../shared/errors/business-errors';
import { Repository } from 'typeorm';
import { TiendaEntity } from './tienda.entity';

@Injectable()
export class TiendaService {
  private readonly tiendaNoEncontrado =
    'La tienda con el id dado no fue encontrado';
  private readonly ciudadNoValida =
    'La ciudad debe ser un codigo de 3 caracteres';

  constructor(
    @InjectRepository(TiendaEntity)
    private readonly tiendaRepository: Repository<TiendaEntity>,
  ) {}

  async findAll(): Promise<TiendaEntity[]> {
    return await this.tiendaRepository.find();
  }

  async findOne(id: string): Promise<TiendaEntity> {
    const tienda: TiendaEntity = await this.tiendaRepository.findOne({
      where: { id },
      relations: ['productos'],
    });
    if (!tienda)
      throw new BusinessLogicException(
        this.tiendaNoEncontrado,
        BusinessError.NOT_FOUND,
      );
    return tienda;
  }

  async create(tienda: TiendaEntity): Promise<TiendaEntity> {
    this.checkCodeCity(tienda);
    return await this.tiendaRepository.save(tienda);
  }

  async update(id: string, tienda: TiendaEntity): Promise<TiendaEntity> {
    const persistedTienda: TiendaEntity = await this.tiendaRepository.findOne({
      where: { id },
    });
    if (!persistedTienda)
      throw new BusinessLogicException(
        this.tiendaNoEncontrado,
        BusinessError.NOT_FOUND,
      );
    this.checkCodeCity(tienda);

    return await this.tiendaRepository.save({
      ...persistedTienda,
      ...tienda,
    });
  }

  async delete(id: string) {
    const tienda: TiendaEntity = await this.tiendaRepository.findOne({
      where: { id },
    });
    if (!tienda)
      throw new BusinessLogicException(
        this.tiendaNoEncontrado,
        BusinessError.NOT_FOUND,
      );

    await this.tiendaRepository.remove(tienda);
  }

  private checkCodeCity(tienda: TiendaEntity) {
    if (tienda.ciudad.length !== 3)
      throw new BusinessLogicException(
        this.ciudadNoValida,
        BusinessError.PRECONDITION_FAILED,
      );
  }
}
