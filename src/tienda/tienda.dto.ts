import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class TiendaDto {
  @IsString()
  @IsNotEmpty()
  readonly nombre: string;

  @IsString()
  @IsNotEmpty()
  readonly ciudad: number;

  @IsString()
  @IsNotEmpty()
  readonly direccion: string;
}
