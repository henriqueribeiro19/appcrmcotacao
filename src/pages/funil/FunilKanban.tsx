import { KanbanBoard } from '@/components/KanbanBoard';

export function FunilKanban() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Funil de Vendas</h1>
        <p className="text-slate-400 mt-1">Arraste os leads entre as colunas para atualizar o status</p>
      </div>
      <KanbanBoard />
    </div>
  );
}
