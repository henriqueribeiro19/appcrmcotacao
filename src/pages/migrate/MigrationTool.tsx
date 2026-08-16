import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-toastify';
import { Database, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface LeadMigration {
  id: string;
  razaoSocial: string;
  cnpj: string;
  temArquivado: boolean;
  temDataArquivamento: boolean;
  migrado: boolean;
}

export function MigrationTool() {
  const [leads, setLeads] = useState<LeadMigration[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrando, setMigrando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Query com filtro de status para respeitar as Firestore Rules
      const q = query(collection(db, 'leads'), where('status', '==', 'ativo'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          razaoSocial: d.razaoSocial || 'Sem nome',
          cnpj: d.cnpj || '',
          temArquivado: typeof d.arquivado === 'boolean',
          temDataArquivamento: d.dataArquivamento !== undefined,
          migrado: typeof d.arquivado === 'boolean' && d.dataArquivamento !== undefined,
        };
      });
      setLeads(data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar leads. Verifique se você está logado como admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const migrarTodos = async () => {
    const pendentes = leads.filter((l) => !l.migrado);
    if (pendentes.length === 0) {
      toast.info('Todos os leads já estão migrados!');
      return;
    }

    if (!confirm(`Vai migrar ${pendentes.length} leads. Continuar?`)) return;

    setMigrando(true);
    setProgresso(0);

    for (let i = 0; i < pendentes.length; i++) {
      const lead = pendentes[i];
      try {
        const leadRef = doc(db, 'leads', lead.id);
        await updateDoc(leadRef, {
          arquivado: false,
          dataArquivamento: null,
        });
        setLeads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, migrado: true, temArquivado: true, temDataArquivamento: true } : l))
        );
      } catch (err) {
        console.error(`Erro ao migrar ${lead.razaoSocial}:`, err);
      }
      setProgresso(Math.round(((i + 1) / pendentes.length) * 100));
    }

    setMigrando(false);
    toast.success('Migração concluída!');
  };

  const migrarUm = async (id: string) => {
    try {
      const leadRef = doc(db, 'leads', id);
      await updateDoc(leadRef, {
        arquivado: false,
        dataArquivamento: null,
      });
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, migrado: true, temArquivado: true, temDataArquivamento: true } : l))
      );
      toast.success('Lead migrado!');
    } catch {
      toast.error('Erro ao migrar lead');
    }
  };

  const total = leads.length;
  const migrados = leads.filter((l) => l.migrado).length;
  const pendentes = total - migrados;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <Database size={48} className="mx-auto text-emerald-500 mb-3" />
        <h1 className="text-2xl font-bold text-white">Ferramenta de Migração</h1>
        <p className="text-slate-400 mt-1">
          Adiciona os campos <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400 text-sm">arquivado</code> e{' '}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400 text-sm">dataArquivamento</code> nos leads existentes
        </p>
      </div>

      <Card>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-white">{total}</p>
            <p className="text-sm text-slate-400">Total de Leads</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-emerald-400">{migrados}</p>
            <p className="text-sm text-slate-400">Já Migrados</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-400">{pendentes}</p>
            <p className="text-sm text-slate-400">Pendentes</p>
          </div>
        </div>

        {migrando && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-400 mb-1">
              <span>Progresso</span>
              <span>{progresso}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3 justify-center">
          <Button onClick={fetchLeads} variant="ghost" disabled={migrando}>
            Atualizar Lista
          </Button>
          <Button onClick={migrarTodos} isLoading={migrando} disabled={pendentes === 0}>
            Migrar Todos ({pendentes} pendentes)
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 size={32} className="animate-spin mx-auto text-emerald-500 mb-3" />
          <p className="text-slate-400">Carregando leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 py-8">Nenhum lead encontrado no banco de dados</p>
        </Card>
      ) : (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Lista de Leads</h3>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-400 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Empresa</th>
                  <th className="px-3 py-2 text-left">CNPJ</th>
                  <th className="px-3 py-2 text-center">arquivado</th>
                  <th className="px-3 py-2 text-center">dataArquivamento</th>
                  <th className="px-3 py-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leads.map((lead) => (
                  <tr key={lead.id} className={lead.migrado ? 'bg-emerald-500/5' : ''}>
                    <td className="px-3 py-2 text-white font-medium">{lead.razaoSocial}</td>
                    <td className="px-3 py-2 text-slate-400 font-mono text-xs">{lead.cnpj}</td>
                    <td className="px-3 py-2 text-center">
                      {lead.temArquivado ? (
                        <CheckCircle size={16} className="mx-auto text-emerald-400" />
                      ) : (
                        <AlertTriangle size={16} className="mx-auto text-amber-400" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {lead.temDataArquivamento ? (
                        <CheckCircle size={16} className="mx-auto text-emerald-400" />
                      ) : (
                        <AlertTriangle size={16} className="mx-auto text-amber-400" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {lead.migrado ? (
                        <span className="text-xs text-emerald-400">✓ OK</span>
                      ) : (
                        <button
                          onClick={() => migrarUm(lead.id)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
                        >
                          Migrar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="text-center">
        <p className="text-xs text-slate-600">
          Depois de migrar todos, remova a rota <code>/migrate</code> do App.tsx
        </p>
      </div>
    </div>
  );
}
