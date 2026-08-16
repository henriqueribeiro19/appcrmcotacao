import { useAuth } from './useAuth';

export function useRole() {
  const { userProfile, isAdmin } = useAuth();

  const canEditLead = (responsavelId?: string) => {
    if (isAdmin) return true;
    return userProfile?.uid === responsavelId;
  };

  const canViewAllLeads = () => isAdmin;
  const canViewAllCotacoes = () => isAdmin;
  const canManageUsers = () => isAdmin;
  const canManageLicencas = () => isAdmin;

  return {
    isAdmin,
    isVendedor: !isAdmin && !!userProfile,
    canEditLead,
    canViewAllLeads,
    canViewAllCotacoes,
    canManageUsers,
    canManageLicencas,
  };
}
