import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductoEntity } from '../producto/producto.entity';
import { TipoProducto } from '../producto/tipo-producto.enum';
import { TiendaEntity } from '../tienda/tienda.entity';
import { Repository } from 'typeorm';
import { ProductoTiendaService } from './producto-tienda.service';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';

describe('ProductoTiendaService', () => {
  let service: ProductoTiendaService;
  let productoRepository: Repository<ProductoEntity>;
  let tiendaRepository: Repository<TiendaEntity>;
  let producto: ProductoEntity;
  let tiendasList: TiendaEntity[];
  const productoNoEncontrado = 'El producto con el id dado no fue encontrado';
  const tiendaNoEncontrado = 'La tienda con el id dado no fue encontrado';
  const tiendaNoAsociada =
    'La tienda con el Id dado no esta asociada al producto';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [ProductoTiendaService],
    }).compile();

    service = module.get<ProductoTiendaService>(ProductoTiendaService);
    productoRepository = module.get<Repository<ProductoEntity>>(
      getRepositoryToken(ProductoEntity),
    );
    tiendaRepository = module.get<Repository<TiendaEntity>>(
      getRepositoryToken(TiendaEntity),
    );
    await seedDatabase();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const seedDatabase = async () => {
    tiendaRepository.clear();
    productoRepository.clear();

    tiendasList = [];
    for (let i = 0; i < 5; i++) {
      const tienda: TiendaEntity = await tiendaRepository.save({
        nombre: faker.company.name(),
        ciudad: 'BOG',
        direccion: faker.address.streetAddress(),
        productos: [],
      });
      tiendasList.push(tienda);
    }

    producto = await productoRepository.save({
      nombre: faker.commerce.product(),
      precio: Number(faker.commerce.price()),
      tipo: TipoProducto.PERECEDERO,
      tiendas: tiendasList,
    });
  };

  it('addStoreToProduct deberia asociar una tienda a un producto', async () => {
    const tiendaNuevo: TiendaEntity = await tiendaRepository.save({
      nombre: faker.company.name(),
      ciudad: 'BOG',
      direccion: faker.address.streetAddress(),
      productos: [],
    });

    const productoNuevo: ProductoEntity = await productoRepository.save({
      nombre: faker.commerce.product(),
      precio: Number(faker.commerce.price()),
      tipo: TipoProducto.PERECEDERO,
      tiendas: [],
    });

    const result: ProductoEntity = await service.addStoreToProduct(
      productoNuevo.id,
      tiendaNuevo.id,
    );

    expect(result.tiendas.length).toBe(1);
    expect(result.tiendas[0]).not.toBeNull();
    expect(result.tiendas[0].nombre).toBe(tiendaNuevo.nombre);
    expect(result.tiendas[0].ciudad).toBe(tiendaNuevo.ciudad);
    expect(result.tiendas[0].direccion).toBe(tiendaNuevo.direccion);
  });

  it('addStoreToProduct deberia lanzar una excepcion por una tienda invalido', async () => {
    const productoNuevo: ProductoEntity = await productoRepository.save({
      nombre: faker.commerce.product(),
      precio: Number(faker.commerce.price()),
      tipo: TipoProducto.PERECEDERO,
      tiendas: [],
    });

    await expect(() =>
      service.addStoreToProduct(productoNuevo.id, '0'),
    ).rejects.toHaveProperty('message', tiendaNoEncontrado);
  });

  it('addStoreToProduct deberia lanzar una excepcion por un producto invalido', async () => {
    const tiendaNuevo: TiendaEntity = await tiendaRepository.save({
      nombre: faker.company.name(),
      ciudad: 'BOG',
      direccion: faker.address.streetAddress(),
      productos: [],
    });

    await expect(() =>
      service.addStoreToProduct('0', tiendaNuevo.id),
    ).rejects.toHaveProperty('message', productoNoEncontrado);
  });

  it('findStoreFromProduct deberia retornar una tienda por producto', async () => {
    const tienda: TiendaEntity = tiendasList[0];
    const tiendaAlmacenado: TiendaEntity = await service.findStoreFromProduct(
      producto.id,
      tienda.id,
    );
    expect(tiendaAlmacenado).not.toBeNull();
    expect(tiendaAlmacenado.nombre).toBe(tienda.nombre);
    expect(tiendaAlmacenado.ciudad).toBe(tienda.ciudad);
    expect(tiendaAlmacenado.direccion).toBe(tienda.direccion);
  });

  it('findStoreFromProduct deberia lanzar una excepcion por una tienda invalido', async () => {
    await expect(() =>
      service.findStoreFromProduct(producto.id, '0'),
    ).rejects.toHaveProperty('message', tiendaNoEncontrado);
  });

  it('findStoreFromProduct deberia lanzar una excepcion por un producto invalido', async () => {
    const tienda: TiendaEntity = tiendasList[0];
    await expect(() =>
      service.findStoreFromProduct('0', tienda.id),
    ).rejects.toHaveProperty('message', productoNoEncontrado);
  });

  it('findStoreFromProduct deberia lanzar una excepcion por una tienda no asociada al producto', async () => {
    const tiendaNuevo: TiendaEntity = await tiendaRepository.save({
      nombre: faker.company.name(),
      ciudad: 'BOG',
      direccion: faker.address.streetAddress(),
      productos: [],
    });

    await expect(() =>
      service.findStoreFromProduct(producto.id, tiendaNuevo.id),
    ).rejects.toHaveProperty('message', tiendaNoAsociada);
  });

  it('findStoresFromProduct deberia retornar las tiendas de un producto', async () => {
    const tiendas: TiendaEntity[] = await service.findStoresFromProduct(
      producto.id,
    );
    expect(tiendas.length).toBe(5);
  });

  it('findStoresFromProduct deberia lanzar una excepcion por un producto invalido', async () => {
    await expect(() =>
      service.findStoresFromProduct('0'),
    ).rejects.toHaveProperty('message', productoNoEncontrado);
  });

  it('updateStoresFromProduct deberia actualizar la lista de tiendas para un producto', async () => {
    const tiendaNuevo: TiendaEntity = await tiendaRepository.save({
      nombre: faker.company.name(),
      ciudad: 'BOG',
      direccion: faker.address.streetAddress(),
      productos: [],
    });

    const updatedProducto: ProductoEntity =
      await service.updateStoresFromProduct(producto.id, [tiendaNuevo]);
    expect(updatedProducto.tiendas.length).toBe(1);

    expect(updatedProducto.tiendas[0].nombre).toBe(tiendaNuevo.nombre);
    expect(updatedProducto.tiendas[0].ciudad).toBe(tiendaNuevo.ciudad);
    expect(updatedProducto.tiendas[0].direccion).toBe(tiendaNuevo.direccion);
  });

  it('updateStoresFromProduct deberia lanzar una excepcion por un producto invalido', async () => {
    const tiendaNuevo: TiendaEntity = await tiendaRepository.save({
      nombre: faker.company.name(),
      ciudad: 'BOG',
      direccion: faker.address.streetAddress(),
      productos: [],
    });

    await expect(() =>
      service.updateStoresFromProduct('0', [tiendaNuevo]),
    ).rejects.toHaveProperty('message', productoNoEncontrado);
  });

  it('updateStoresFromProduct deberia lanzar una excepcion por una tienda invalido', async () => {
    const tiendaNuevo: TiendaEntity = tiendasList[0];
    tiendaNuevo.id = '0';

    await expect(() =>
      service.updateStoresFromProduct(producto.id, [tiendaNuevo]),
    ).rejects.toHaveProperty('message', tiendaNoEncontrado);
  });

  it('deleteStoreFromProduct deberia remover una tienda de un producto', async () => {
    const tienda: TiendaEntity = tiendasList[0];

    await service.deleteStoreFromProduct(producto.id, tienda.id);

    const storedProducto: ProductoEntity = await productoRepository.findOne({
      where: { id: producto.id },
      relations: ['tiendas'],
    });
    const deletedTienda: TiendaEntity = storedProducto.tiendas.find(
      (a) => a.id === tienda.id,
    );

    expect(deletedTienda).toBeUndefined();
  });

  it('deleteStoreFromProduct deberia lanzar una excepcion por una tienda invalido', async () => {
    await expect(() =>
      service.deleteStoreFromProduct(producto.id, '0'),
    ).rejects.toHaveProperty('message', tiendaNoEncontrado);
  });

  it('deleteStoreFromProduct deberia lanzar una excepcion por un producto invalido', async () => {
    const tienda: TiendaEntity = tiendasList[0];
    await expect(() =>
      service.deleteStoreFromProduct('0', tienda.id),
    ).rejects.toHaveProperty('message', productoNoEncontrado);
  });

  it('deleteStoreFromProduct deberia lanzar una excepcion por una tienda no asociada al producto', async () => {
    const tiendaNuevo: TiendaEntity = await tiendaRepository.save({
      nombre: faker.company.name(),
      ciudad: 'BOG',
      direccion: faker.address.streetAddress(),
      productos: [],
    });

    await expect(() =>
      service.deleteStoreFromProduct(producto.id, tiendaNuevo.id),
    ).rejects.toHaveProperty('message', tiendaNoAsociada);
  });
});
