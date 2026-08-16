import { useState } from 'react';
import { KanbanCard } from './KanbanCard';
import type { Lead } from '@/types';

interface KanbanColumnProps {
  status: Lead['statusFunil'];
  label: string;
  color: string;
  leads: Lead[];
  onDrop: (leadId: string, novoStatus: Lead['statusFunil']) => void;
}

export function KanbanColumn({ status, label, color, leads, onDrop }: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      onDrop(leadId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col min-w-[280px] w-[280px] max-h-full rounded-xl border transition-colors ${
        isOver ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/50'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <h3 className="text-sm font-semibold text-white">{label}</h3>
        </div>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>

      <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
        {leads.map((lead) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            onDragStart={(e, leadId) => {
              e.dataTransfer.setData('leadId', leadId);
              e.dataTransfer.effectAllowed = 'move';
            }}
          />
        ))}
        {leads.length === 0 && (
          <div className="text-center py-8 text-slate-600 text-xs">
            Arraste leads para cá
          </div>
        )}
      </div>
    </div>
  );
}
