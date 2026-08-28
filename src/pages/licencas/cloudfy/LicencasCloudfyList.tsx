import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLicencaCloudfy } from '../../../hooks/useLicencaCloudfy';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Tag } from '../../../components/ui/Tag';
import { Search, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useCategoriaLicencaCloudfy } from '../../../hooks/useCategoriaLicencaCloudfy';

export function LicencasCloudfyList() {
  const navigate = useNavigate();
  const { licencas, loading, error, remover } = useLicencaCloudfy();
  const { categorias } = useCategoriaLicencaCloudfy();
  const [busca, setBusca] = useState('');
  const [licencaParaRemover, setLicencaParaRemover] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);

  const licencasFiltradas = licencas.filter((l) =>
    (l.nome || '').toLowerCase().includes(busca.toLowerCase()) || (l.categoriaNome || '').toLowerCase().includes(busca.toLowerCase())
  );

  const handleRemover = async () => {
    if (!licencaParaRemover) return;
    setRemovendo(true);
    try { await remover(licencaParaRemover); setLicencaParaRemover(null); }
    finally { setRemovendo(false); }
  };

  const formatarValor = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const nomeDaLicenca = (licenca: typeof licencas[number]) => licenca.nome || 'Licença sem nome';
  const valorDaLicenca = (licenca: typeof licencas[number]) => licenca.valor ?? licenca.valorIntegral ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Licenças Cloudfy</h1>
          <p className="text-slate-400 mt-1">Gerencie os itens avulsos do Cloudfy Premium</p>
        </div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => navigate('/licencas/cloudfy/categorias')} className="flex items-center gap-2">Categorias</Button><Button onClick={() => navigate('/licencas/cloudfy/nova')} className="flex items-center gap-2">
          <Plus size={18} /> Nova Licença
        </Button></div>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Buscar por nome ou categoria..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-3" />
            Carregando licenças...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 flex items-center justify-center gap-2">
            <AlertTriangle size={20} /> {error}
          </div>
        ) : licencasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {busca ? 'Nenhuma licença encontrada.' : 'Nenhuma licença cadastrada ainda.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-900/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Nome</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Categoria</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Valor</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {licencasFiltradas.map((licenca) => (
                  <tr key={licenca.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4"><div className="font-medium text-white">{nomeDaLicenca(licenca)}</div></td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{categorias.find((categoria) => categoria.id === licenca.categoriaId)?.nome || licenca.categoriaNome || 'Sem categoria'}</td>
                    <td className="px-6 py-4"><span className="text-emerald-400 font-semibold">{formatarValor(valorDaLicenca(licenca))}</span></td>
                    <td className="px-6 py-4">
                      <Tag variant={licenca.ativo !== false ? 'success' : 'default'} className="text-xs">
                        {licenca.ativo !== false ? 'Ativo' : 'Inativo'}
                      </Tag>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/licencas/cloudfy/editar/${licenca.id}`)} className="text-slate-400 hover:text-white"><Pencil size={16} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setLicencaParaRemover(licenca.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={!!licencaParaRemover} onClose={() => setLicencaParaRemover(null)} title="Desativar licença">
        <div className="space-y-4">
          <p className="text-slate-300">A licença será preservada no histórico, mas deixará de aparecer em novas cotações. Deseja continuar?</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setLicencaParaRemover(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRemover} disabled={removendo} className="bg-red-600 hover:bg-red-700">{removendo ? 'Desativando...' : 'Desativar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
