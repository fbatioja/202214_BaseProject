import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { Repository } from 'typeorm';
import { ProductoEntity } from './producto.entity';
import { ProductoService } from './producto.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { TipoProducto } from './tipo-producto.enum';

describe('ProductoService', () => {
  let service: ProductoService;
  let repository: Repository<ProductoEntity>;
  let listaProductos: ProductoEntity[];
  const noEncontrado = 'El producto con el id dado no fue encontrado';
  const tipoNoValido = 'El tipo de producto no es valido';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [ProductoService],
    }).compile();

    service = module.get<ProductoService>(ProductoService);
    repository = module.get<Repository<ProductoEntity>>(
      getRepositoryToken(ProductoEntity),
    );
    await seedDatabase();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const seedDatabase = async () => {
    repository.clear();
    listaProductos = [];
    for (let i = 0; i < 5; i++) {
      const producto: ProductoEntity = await repository.save({
        nombre: faker.commerce.product(),
        precio: Number(faker.commerce.price()),
        tipo: TipoProducto.PERECEDERO,
        tiendas: [],
      });
      listaProductos.push(producto);
    }
  };

  it('findAll deberia retornar todos los productos', async () => {
    const productos: ProductoEntity[] = await service.findAll();
    expect(productos).not.toBeNull();
    expect(productos).toHaveLength(listaProductos.length);
  });

  it('findOne deberia retornar un producto por el id', async () => {
    const productoAlmacenado: ProductoEntity = listaProductos[0];
    const producto: ProductoEntity = await service.findOne(
      productoAlmacenado.id,
    );
    expect(producto).not.toBeNull();
    expect(producto.nombre).toEqual(productoAlmacenado.nombre);
    expect(producto.precio).toEqual(productoAlmacenado.precio);
    expect(producto.tipo).toEqual(productoAlmacenado.tipo);
  });

  it('findOne deberia lanzar una excepcion por un producto invalido', async () => {
    await expect(() => service.findOne('0')).rejects.toHaveProperty(
      'message',
      noEncontrado,
    );
  });

  it('create deberia retornar un nuevo producto', async () => {
    const producto: ProductoEntity = {
      id: '',
      nombre: faker.commerce.product(),
      precio: Number(faker.commerce.price()),
      tipo: TipoProducto.PERECEDERO,
      tiendas: [],
    };

    const productoNuevo: ProductoEntity = await service.create(producto);
    expect(productoNuevo).not.toBeNull();

    const productoAlmacenado: ProductoEntity = await repository.findOne({
      where: { id: productoNuevo.id },
    });
    expect(productoAlmacenado).not.toBeNull();
    expect(productoAlmacenado.nombre).toEqual(productoNuevo.nombre);
    expect(productoAlmacenado.precio).toEqual(productoNuevo.precio);
    expect(productoAlmacenado.tipo).toEqual(productoNuevo.tipo);
  });

  it('create deberia lanzar una excepcion por tipo de producto invalido', async () => {
    const producto: ProductoEntity = {
      id: '',
      nombre: faker.commerce.product(),
      precio: Number(faker.commerce.price()),
      tipo: 'No tipo',
      tiendas: [],
    };
    await expect(() => service.create(producto)).rejects.toHaveProperty(
      'message',
      tipoNoValido,
    );
  });

  it('update deberia modificar un producto', async () => {
    const producto: ProductoEntity = listaProductos[0];
    producto.nombre = 'New name';
    producto.precio = 50000;
    const updatedProducto: ProductoEntity = await service.update(
      producto.id,
      producto,
    );
    expect(updatedProducto).not.toBeNull();
    const productoAlmacenado: ProductoEntity = await repository.findOne({
      where: { id: producto.id },
    });
    expect(productoAlmacenado).not.toBeNull();
    expect(productoAlmacenado.nombre).toEqual(producto.nombre);
    expect(productoAlmacenado.precio).toEqual(producto.precio);
  });

  it('update deberia lanzar una excepcion por un producto invalido', async () => {
    let producto: ProductoEntity = listaProductos[0];
    producto = {
      ...producto,
      nombre: 'New name',
      tipo: 'Invalido',
    };
    await expect(() =>
      service.update(listaProductos[0].id, producto),
    ).rejects.toHaveProperty('message', tipoNoValido);
  });

  it('update deberia lanzar una excepcion por un producto invalido', async () => {
    let producto: ProductoEntity = listaProductos[0];
    producto = {
      ...producto,
      nombre: 'New name',
      precio: 50000,
    };
    await expect(() => service.update('0', producto)).rejects.toHaveProperty(
      'message',
      noEncontrado,
    );
  });

  it('delete deberia remover un producto', async () => {
    const producto: ProductoEntity = listaProductos[0];
    await service.delete(producto.id);
    const productoEliminado: ProductoEntity = await repository.findOne({
      where: { id: producto.id },
    });
    expect(productoEliminado).toBeNull();
  });

  it('delete deberia lanzar una excepcion por un producto invalido', async () => {
    const producto: ProductoEntity = listaProductos[0];
    await service.delete(producto.id);
    await expect(() => service.delete('0')).rejects.toHaveProperty(
      'message',
      noEncontrado,
    );
  });
});
