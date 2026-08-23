import { createCrudService } from './crudService';
import type { LicencaCplug } from '@/types';

export const licencaCplugService = createCrudService<LicencaCplug>('licencas_cplug');
