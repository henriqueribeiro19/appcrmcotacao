import { createCrudService } from './crudService';
import type { CategoriaLicencaCloudfy } from '@/types';

export const categoriaLicencaCloudfyService = createCrudService<CategoriaLicencaCloudfy>('categorias_licencas_cloudfy');