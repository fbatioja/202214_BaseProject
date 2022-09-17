import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { Repository } from 'typeorm';
import { TiendaEntity } from './tienda.entity';
import { TiendaService } from './tienda.service';

describe('TiendaService', () => {
  let service: TiendaService;
  let repository: Repository<TiendaEntity>;
  let listaTiendas: TiendaEntity[];
  const noEncontrado = 'La tienda con el id dado no fue encontrado';
  const ciudadNoValida = 'La ciudad debe ser un codigo de 3 caracteres';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [TiendaService],
    }).compile();

    service = module.get<TiendaService>(TiendaService);
    repository = module.get<Repository<TiendaEntity>>(
      getRepositoryToken(TiendaEntity),
    );
    await seedDatabase();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const seedDatabase = async () => {
    repository.clear();
    listaTiendas = [];
    for (let i = 0; i < 5; i++) {
      const producto: TiendaEntity = await repository.save({
        nombre: faker.company.name(),
        ciudad: 'BOG',
        direccion: faker.address.streetAddress(),
        productos: [],
      });
      listaTiendas.push(producto);
    }
  };

  it('findAll deberia retornar todos los tiendas', async () => {
    const tiendas: TiendaEntity[] = await service.findAll();
    expect(tiendas).not.toBeNull();
    expect(tiendas).toHaveLength(listaTiendas.length);
  });

  it('findOne deberia retornar una tienda por el id', async () => {
    const tiendaAlmacenado: TiendaEntity = listaTiendas[0];
    const tienda: TiendaEntity = await service.findOne(tiendaAlmacenado.id);
    expect(tienda).not.toBeNull();
    expect(tienda.nombre).toEqual(tiendaAlmacenado.nombre);
    expect(tienda.ciudad).toEqual(tiendaAlmacenado.ciudad);
    expect(tienda.direccion).toEqual(tiendaAlmacenado.direccion);
  });

  it('findOne deberia lanzar una excepcion por una tienda invalido', async () => {
    await expect(() => service.findOne('0')).rejects.toHaveProperty(
      'message',
      noEncontrado,
    );
  });

  it('create deberia retornar un nuevo tienda', async () => {
    const tienda: TiendaEntity = {
      id: '',
      nombre: faker.company.name(),
      ciudad: 'BOG',
      direccion: faker.address.streetAddress(),
      productos: [],
    };

    const tiendaNuevo: TiendaEntity = await service.create(tienda);
    expect(tiendaNuevo).not.toBeNull();

    const tiendaAlmacenado: TiendaEntity = await repository.findOne({
      where: { id: tiendaNuevo.id },
    });
    expect(tiendaAlmacenado).not.toBeNull();
    expect(tiendaAlmacenado.nombre).toEqual(tiendaNuevo.nombre);
    expect(tiendaAlmacenado.ciudad).toEqual(tiendaNuevo.ciudad);
    expect(tiendaAlmacenado.direccion).toEqual(tiendaNuevo.direccion);
  });

  it('create deberia lanzar una excepcion por ciudad invalida', async () => {
    const tienda: TiendaEntity = {
      id: '',
      nombre: faker.company.name(),
      ciudad: 'BOGota',
      direccion: faker.address.streetAddress(),
      productos: [],
    };
    await expect(() => service.create(tienda)).rejects.toHaveProperty(
      'message',
      ciudadNoValida,
    );
  });

  it('update deberia modificar una tienda', async () => {
    const tienda: TiendaEntity = listaTiendas[0];
    tienda.nombre = 'New name';
    tienda.ciudad = 'MED';
    const updatedTienda: TiendaEntity = await service.update(tienda.id, tienda);
    expect(updatedTienda).not.toBeNull();
    const tiendaAlmacenado: TiendaEntity = await repository.findOne({
      where: { id: tienda.id },
    });
    expect(tiendaAlmacenado).not.toBeNull();
    expect(tiendaAlmacenado.nombre).toEqual(tienda.nombre);
    expect(tiendaAlmacenado.ciudad).toEqual(tienda.ciudad);
  });

  it('update deberia lanzar una excepcion por ciudad invalida', async () => {
    let tienda: TiendaEntity = listaTiendas[0];
    tienda = {
      ...tienda,
      nombre: 'New name',
      ciudad: 'MEDellin',
    };
    await expect(() =>
      service.update(listaTiendas[0].id, tienda),
    ).rejects.toHaveProperty('message', ciudadNoValida);
  });

  it('update deberia lanzar una excepcion por una tienda invalido', async () => {
    let tienda: TiendaEntity = listaTiendas[0];
    tienda = {
      ...tienda,
      nombre: 'New name',
      ciudad: 'MED',
    };
    await expect(() => service.update('0', tienda)).rejects.toHaveProperty(
      'message',
      noEncontrado,
    );
  });

  it('delete deberia remover una tienda', async () => {
    const tienda: TiendaEntity = listaTiendas[0];
    await service.delete(tienda.id);
    const tiendaEliminado: TiendaEntity = await repository.findOne({
      where: { id: tienda.id },
    });
    expect(tiendaEliminado).toBeNull();
  });

  it('delete deberia lanzar una excepcion por una tienda invalido', async () => {
    const tienda: TiendaEntity = listaTiendas[0];
    await service.delete(tienda.id);
    await expect(() => service.delete('0')).rejects.toHaveProperty(
      'message',
      noEncontrado,
    );
  });
});
