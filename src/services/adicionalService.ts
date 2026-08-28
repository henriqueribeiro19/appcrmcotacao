import { createCrudService } from './crudService';
import type { Adicional } from '@/types';

export const adicionalService = createCrudService<Adicional>('adicionais');