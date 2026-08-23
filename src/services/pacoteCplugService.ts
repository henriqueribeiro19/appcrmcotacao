import { createCrudService } from './crudService';
import type { PacoteCplug } from '@/types';

export const pacoteCplugService = createCrudService<PacoteCplug>('pacotes_cplug');
