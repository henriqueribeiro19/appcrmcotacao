import { createCrudService } from './crudService';
import type { LicencaCloudfy } from '@/types';

export const licencaCloudfyService = createCrudService<LicencaCloudfy>('licencas_cloudfy');
