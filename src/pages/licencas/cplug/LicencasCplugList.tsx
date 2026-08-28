import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLicencaCplug } from '../../../hooks/useLicencaCplug';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Tag } from '../../../components/ui/Tag';
import { Search, Plus, Pencil, Trash2, AlertTriangle, CheckSquare, Hash } from 'lucide-react';

export function LicencasCplugList() {
  const navigate = useNavigate();
  const { licencas, loading, error, remover } = useLicencaCplug();
  const [busca, setBusca] = useState('');
  const [licencaParaRemover, setLicencaParaRemover] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);

  const licencasFiltradas = licencas.filter((l) =>
    (l.nome || l.descricao || '').toLowerCase().includes(busca.toLowerCase())
  );

  const handleRemover = async () => {
    if (!licencaParaRemover) return;
    setRemovendo(true);
    try { await remover(licencaParaRemover); setLicencaParaRemover(null); }
    finally { setRemovendo(false); }
  };

  const formatarValor = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const nomeDaLicenca = (licenca: typeof licencas[number]) => licenca.nome || licenca.descricao || 'Licença sem nome';
  const valorDaLicenca = (licenca: typeof licencas[number]) => licenca.valor ?? licenca.valorIntegral ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Licenças Cplug</h1>
          <p className="text-slate-400 mt-1">Gerencie os itens avulsos do Cplug</p>
        </div>
        <Button onClick={() => navigate('/licencas/cplug/nova')} className="flex items-center gap-2"><Plus size={18} /> Nova Licença</Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-3" />Carregando...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 flex items-center justify-center gap-2"><AlertTriangle size={20} />{error}</div>
        ) : licencasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">{busca ? 'Nenhuma licença encontrada.' : 'Nenhuma licença cadastrada.'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-700/50 bg-slate-900/50">
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Nome</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Tipo</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Valor</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-300">Ações</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-700/30">
                {licencasFiltradas.map((licenca) => (
                  <tr key={licenca.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{nomeDaLicenca(licenca)}</div>
                      <div className="text-slate-500 text-xs mt-0.5 truncate max-w-xs">{licenca.descricao || 'Sem descrição'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {licenca.tipo === 'quantificavel' ? (
                        <Tag variant="info" className="text-xs flex items-center gap-1"><Hash size={12} /> Quantificável</Tag>
                      ) : (
                        <Tag variant="warning" className="text-xs flex items-center gap-1"><CheckSquare size={12} /> Checkbox</Tag>
                      )}
                    </td>
                    <td className="px-6 py-4"><span className="text-emerald-400 font-semibold">{formatarValor(valorDaLicenca(licenca))}</span></td>
                    <td className="px-6 py-4"><Tag variant={licenca.ativo !== false ? 'success' : 'default'} className="text-xs">{licenca.ativo !== false ? 'Ativo' : 'Inativo'}</Tag></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/licencas/cplug/editar/${licenca.id}`)} className="text-slate-400 hover:text-white"><Pencil size={16} /></Button>
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
