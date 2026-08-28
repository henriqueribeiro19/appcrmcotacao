import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePacoteCplug } from '../../hooks/usePacoteCplug';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Tag } from '../../components/ui/Tag';
import { Search, Plus, Pencil, Trash2, AlertTriangle, Package, CheckSquare, Hash, Layers } from 'lucide-react';

export function PacotesList() {
  const navigate = useNavigate();
  const { pacotes, loading, error, remover } = usePacoteCplug();
  const [busca, setBusca] = useState('');
  const [pacoteParaRemover, setPacoteParaRemover] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);

  const pacotesFiltrados = pacotes.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleRemover = async () => {
    if (!pacoteParaRemover) return;
    setRemovendo(true);
    try { await remover(pacoteParaRemover); setPacoteParaRemover(null); }
    finally { setRemovendo(false); }
  };

  const formatarValor = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pacotes Cplug</h1>
          <p className="text-slate-400 mt-1">Gerencie os planos fechados: Essencial Food, Varejo, Autoatendimento, Ideal e Completo</p>
        </div>
        <Button onClick={() => navigate('/pacotes/novo')} className="flex items-center gap-2"><Plus size={18} /> Novo Pacote</Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <Card className="p-8 text-center text-slate-400"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-3" />Carregando...</Card>
        ) : error ? (
          <Card className="p-8 text-center text-red-400 flex items-center justify-center gap-2"><AlertTriangle size={20} />{error}</Card>
        ) : pacotesFiltrados.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">{busca ? 'Nenhum pacote encontrado.' : 'Nenhum pacote cadastrado.'}</Card>
        ) : (
          pacotesFiltrados.map((pacote) => (
            <Card key={pacote.id} className="p-5 hover:border-emerald-500/30 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Package size={20} className="text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">{pacote.nome}</h3>
                    <Tag variant={pacote.ativo !== false ? 'success' : 'default'} className="text-xs">{pacote.ativo !== false ? 'Ativo' : 'Inativo'}</Tag>
                  </div>
                  {pacote.descricao && <p className="text-slate-400 text-sm mb-3">{pacote.descricao}</p>}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Tag variant="info" className="text-xs flex items-center gap-1"><Layers size={12} />{pacote.modulosFixos?.length || 0} fixos</Tag>
                    <Tag variant="warning" className="text-xs flex items-center gap-1"><CheckSquare size={12} />{pacote.modulosOpcionais?.length || 0} opcionais</Tag>
                    <Tag variant="default" className="text-xs flex items-center gap-1"><Hash size={12} />{pacote.itensQuantificaveis?.length || 0} quantificáveis</Tag>
                  </div>
                </div>
                <div className="flex flex-col items-start lg:items-end gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Valor base</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatarValor(pacote.valorBase)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/pacotes/editar/${pacote.id}`)} className="text-slate-400 hover:text-white"><Pencil size={16} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setPacoteParaRemover(pacote.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={!!pacoteParaRemover} onClose={() => setPacoteParaRemover(null)} title="Desativar pacote">
        <div className="space-y-4">
          <p className="text-slate-300">O pacote será preservado no histórico, mas deixará de aparecer em novos cadastros. Deseja continuar?</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setPacoteParaRemover(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRemover} disabled={removendo} className="bg-red-600 hover:bg-red-700">{removendo ? 'Desativando...' : 'Desativar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
