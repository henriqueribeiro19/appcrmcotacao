import { createCrudService } from './crudService';
import type { ClienteLicencaCloudfy } from '@/types';

export const clienteLicencaCloudfyService = createCrudService<ClienteLicencaCloudfy>('clientes_licencas_cloudfy');
