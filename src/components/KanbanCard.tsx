import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Phone, Mail, MapPin, GripVertical } from 'lucide-react';
import { ScoreBadge } from '@/components/ScoreBadge';
import { formatCNPJ, formatPhone } from '@/utils/formatters';
import type { Lead } from '@/types';

interface KanbanCardProps {
  lead: Lead;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
}

export function KanbanCard({ lead, onDragStart }: KanbanCardProps) {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart(e, lead.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => navigate(`/leads/${lead.id}`)}
      className={`bg-slate-850 border border-slate-800 rounded-lg p-3 cursor-move hover:border-emerald-500/30 transition-all group ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="text-slate-600 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h4 className="text-sm font-medium text-white truncate">{lead.razaoSocial}</h4>
            {lead.classificacao && (
              <ScoreBadge
                score={lead.classificacao === 'A' ? 85 : lead.classificacao === 'B' ? 70 : 45}
                classificacao={lead.classificacao}
              />
            )}
          </div>

          {lead.cnpj && (
            <p className="text-xs text-slate-500 font-mono mb-2">{formatCNPJ(lead.cnpj)}</p>
          )}

          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            {lead.telefone && (
              <span className="flex items-center gap-1">
                <Phone size={10} />{formatPhone(lead.telefone)}
              </span>
            )}
            {lead.email && (
              <span className="flex items-center gap-1 truncate max-w-[120px]">
                <Mail size={10} />{lead.email}
              </span>
            )}
            {lead.municipio && (
              <span className="flex items-center gap-1">
                <MapPin size={10} />{lead.municipio}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-500 capitalize">{lead.produtoSugerido || 'qualificar'}</span>
            {lead.interacoes && lead.interacoes.length > 0 && (
              <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                {lead.interacoes.length} interação{lead.interacoes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
