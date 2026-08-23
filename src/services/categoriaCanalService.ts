import { createCrudService } from './crudService';
import type { CategoriaCanal } from '@/types';

export const categoriaCanalService = createCrudService<CategoriaCanal>('categorias_canal');
