import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BusinessLogicException,
  BusinessError,
} from '../shared/errors/business-errors';
import { Repository } from 'typeorm';
import { ProductoEntity } from './producto.entity';
import { TipoProducto } from './tipo-producto.enum';

@Injectable()
export class ProductoService {
  private readonly productoNoEncontrado =
    'El producto con el id dado no fue encontrado';
  private readonly tipoNoValido = 'El tipo de producto no es valido';

  constructor(
    @InjectRepository(ProductoEntity)
    private readonly productoRepository: Repository<ProductoEntity>,
  ) {}

  async findAll(): Promise<ProductoEntity[]> {
    return await this.productoRepository.find();
  }

  async findOne(id: string): Promise<ProductoEntity> {
    const producto: ProductoEntity = await this.productoRepository.findOne({
      where: { id },
      relations: ['tiendas'],
    });
    if (!producto)
      throw new BusinessLogicException(
        this.productoNoEncontrado,
        BusinessError.NOT_FOUND,
      );
    return producto;
  }

  async create(producto: ProductoEntity): Promise<ProductoEntity> {
    this.checkType(producto);
    return await this.productoRepository.save(producto);
  }

  async update(id: string, producto: ProductoEntity): Promise<ProductoEntity> {
    const persistedProducto: ProductoEntity =
      await this.productoRepository.findOne({ where: { id } });
    if (!persistedProducto)
      throw new BusinessLogicException(
        this.productoNoEncontrado,
        BusinessError.NOT_FOUND,
      );
    this.checkType(producto);
    return await this.productoRepository.save({
      ...persistedProducto,
      ...producto,
    });
  }

  async delete(id: string) {
    const producto: ProductoEntity = await this.productoRepository.findOne({
      where: { id },
    });
    if (!producto)
      throw new BusinessLogicException(
        this.productoNoEncontrado,
        BusinessError.NOT_FOUND,
      );

    await this.productoRepository.remove(producto);
  }

  private checkType(producto: ProductoEntity) {
    if (
      producto.tipo != TipoProducto.PERECEDERO &&
      producto.tipo != TipoProducto.NOPERECEDERO
    )
      throw new BusinessLogicException(
        this.tipoNoValido,
        BusinessError.PRECONDITION_FAILED,
      );
  }
}
