import { MessageSquare, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import type { Interacao } from '@/types';

const tipoConfig = {
  anotacao: { icon: FileText, label: 'Anotação', color: 'text-slate-400' },
  whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: 'text-green-400' },
  email: { icon: Mail, label: 'Email', color: 'text-blue-400' },
  visita: { icon: MapPin, label: 'Visita', color: 'text-purple-400' },
  ligacao: { icon: Phone, label: 'Ligação', color: 'text-amber-400' },
};

interface InteracaoItemProps {
  interacao: Interacao;
}

export function InteracaoItem({ interacao }: InteracaoItemProps) {
  const config = tipoConfig[interacao.tipo] || tipoConfig.anotacao;
  const Icon = config.icon;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.color}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-slate-300">{config.label}</span>
            <span className="text-xs text-slate-500">{formatDate(interacao.dataHora)}</span>
          </div>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{interacao.descricao}</p>
          <p className="text-xs text-slate-500 mt-1.5">{interacao.usuarioNome}</p>
        </div>
      </div>
    </div>
  );
}
