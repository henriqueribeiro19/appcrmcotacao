import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Tag } from '../../components/ui/Tag';
import { Search, Plus, Pencil, Trash2, Puzzle, CheckSquare, Hash } from 'lucide-react';

interface Adicional { id: string; nome: string; descricao?: string; valor: number; tipo: 'checkbox' | 'quantificavel'; ativo: boolean; createdAt: string; }

const mockAdicionais: Adicional[] = [
  { id: '1', nome: 'Suporte Premium', descricao: 'Atendimento prioritário 24/7', valor: 199.90, tipo: 'checkbox', ativo: true, createdAt: '2026-08-01' },
  { id: '2', nome: 'Treinamento On-site', descricao: 'Treinamento presencial', valor: 450.00, tipo: 'quantificavel', ativo: true, createdAt: '2026-08-05' },
  { id: '3', nome: 'Backup em Nuvem', descricao: 'Backup automático diário', valor: 49.90, tipo: 'checkbox', ativo: true, createdAt: '2026-08-10' },
];

export function AdicionaisList() {
  const navigate = useNavigate();
  const [adicionais, setAdicionais] = useState<Adicional[]>(mockAdicionais);
  const [busca, setBusca] = useState('');
  const [adicionalParaRemover, setAdicionalParaRemover] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);

  const adicionaisFiltrados = adicionais.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleRemover = async () => {
    if (!adicionalParaRemover) return;
    setRemovendo(true);
    setAdicionais((prev) => prev.filter((a) => a.id !== adicionalParaRemover));
    setAdicionalParaRemover(null);
    setRemovendo(false);
  };

  const formatarValor = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Adicionais</h1>
          <p className="text-slate-400 mt-1">Itens adicionais para inclusão nas cotações</p>
        </div>
        <Button onClick={() => navigate('/adicionais/novo')} className="flex items-center gap-2"><Plus size={18} /> Novo Adicional</Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {adicionaisFiltrados.length === 0 ? (
          <div className="p-8 text-center text-slate-500">{busca ? 'Nenhum adicional encontrado.' : 'Nenhum adicional cadastrado.'}</div>
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
                {adicionaisFiltrados.map((adicional) => (
                  <tr key={adicional.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Puzzle size={18} className="text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-medium text-white">{adicional.nome}</div>
                          <div className="text-slate-500 text-xs mt-0.5 max-w-xs truncate">{adicional.descricao || 'Sem descrição'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {adicional.tipo === 'quantificavel' ? (
                        <Tag variant="info" className="text-xs flex items-center gap-1"><Hash size={12} /> Quantificável</Tag>
                      ) : (
                        <Tag variant="warning" className="text-xs flex items-center gap-1"><CheckSquare size={12} /> Checkbox</Tag>
                      )}
                    </td>
                    <td className="px-6 py-4"><span className="text-emerald-400 font-semibold">{formatarValor(adicional.valor)}</span></td>
                    <td className="px-6 py-4"><Tag variant={adicional.ativo !== false ? 'success' : 'default'} className="text-xs">{adicional.ativo !== false ? 'Ativo' : 'Inativo'}</Tag></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/adicionais/editar/${adicional.id}`)} className="text-slate-400 hover:text-white"><Pencil size={16} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setAdicionalParaRemover(adicional.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={!!adicionalParaRemover} onClose={() => setAdicionalParaRemover(null)} title="Confirmar exclusão">
        <div className="space-y-4">
          <p className="text-slate-300">Tem certeza que deseja remover este adicional?</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAdicionalParaRemover(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRemover} disabled={removendo} className="bg-red-600 hover:bg-red-700">{removendo ? 'Removendo...' : 'Remover'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
