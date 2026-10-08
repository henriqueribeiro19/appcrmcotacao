import { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { Bold, Heading2, Italic, List, ListOrdered, Redo2, Table2, Undo2 } from 'lucide-react';
import { ContractTableDataContext } from './ContractTable';
import type { ReactNode } from 'react';
import type { ContractTableSnapshot } from '@/types';
import { ContractTable } from './ContractTable';

interface ContractRichEditorProps {
  html: string;
  editable: boolean;
  onChange: (html: string) => void;
  tables?: ContractTableSnapshot;
}

export function ContractRichEditor({ html, editable, onChange, tables }: ContractRichEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [StarterKit, TableKit.configure({ table: { resizable: false } }), ContractTable],
    content: html,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => onChangeRef.current(currentEditor.getHTML()),
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  if (!editor) return <div className="min-h-[70vh] animate-pulse rounded bg-white" />;

  const hasTable = (kind: string) => {
    let found = false;
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'contractTable' && node.attrs.kind === kind) found = true;
    });
    return found;
  };

  const addTable = (kind: 'licenses' | 'services') => {
    if (hasTable(kind)) return;
    const attrs = tables
      ? {
          kind,
          rows: kind === 'licenses' ? tables.licenses : tables.services,
          total: kind === 'licenses' ? tables.totalMonthly : tables.totalServices,
          discountPercent: tables.discountPercent,
          discountAmount: kind === 'licenses' ? tables.discountAmount : 0,
          installments: kind === 'services' ? tables.installments : [],
        }
      : { kind };
    editor.chain().focus().insertContent({ type: 'contractTable', attrs }).run();
  };

  const iconButton = (label: string, active: boolean, action: () => void, icon: ReactNode) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={action}
      className={`rounded p-2 transition-colors ${active ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-200'}`}
    >
      {icon}
    </button>
  );

  return (
    <div className="contract-editor-shell">
      {editable && (
        <div className="no-print flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
          {iconButton('Negrito', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold size={16} />)}
          {iconButton('Itálico', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic size={16} />)}
          {iconButton('Título de seção', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={16} />)}
          {iconButton('Lista com marcadores', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List size={16} />)}
          {iconButton('Lista numerada', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered size={16} />)}
          <span className="mx-1 h-6 border-l border-slate-300" />
          <button type="button" onClick={() => addTable('licenses')} disabled={hasTable('licenses')} className="inline-flex items-center gap-1 rounded px-2 py-2 text-xs text-slate-700 hover:bg-slate-200 disabled:opacity-40">
            <Table2 size={15} /> Inserir tabela de licenças
          </button>
          <button type="button" onClick={() => addTable('services')} disabled={hasTable('services')} className="inline-flex items-center gap-1 rounded px-2 py-2 text-xs text-slate-700 hover:bg-slate-200 disabled:opacity-40">
            <Table2 size={15} /> Inserir tabela de serviços
          </button>
          <span className="mx-1 h-6 border-l border-slate-300" />
          {iconButton('Desfazer', false, () => editor.chain().focus().undo().run(), <Undo2 size={16} />)}
          {iconButton('Refazer', false, () => editor.chain().focus().redo().run(), <Redo2 size={16} />)}
        </div>
      )}
      <ContractTableDataContext.Provider value={tables}>
        <EditorContent editor={editor} className={`contract-document ${editable ? 'contract-document-editing' : ''}`} />
      </ContractTableDataContext.Provider>
      <p className="no-print px-4 py-2 text-xs text-slate-500">
        As tabelas da cotação são protegidas contra edição direta. Para ajustar preços ou quantidades, altere a cotação e prepare uma nova versão do contrato.
      </p>
    </div>
  );
}
