import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { ListItem as BaseListItem } from '@tiptap/extension-list-item';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { TextAlign } from '@tiptap/extension-text-align';
import { Table as TableExtension, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { FontSize } from '@/lib/tiptap-font-size';
import { Node, mergeAttributes, wrappingInputRule } from '@tiptap/core';
import { useEffect, useState, forwardRef, useImperativeHandle, useRef, type SVGProps } from 'react';
import { Button } from '@/componentes/ui/button';
import { Toggle } from '@/componentes/ui/toggle';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  Table as TableIcon,
} from 'lucide-react';
import { cn } from '@/lib/utilidades';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { HexColorPicker } from 'react-colorful';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import { Label } from '@/componentes/ui/label';
import { Switch } from '@/componentes/ui/switch';
import { Input } from '@/componentes/ui/input';
const EtiquetaNode = Node.create({
  name: 'etiqueta',

  group: 'inline',

  inline: true,

  atom: true,

  addAttributes() {
    return {
      codigo: {
        default: null,
        parseHTML: element => element.getAttribute('data-codigo'),
        renderHTML: attributes => {
          return {
            'data-codigo': attributes.codigo,
          };
        },
      },
      texto: {
        default: null,
        parseHTML: element => element.getAttribute('data-texto'),
        renderHTML: attributes => ({
          'data-texto': attributes.texto,
        }),
      },
      eliminada: {
        default: false,
        parseHTML: element => element.getAttribute('data-eliminada') === 'true',
        renderHTML: attributes => {
          return {
            'data-eliminada': attributes.eliminada,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-etiqueta]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { codigo, texto, eliminada } = node.attrs;
    const existingStyle = HTMLAttributes.style || '';
    const baseStyle = eliminada
      ? 'display: inline-flex; align-items: center; padding: 2px 8px; margin: 0 2px; border-radius: 0.375rem; background-color: #fee2e2; border: 1px solid #fca5a5;'
      : 'display: inline-flex; align-items: center; padding: 2px 8px; margin: 0 2px; border-radius: 0.375rem; background-color: #dbeafe; border: 1px solid #93c5fd;';
    const combinedStyle = existingStyle ? `${baseStyle} ${existingStyle}` : baseStyle;

    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-etiqueta': codigo,
        'data-codigo': codigo,
        'data-texto': texto,
        'data-eliminada': eliminada,
        class: eliminada
          ? 'etiqueta-plantilla etiqueta-eliminada'
          : 'etiqueta-plantilla',
        style: combinedStyle,
      }),
      texto || codigo,
    ];
  },

  addCommands() {
    return {
      insertarEtiqueta: (codigo: string, texto?: string) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: { codigo, texto: texto || codigo, eliminada: false },
        });
      },
    } as any;
  },
});

interface EditorConEtiquetasPersonalizadoProps {
  contenido: string;
  onChange: (contenido: string) => void;
  className?: string;
  minHeight?: string;
  tamanoPapel?: 'carta' | 'legal' | 'a4';
  margenes?: { top: number; right: number; bottom: number; left: number };
  tamanoPersonalizado?: { widthMm: number; heightMm: number } | null;
  habilitarEtiquetas?: boolean;
  soloLectura?: boolean;
  mostrarBotonOdontograma?: boolean;
  onAbrirOdontograma?: () => void;
}

export interface EditorHandle {
  chain: () => any;
  getHTML: () => string;
}

const IconoDiente = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 -4 26 26"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M13.25 3C13.0511 3 12.8603 3.07902 12.7197 3.21967C12.579 3.36032 12.5 3.55109 12.5 3.75C12.5 3.94891 12.579 4.13968 12.7197 4.28033C12.8603 4.42098 13.0511 4.5 13.25 4.5C13.964 4.5 14.5 5.036 14.5 5.75C14.5 5.94891 14.579 6.13968 14.7197 6.28033C14.8603 6.42098 15.0511 6.5 15.25 6.5C15.4489 6.5 15.6397 6.42098 15.7803 6.28033C15.921 6.13968 16 5.94891 16 5.75C16.004 5.38775 15.9356 5.02835 15.7989 4.69289C15.6621 4.35743 15.4597 4.05267 15.2035 3.7965C14.9473 3.54034 14.6426 3.33792 14.3071 3.20115C13.9717 3.06437 13.6123 2.99598 13.25 3ZM5.25 0C4.144 0 2.855 0.552 1.855 1.387C0.849 2.227 0 3.468 0 4.948V4.966C0 5.681 0 7.27 1.214 8.711C1.342 8.863 1.42 8.96 1.476 9.057C1.793 9.609 1.997 10.222 2 10.754C2.01 12.654 2.353 14.28 2.96 15.461C3.561 16.629 4.51 17.5 5.75 17.5C6.117 17.5 6.468 17.414 6.771 17.208C7.071 17.004 7.265 16.724 7.391 16.439C7.627 15.909 7.684 15.228 7.721 14.613C7.731 14.4583 7.74 14.3023 7.748 14.145C7.813 12.943 7.88 11.69 8.424 10.58C8.607 10.205 8.936 10 9.25 10H9.75C10.057 10 10.377 10.196 10.563 10.553C10.956 11.589 11.075 12.74 11.19 13.849C11.2167 14.119 11.2457 14.385 11.277 14.647C11.352 15.277 11.455 15.937 11.695 16.449C11.82 16.717 12.001 16.987 12.275 17.189C12.559 17.399 12.892 17.5 13.25 17.5C14.36 17.5 15.301 16.598 15.917 15.48C16.563 14.307 16.989 12.68 17 10.754C17.003 10.161 17.257 9.471 17.627 8.886C18.997 7.254 19 5.726 19 4.948C19 3.468 18.151 2.227 17.145 1.387C16.145 0.552 14.856 0 13.75 0C12.881 0 12.199 0.138 11.643 0.37C11.1749 0.56867 10.7489 0.854779 10.388 1.213C10.256 1.343 10.138 1.471 10.041 1.577L10.011 1.61C9.901 1.73 9.824 1.812 9.751 1.877C9.627 1.987 9.571 2 9.5 2C9.429 2 9.373 1.987 9.25 1.877C9.15889 1.79211 9.0718 1.70301 8.989 1.61L8.959 1.577C8.861 1.471 8.744 1.342 8.612 1.213C8.25257 0.853188 7.82623 0.567153 7.357 0.371C6.801 0.138 6.12 0 5.25 0ZM1.5 4.948C1.5 4.064 2.015 3.207 2.816 2.538C3.623 1.865 4.584 1.5 5.25 1.5C5.958 1.5 6.438 1.612 6.779 1.754C7.116 1.895 7.354 2.082 7.564 2.287C7.664 2.385 7.754 2.483 7.854 2.593L7.884 2.624C7.989 2.739 8.114 2.875 8.253 2.998C8.55 3.263 8.945 3.5 9.5 3.5C10.055 3.5 10.45 3.263 10.747 2.998C10.885 2.875 11.011 2.739 11.117 2.624L11.145 2.593C11.245 2.483 11.336 2.385 11.436 2.287C11.6596 2.05886 11.9265 1.87766 12.221 1.754C12.562 1.612 13.042 1.5 13.75 1.5C14.416 1.5 15.377 1.865 16.184 2.538C16.984 3.207 17.5 4.064 17.5 4.948V4.952C17.5 5.632 17.5 6.724 16.451 7.953C16.43 7.97867 16.4103 8.00537 16.392 8.033C15.912 8.776 15.505 9.761 15.5 10.746C15.49 12.466 15.108 13.84 14.603 14.756C14.07 15.726 13.52 16 13.25 16C13.187 16 13.171 15.987 13.168 15.984C13.1171 15.9369 13.0777 15.8788 13.053 15.814C12.929 15.547 12.843 15.112 12.766 14.47C12.7407 14.2553 12.716 14.0247 12.692 13.778C12.577 12.651 12.433 11.232 11.95 9.98L11.924 9.92C11.535 9.127 10.736 8.5 9.75 8.5H9.25C8.264 8.5 7.465 9.127 7.076 9.92C6.387 11.327 6.308 12.907 6.248 14.081L6.225 14.523C6.185 15.177 6.129 15.587 6.02 15.83C5.975 15.933 5.939 15.96 5.929 15.967C5.922 15.972 5.88 16 5.75 16C5.309 16 4.768 15.695 4.294 14.774C3.827 13.867 3.51 12.493 3.5 10.746C3.495 9.874 3.176 9.006 2.777 8.31C2.65753 8.11365 2.52136 7.92796 2.37 7.755L2.36 7.745C1.51 6.734 1.5 5.625 1.5 4.948Z" fill="black"/>
  </svg>
);

const colores_predefinidos = [
  '#000000', '#FFFFFF', '#ef4444', '#22c55e', '#3b82f6',
  '#eab308', '#a855f7', '#ec4899', '#6b7280',
];

const tamanos_fuente = [
  { label: '8px', value: '8px' },
  { label: '10px', value: '10px' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px', value: '32px' },
  { label: '36px', value: '36px' },
  { label: '48px', value: '48px' },
];

const CustomOrderedList = OrderedList.extend({
  addInputRules() {
    return [
      wrappingInputRule({
        find: /^\s*(\d+)\.\s$/,
        type: this.type,
        getAttributes: (match) => {
          const attributes = this.editor.state.selection.$from.parent.attrs
          return {
            start: +match[1],
            ...(attributes.textAlign ? { textAlign: attributes.textAlign } : {})
          }
        },
      }),
    ]
  },
})

const CustomBulletList = BulletList.extend({
  addInputRules() {
    return [
      wrappingInputRule({
        find: /^\s*([-+*])\s$/,
        type: this.type,
        getAttributes: () => {
          const attributes = this.editor.state.selection.$from.parent.attrs
          return attributes.textAlign ? { textAlign: attributes.textAlign } : {}
        },
      }),
    ]
  },
})

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderStyle: {
        default: 'solid',
        parseHTML: (element: HTMLElement) => element.style?.borderStyle || 'solid',
        renderHTML: () => ({}),
      },
      borderWidth: {
        default: 1,
        parseHTML: (element: HTMLElement) => {
          const bw = element.style?.borderWidth;
          const n = bw ? parseInt(bw, 10) : 1;
          return Number.isFinite(n) ? n : 1;
        },
        renderHTML: () => ({}),
      },
      borderColor: {
        default: '#cbd5e1',
        parseHTML: (element: HTMLElement) => element.style?.borderColor || '#cbd5e1',
        renderHTML: () => ({}),
      },
      backgroundColor: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style?.backgroundColor || null,
        renderHTML: () => ({}),
      },
    } as any;
  },
  renderHTML({ node, HTMLAttributes }) {
    const { borderStyle = 'solid', borderWidth = 1, borderColor = '#cbd5e1', backgroundColor = null } = node.attrs as any;
    const existingStyle = (HTMLAttributes as any).style || '';
    const borderCss = `border: ${borderWidth}px ${borderStyle} ${borderColor};`;
    const bgCss = backgroundColor ? `background-color: ${backgroundColor};` : '';
    const style = existingStyle ? `${existingStyle}; ${borderCss} ${bgCss}` : `${borderCss} ${bgCss}`;
    return [
      'td',
      mergeAttributes(HTMLAttributes, {
        style,
      }),
      0,
    ];
  },
}) as typeof TableCell;

const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderStyle: {
        default: 'solid',
        parseHTML: (element: HTMLElement) => element.style?.borderStyle || 'solid',
        renderHTML: () => ({}),
      },
      borderWidth: {
        default: 1,
        parseHTML: (element: HTMLElement) => {
          const bw = element.style?.borderWidth;
          const n = bw ? parseInt(bw, 10) : 1;
          return Number.isFinite(n) ? n : 1;
        },
        renderHTML: () => ({}),
      },
      borderColor: {
        default: '#cbd5e1',
        parseHTML: (element: HTMLElement) => element.style?.borderColor || '#cbd5e1',
        renderHTML: () => ({}),
      },
      backgroundColor: {
        default: '#f8fafc',
        parseHTML: (element: HTMLElement) => element.style?.backgroundColor || '#f8fafc',
        renderHTML: () => ({}),
      },
    } as any;
  },
  renderHTML({ node, HTMLAttributes }) {
    const { borderStyle = 'solid', borderWidth = 1, borderColor = '#cbd5e1', backgroundColor = '#f8fafc' } = node.attrs as any;
    const existingStyle = (HTMLAttributes as any).style || '';
    const borderCss = `border: ${borderWidth}px ${borderStyle} ${borderColor};`;
    const bgCss = backgroundColor ? `background-color: ${backgroundColor};` : '';
    const style = existingStyle ? `${existingStyle}; ${borderCss} ${bgCss}` : `${borderCss} ${bgCss}`;
    return [
      'th',
      mergeAttributes(HTMLAttributes, {
        style,
      }),
      0,
    ];
  },
}) as typeof TableHeader;

const CustomTable = TableExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      tableMode: {
        default: 'auto',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-table-mode') || 'auto',
        renderHTML: (attributes) => ({
          'data-table-mode': attributes.tableMode || 'auto',
        }),
      },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const mode = (node.attrs as any).tableMode === 'full' ? 'full' : 'auto';
    const columns = Math.max(1, node.child(0)?.childCount ?? 1);
    const common = `--table-cols: ${columns};`;
    const style = mode === 'full'
      ? `width: 100%; max-width: 100%; table-layout: fixed; ${common}`
      : `width: auto; max-width: 100%; table-layout: auto; ${common}`;
    const base = mergeAttributes(HTMLAttributes, { 'data-table-mode': mode });
    return ['table', { ...base, style }, 0];
  },
});

export const EditorConEtiquetasPersonalizado = forwardRef<EditorHandle, EditorConEtiquetasPersonalizadoProps>(({
  contenido,
  onChange,
  className,
  minHeight = '150px',
  tamanoPapel = 'carta',
  margenes = { top: 20, right: 20, bottom: 20, left: 20 },
  tamanoPersonalizado = null,
  habilitarEtiquetas = true,
  soloLectura = false,
  mostrarBotonOdontograma = false,
  onAbrirOdontograma,
}, ref) => {
  const mmToPx = (mm: number) => (mm / 25.4) * 96;
  const defaultLetterMm = { widthMm: 216, heightMm: 279 };
  const baseMm = tamanoPersonalizado
    ? { widthMm: tamanoPersonalizado.widthMm, heightMm: tamanoPersonalizado.heightMm }
    : tamanoPapel === 'carta'
      ? defaultLetterMm
      : tamanoPapel === 'legal'
        ? { widthMm: 216, heightMm: 356 }
        : { widthMm: 210, heightMm: 297 };
  const rawPageWidthPx = Math.round(mmToPx(baseMm.widthMm));
  const rawPageHeightPx = Math.round(mmToPx(baseMm.heightMm));
  const fallbackWidthPx = Math.round(mmToPx(defaultLetterMm.widthMm));
  const fallbackHeightPx = Math.round(mmToPx(defaultLetterMm.heightMm));
  const pageWidthPx = Number.isFinite(rawPageWidthPx) && rawPageWidthPx > 0 ? rawPageWidthPx : fallbackWidthPx;
  const pageHeightPx = Number.isFinite(rawPageHeightPx) && rawPageHeightPx > 0 ? rawPageHeightPx : fallbackHeightPx;

  const limiteVerticalMm = Math.max(0, Math.floor(baseMm.heightMm * 0.25));
  const limiteHorizontalMm = Math.max(0, Math.floor(baseMm.widthMm * 0.30));
  const toNonNegativeMm = (valor: number) => Math.max(0, Number.isFinite(valor) ? valor : 0);
  const clampPairMm = (primero: number, segundo: number, limite: number): [number, number] => {
    const limpioPrimero = toNonNegativeMm(primero);
    const limpioSegundo = toNonNegativeMm(segundo);
    const cappedPrimero = Math.min(limpioPrimero, Math.max(0, limite - limpioSegundo));
    const cappedSegundo = Math.min(limpioSegundo, Math.max(0, limite - cappedPrimero));
    return [cappedPrimero, cappedSegundo];
  };
  const margenesAjustadosMm = (() => {
    const [top, bottom] = clampPairMm(margenes.top, margenes.bottom, limiteVerticalMm);
    const [left, right] = clampPairMm(margenes.left, margenes.right, limiteHorizontalMm);
    return { top, bottom, left, right };
  })();

  const rawMarginTopPx = Math.round(mmToPx(margenesAjustadosMm.top));
  const rawMarginBottomPx = Math.round(mmToPx(margenesAjustadosMm.bottom));
  const rawMarginLeftPx = Math.round(mmToPx(margenesAjustadosMm.left));
  const rawMarginRightPx = Math.round(mmToPx(margenesAjustadosMm.right));
  const marginTopPx = Number.isFinite(rawMarginTopPx) && rawMarginTopPx >= 0 ? rawMarginTopPx : 0;
  const marginBottomPx = Number.isFinite(rawMarginBottomPx) && rawMarginBottomPx >= 0 ? rawMarginBottomPx : 0;
  const marginLeftPx = Number.isFinite(rawMarginLeftPx) && rawMarginLeftPx >= 0 ? rawMarginLeftPx : 0;
  const marginRightPx = Number.isFinite(rawMarginRightPx) && rawMarginRightPx >= 0 ? rawMarginRightPx : 0;

  const contentWidthPx = Math.max(0, pageWidthPx - marginLeftPx - marginRightPx);
  const contentHeightPx = Math.max(0, pageHeightPx - marginTopPx - marginBottomPx);
  const effectivePageOffset = pageHeightPx - marginTopPx - marginBottomPx;
  const parsePxValue = (value: string | undefined): number | null => {
    if (!value) return null;
    const match = /([0-9]+(?:\.[0-9]+)?)px/.exec(value.trim());
    return match ? Number(match[1]) : null;
  };
  const requestedMinHeightPx = parsePxValue(minHeight) ?? 0;
  const availableContentHeightPx = Math.max(120, contentHeightPx);
  const resolvedMinHeightPx = requestedMinHeightPx > 0
    ? Math.min(requestedMinHeightPx, availableContentHeightPx)
    : Math.min(400, availableContentHeightPx);
  const [maskClipPath, setMaskClipPath] = useState<string>('none');

  const [colorActual, setColorActual] = useState('#000000');
  const [colorTemporal, setColorTemporal] = useState('#000000');
  const [popoverColorAbierto, setPopoverColorAbierto] = useState(false);
  const [tablePopoverAbierto, setTablePopoverAbierto] = useState(false);
  const [tableRows, setTableRows] = useState(11);
  const [tableCols, setTableCols] = useState(1);
  const [tableMode, setTableMode] = useState<'auto' | 'full'>('auto');
  const [tableBorderWidth, setTableBorderWidth] = useState(1);
  const [tableBorderStyle, setTableBorderStyle] = useState<'solid' | 'dashed' | 'dotted' | 'double'>('solid');
  const [tableBorderColor, setTableBorderColor] = useState('#cbd5e1');
  const [tableCellBg, setTableCellBg] = useState<string>('');
  const [draftBorderWidth, setDraftBorderWidth] = useState(1);
  const [draftBorderStyle, setDraftBorderStyle] = useState<'solid' | 'dashed' | 'dotted' | 'double'>('solid');
  const [draftBorderColor, setDraftBorderColor] = useState('#cbd5e1');
  const [draftFillColor, setDraftFillColor] = useState<string>('');
  const [popoverBordeAbierto, setPopoverBordeAbierto] = useState(false);
  const [popoverFondoAbierto, setPopoverFondoAbierto] = useState(false);
  const [colorTemporalBorde, setColorTemporalBorde] = useState('#cbd5e1');
  const [colorTemporalFondo, setColorTemporalFondo] = useState('#ffffff');
  const [tamanoActual, setTamanoActual] = useState('16px');
  const [mostrarGuiasMargen, setMostrarGuiasMargen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const ZOOM_STEPS = [0.67, 0.75, 0.9, 1, 1.25, 1.5, 1.75, 2];
  const [formatosActivos, setFormatosActivos] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
  });
  const contentMeasureRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageInputValue, setPageInputValue] = useState('1');
  const debounceRef = useRef<number | null>(null);
  const editor = useEditor({
    editable: !soloLectura,
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        heading: false,
      }),
      CustomTable.configure({
        resizable: false,
        HTMLAttributes: {
          class: 'editor-table',
          'data-table-mode': 'auto',
        },
      }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
      TextStyle,
      Color,
      FontSize,
      Underline,
      CustomBulletList,
      CustomOrderedList,
      BaseListItem.extend({
        addKeyboardShortcuts() {
          return {
            Enter: () => {
              if (this.editor.isActive('listItem')) {
                const { state } = this.editor
                const { selection } = state
                if (selection.empty && (selection.$from.parent.content.size === 0 || selection.$from.parent.textContent.trim().length === 0)) {
                  return this.editor.commands.liftListItem('listItem')
                }
                return this.editor.commands.splitListItem('listItem')
              }
              return false
            },
          }
        },
        addAttributes() {
          return {
            ...this.parent?.(),
            color: {
              default: null,
              parseHTML: element => element.style?.color || null,
              renderHTML: attributes => {
                if (!attributes.color) return {};
                return { style: `color: ${attributes.color}` };
              },
            },
          };
        },
      }),
      TextAlign.configure({
        types: ['paragraph', 'heading', 'bulletList', 'orderedList'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
      ...(habilitarEtiquetas ? [EtiquetaNode] : []),
    ],
    content: contenido,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-3 py-0',
      },
    },
    onUpdate: ({ editor }) => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() => {
        onChange(editor.getHTML());
      }, 120);

      const tamano = editor.getAttributes('textStyle').fontSize;
      setTamanoActual(tamano || '16px');
    },
    onSelectionUpdate: ({ editor }) => {
      const color = editor.getAttributes('textStyle').color;
      setColorActual(color || '#000000');
      if (!color) {
        setColorTemporal('#000000');
      } else {
        setColorTemporal(color);
      }

      const tamano = editor.getAttributes('textStyle').fontSize;
      setTamanoActual(tamano || '16px');

      setFormatosActivos({
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        strike: editor.isActive('strike'),
      });

      const cellAttrs = editor.getAttributes('tableCell');
      const headerAttrs = editor.getAttributes('tableHeader');
      const activeBorderWidth = (cellAttrs?.borderWidth ?? headerAttrs?.borderWidth ?? 1) as number;
      const activeBorderStyle = (cellAttrs?.borderStyle ?? headerAttrs?.borderStyle ?? 'solid') as 'solid' | 'dashed' | 'dotted' | 'double';
      const activeBorderColor = (cellAttrs?.borderColor ?? headerAttrs?.borderColor ?? '#cbd5e1') as string;
      const activeBg = (cellAttrs?.backgroundColor ?? headerAttrs?.backgroundColor ?? '') as string;
      const isTable = editor.isActive('table');
      const tableAttrs = isTable ? (editor.getAttributes('table') as any) : null;
      const activeTableMode = isTable && tableAttrs?.tableMode === 'full' ? 'full' : isTable ? 'auto' : tableMode;
      const bw = Number.isFinite(activeBorderWidth) ? activeBorderWidth : 1;
      const bs = ['solid', 'dashed', 'dotted', 'double'].includes(activeBorderStyle) ? activeBorderStyle : 'solid';
      const bc = activeBorderColor || '#cbd5e1';
      const bg = activeBg || '';
      setTableBorderWidth(bw);
      setTableBorderStyle(bs);
      setTableBorderColor(bc);
      setTableCellBg(bg);
      setDraftBorderWidth(bw);
      setDraftBorderStyle(bs);
      setDraftBorderColor(bc);
      setDraftFillColor(bg || '');
      setColorTemporalBorde(bc);
      setColorTemporalFondo(bg || '#ffffff');
      if (isTable) {
        setTableMode(activeTableMode);
      }
    },
  });

  const forceAllTablesFull = () => {
    if (!editor) return;
    const { state } = editor;
    let tr = state.tr;
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'table') {
        tr = tr.setNodeMarkup(pos, node.type, { ...node.attrs, tableMode: 'full' });
      }
      if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
        const attrs = { ...node.attrs } as any;
        if (attrs.colwidth) {
          attrs.colwidth = null;
        }
        tr = tr.setNodeMarkup(pos, node.type, attrs);
      }
    });
    if (tr.docChanged) {
      editor.view.dispatch(tr);
      setTableMode('full');
    }
  };

  useEffect(() => {
    if (editor) {
      editor.setEditable(!soloLectura);
      if (soloLectura && popoverColorAbierto) {
        setPopoverColorAbierto(false);
      }
    }
  }, [editor, soloLectura, popoverColorAbierto]);
  useImperativeHandle(ref, () => ({
    chain: () => editor?.chain(),
    getHTML: () => editor?.getHTML() || '',
  }), [editor]);

  useEffect(() => {
    if (editor && contenido !== editor.getHTML()) {
      const pos = editor.state.selection.anchor;
      editor.commands.setContent(contenido);

      if (pos <= editor.state.doc.content.size) {
        editor.commands.setTextSelection(pos);
      }
    }
  }, [contenido, editor]);

  useEffect(() => {
    if (editor) {
      const color = editor.getAttributes('textStyle').color || '#000000';
      setColorActual(color);
      setColorTemporal(color);
      const tamano = editor.getAttributes('textStyle').fontSize || '16px';
      setTamanoActual(tamano);
    }
  }, [editor]);
  useEffect(() => {
    if (!editor) return;

    const updatePage = () => {
      const { selection } = editor.state;
      const { from } = selection;
      const view = editor.view;
      const coords = view.coordsAtPos(from);
      const dom = view.dom;
      const domRect = dom.getBoundingClientRect();
      const relativeYZoomed = (coords.bottom - 2) - domRect.top;
      const relativeY = relativeYZoomed / zoom;
      const absoluteY = relativeY;
      const pageIndex = Math.max(0, Math.floor(absoluteY / effectivePageOffset));
      setCurrentPage(pageIndex + 1);
    };

    editor.on('selectionUpdate', updatePage);
    editor.on('update', updatePage);

    return () => {
      editor.off('selectionUpdate', updatePage);
      editor.off('update', updatePage);
    };
  }, [editor, zoom, effectivePageOffset]);
  useEffect(() => {
    const el = contentMeasureRef.current;
    if (!el) return;
    const update = () => {
      const h = el.scrollHeight;
      if (effectivePageOffset <= 0) {
        setPageCount(1);
        return;
      }
      const pages = Math.max(1, Math.ceil(h / effectivePageOffset));
      setPageCount(pages);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [effectivePageOffset, contenido]);
  useEffect(() => {
    if (pageCount <= 0) return;
    const pageIndex = currentPage - 1;
    const top = pageIndex * effectivePageOffset;
    const bottom = top + effectivePageOffset;
    const totalContainerHeight = pageCount * effectivePageOffset;
    const buffer = 20;
    const insetTop = Math.max(0, top - buffer);
    const insetBottom = Math.max(0, totalContainerHeight - bottom - buffer);
    setMaskClipPath(`inset(${insetTop}px 0px ${insetBottom}px 0px)`);
  }, [currentPage, pageCount, effectivePageOffset]);
  useEffect(() => {
    setCurrentPage((p) => Math.max(1, Math.min(p, pageCount)));
  }, [pageCount]);
  useEffect(() => {
    setPageInputValue(String(currentPage));
  }, [currentPage]);
  useEffect(() => {
    forceAllTablesFull();
  }, [contentWidthPx]);

  const getActiveTableColumns = () => {
    if (!editor || !editor.isActive('table')) return null;
    const { state } = editor;
    let cols: number | null = null;
    state.doc.nodesBetween(state.selection.from, state.selection.to, (node) => {
      if (node.type.name === 'table' && cols === null) {
        cols = node.firstChild?.childCount ?? 1;
        return false;
      }
      return cols === null;
    });
    return cols;
  };

  const activeTableCols = getActiveTableColumns();
  const autoBlocked = activeTableCols !== null && activeTableCols * 16 > contentWidthPx;
  const autoBlockedMsg = autoBlocked ? 'No hay espacio suficiente para modo auto con los márgenes actuales.' : undefined;
  const irAPagina = (p: number) => {
    const cont = containerRef.current;
    if (!cont) return;
    const page = Math.max(1, Math.min(p, pageCount));
    const top = (page - 1) * pageHeightPx * zoom;
    cont.scrollTo({ top, behavior: 'smooth' });
    setCurrentPage(page);
  };
  if (!editor) {
    return null;
  }
  const [selectionGuardada, setSelectionGuardada] = useState<{ from: number; to: number } | null>(null);
  useEffect(() => {
    if (popoverColorAbierto && editor) {
      const { from, to } = editor.state.selection;
      setSelectionGuardada({ from, to });
      setColorTemporal(colorActual);
    }
  }, [popoverColorAbierto, editor, colorActual]);
  const aplicarColor = (color: string) => {
    if (!editor) return;
    const { from, to } = selectionGuardada || editor.state.selection;
    editor.chain().focus().setTextSelection({ from, to }).setColor(color).run();
    editor.commands.command(({ tr, state }) => {
      const listItemType = state.schema.nodes.listItem;
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type === listItemType) {
          tr.setNodeMarkup(pos, listItemType, { ...node.attrs, color });
        }
      });
      return true;
    });
    editor.chain().setTextSelection({ from, to }).run();
    setColorActual(color);
    setColorTemporal(color);
  };
  const aplicarTamano = (tamano: string) => {
    if (soloLectura) return;
    editor.chain().focus().setFontSize(tamano).run();
    setTamanoActual(tamano);
  };
  const aumentarTamano = () => {
    const tamanoActualIndex = tamanos_fuente.findIndex(t => t.value === tamanoActual);
    if (tamanoActualIndex < tamanos_fuente.length - 1) {
      aplicarTamano(tamanos_fuente[tamanoActualIndex + 1].value);
    }
  };
  const disminuirTamano = () => {
    const tamanoActualIndex = tamanos_fuente.findIndex(t => t.value === tamanoActual);
    if (tamanoActualIndex > 0) {
      aplicarTamano(tamanos_fuente[tamanoActualIndex - 1].value);
    }
  };
  const aumentarZoom = () => {
    const idx = ZOOM_STEPS.findIndex(z => z === zoom);
    if (idx < ZOOM_STEPS.length - 1) setZoom(ZOOM_STEPS[idx + 1]);
  };
  const disminuirZoom = () => {
    const idx = ZOOM_STEPS.findIndex(z => z === zoom);
    if (idx > 0) setZoom(ZOOM_STEPS[idx - 1]);
  };
  const resetZoom = () => setZoom(1);
  const canZoomOut = zoom > ZOOM_STEPS[0];
  const canZoomIn = zoom < ZOOM_STEPS[ZOOM_STEPS.length - 1];
  const tamanoActualIndex = tamanos_fuente.findIndex(t => t.value === tamanoActual);
  const puedeDisminuirTamano = tamanoActualIndex > 0;
  const puedeAumentarTamano = tamanoActualIndex === -1 ? true : tamanoActualIndex < tamanos_fuente.length - 1;
  const MIN_COL_WIDTH_PX = 28;
  const clampTableDimension = (v: number) => Math.max(1, Number.isFinite(v) ? Math.round(v) : 1);
  const nonNegativeWidth = (v: number) => Math.max(0, Number.isFinite(v) ? Math.round(v) : 0);
  const insertarTabla = () => {
    if (soloLectura || !editor) return;
    const rows = clampTableDimension(tableRows);
    const cols = clampTableDimension(tableCols);
    setTableRows(rows);
    setTableCols(cols);
    (editor.chain() as any)
      .focus()
      .insertTable({ rows, cols, withHeaderRow: false })
      .updateAttributes('table', { tableMode })
      .run();
    cambiarModoTabla(tableMode);
    setTablePopoverAbierto(false);
  };
  const estaEnTabla = editor?.isActive('table') ?? false;
  const cambiarModoTabla = (mode: 'auto' | 'full') => {
    setTableMode(mode);
    if (soloLectura || !editor || !editor.isActive('table')) return;
    (editor.chain() as any)
      .focus()
      .updateAttributes('table', { tableMode: mode })
      .setCellAttribute('colwidth', null)
      .run();
  };
  const agregarFilaArriba = () => {
    if (soloLectura || !editor) return;
    (editor.chain() as any).focus().addRowBefore().run();
  };
  const agregarFilaAbajo = () => {
    if (soloLectura || !editor) return;
    (editor.chain() as any).focus().addRowAfter().run();
  };
  const agregarColumnaIzquierda = () => {
    if (soloLectura || !editor) return;
    (editor.chain() as any).focus().addColumnBefore().run();
  };
  const agregarColumnaDerecha = () => {
    if (soloLectura || !editor) return;
    (editor.chain() as any).focus().addColumnAfter().run();
  };
  const eliminarFila = () => {
    if (soloLectura || !editor) return;
    (editor.chain() as any).focus().deleteRow().run();
  };
  const eliminarColumna = () => {
    if (soloLectura || !editor) return;
    (editor.chain() as any).focus().deleteColumn().run();
  };
  const eliminarTabla = () => {
    if (soloLectura || !editor) return;
    (editor.chain() as any).focus().deleteTable().run();
  };
  const combinarCeldas = () => {
    if (soloLectura || !editor) return;
    (editor.chain() as any).focus().mergeCells().run();
  };
  const dividirCelda = () => {
    if (soloLectura || !editor) return;
    (editor.chain() as any).focus().splitCell().run();
  };
  const aplicarBordeTabla = (width?: number, style?: 'solid' | 'dashed' | 'dotted' | 'double', color?: string) => {
    if (soloLectura || !editor) return;
    const newWidth = nonNegativeWidth(width ?? tableBorderWidth);
    const newStyle = style ?? tableBorderStyle;
    const newColor = color ?? tableBorderColor;
    setTableBorderWidth(newWidth);
    setTableBorderStyle(newStyle);
    setTableBorderColor(newColor);
    setDraftBorderWidth(newWidth);
    setDraftBorderStyle(newStyle);
    setDraftBorderColor(newColor);
    (editor.chain() as any).focus()
      .setCellAttribute('borderWidth', newWidth)
      .setCellAttribute('borderStyle', newStyle)
      .setCellAttribute('borderColor', newColor)
      .setCellAttribute('colwidth', null)
      .run();
  };
  const aplicarFondoCelda = (color?: string) => {
    if (soloLectura || !editor) return;
    const newBg = color ?? tableCellBg ?? '';
    setTableCellBg(newBg);
    setDraftFillColor(newBg);
    (editor.chain() as any)
      .focus()
      .setCellAttribute('backgroundColor', newBg || null)
      .setCellAttribute('colwidth', null)
      .run();
  };
  const aplicarCambiosTabla = () => {
    if (!estaEnTabla || soloLectura) return;
    aplicarBordeTabla(draftBorderWidth, draftBorderStyle, draftBorderColor);
    aplicarFondoCelda(draftFillColor);
  };
  const alturaMinDocumentosPx = Math.max(resolvedMinHeightPx, 420);
  const alturaCajaDocumento = `clamp(${alturaMinDocumentosPx}px, 60vh, 760px)`;
  const totalHeightPx = pageCount * effectivePageOffset + marginTopPx + marginBottomPx;
  const areaEscribiblePx = contentWidthPx;
  const areaEscribibleMm = Math.round(((areaEscribiblePx * 25.4) / 96) * 10) / 10;
  const anchoEstimadoTablaPx = tableCols * MIN_COL_WIDTH_PX;
  const anchoEstimadoTablaMm = Math.round(((anchoEstimadoTablaPx * 25.4) / 96) * 10) / 10;
  const superaAnchoEscribible = anchoEstimadoTablaPx > areaEscribiblePx;
  return (
    <div className="space-y-2">
      <div className={cn('border rounded-lg bg-background shadow-sm flex flex-col', className)}>
        <div className="sticky top-0 z-20 border-b bg-muted/40 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-muted/30">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={disminuirTamano}
                disabled={soloLectura || !puedeDisminuirTamano}
                title="Disminuir tamano"
              >
                A-
              </Button>

              <Select value={tamanoActual} onValueChange={aplicarTamano} disabled={soloLectura}>
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tamanos_fuente.map((tamano) => (
                    <SelectItem key={tamano.value} value={tamano.value}>
                      {tamano.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={aumentarTamano}
                disabled={soloLectura || !puedeAumentarTamano}
                title="Aumentar tamano"
              >
                A+
              </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            <Toggle
              size="sm"
              pressed={formatosActivos.bold}
              onPressedChange={() => {
                if (soloLectura) return;
                editor.chain().focus().toggleBold().run();
                setFormatosActivos((prev) => ({ ...prev, bold: !prev.bold }));
              }}
              aria-label="Negrita"
              data-state={formatosActivos.bold ? 'on' : 'off'}
              disabled={soloLectura}
            >
              <Bold className="h-4 w-4" />
            </Toggle>

            <Toggle
              size="sm"
              pressed={formatosActivos.italic}
              onPressedChange={() => {
                if (soloLectura) return;
                editor.chain().focus().toggleItalic().run();
                setFormatosActivos((prev) => ({ ...prev, italic: !prev.italic }));
              }}
              aria-label="Cursiva"
              data-state={formatosActivos.italic ? 'on' : 'off'}
              disabled={soloLectura}
            >
              <Italic className="h-4 w-4" />
            </Toggle>

            <Toggle
              size="sm"
              pressed={formatosActivos.underline}
              onPressedChange={() => {
                if (soloLectura) return;
                editor.chain().focus().toggleUnderline().run();
                setFormatosActivos((prev) => ({ ...prev, underline: !prev.underline }));
              }}
              aria-label="Subrayado"
              data-state={formatosActivos.underline ? 'on' : 'off'}
              disabled={soloLectura}
            >
              <UnderlineIcon className="h-4 w-4" />
            </Toggle>

            <Toggle
              size="sm"
              pressed={formatosActivos.strike}
              onPressedChange={() => {
                if (soloLectura) return;
                editor.chain().focus().toggleStrike().run();
                setFormatosActivos((prev) => ({ ...prev, strike: !prev.strike }));
              }}
              aria-label="Tachado"
              data-state={formatosActivos.strike ? 'on' : 'off'}
              disabled={soloLectura}
            >
              <Strikethrough className="h-4 w-4" />
            </Toggle>

            <div className="w-px h-6 bg-border mx-1" />

            <Toggle
              size="sm"
              pressed={editor.isActive('bulletList')}
              onPressedChange={() => {
                if (soloLectura) return;
                editor.chain().focus().toggleBulletList().run();
              }}
              aria-label="Lista con vinetas"
              data-state={editor.isActive('bulletList') ? 'on' : 'off'}
              disabled={soloLectura}
            >
              <List className="h-4 w-4" />
            </Toggle>

            <Toggle
              size="sm"
              pressed={editor.isActive('orderedList')}
              onPressedChange={() => {
                if (soloLectura) return;
                editor.chain().focus().toggleOrderedList().run();
              }}
              aria-label="Lista numerada"
              data-state={editor.isActive('orderedList') ? 'on' : 'off'}
              disabled={soloLectura}
            >
              <ListOrdered className="h-4 w-4" />
            </Toggle>

            <div className="w-px h-6 bg-border mx-1" />

            <Toggle
              size="sm"
              pressed={editor.isActive('bulletList')
                ? (editor.getAttributes('bulletList').textAlign === 'left' || !editor.getAttributes('bulletList').textAlign)
                : (editor.isActive('orderedList')
                  ? (editor.getAttributes('orderedList').textAlign === 'left' || !editor.getAttributes('orderedList').textAlign)
                  : editor.isActive({ textAlign: 'left' }))}
              onPressedChange={() => {
                if (soloLectura) return;
                editor.chain().focus().setTextAlign('left').run();
              }}
              aria-label="Alinear a la izquierda"
              data-state={(editor.isActive('bulletList')
                ? (editor.getAttributes('bulletList').textAlign === 'left' || !editor.getAttributes('bulletList').textAlign)
                : (editor.isActive('orderedList')
                  ? (editor.getAttributes('orderedList').textAlign === 'left' || !editor.getAttributes('orderedList').textAlign)
                  : editor.isActive({ textAlign: 'left' }))) ? 'on' : 'off'}
              disabled={soloLectura}
            >
              <AlignLeft className="h-4 w-4" />
            </Toggle>

            <Toggle
              size="sm"
              pressed={editor.isActive('bulletList')
                ? editor.getAttributes('bulletList').textAlign === 'center'
                : (editor.isActive('orderedList')
                  ? editor.getAttributes('orderedList').textAlign === 'center'
                  : editor.isActive({ textAlign: 'center' }))}
              onPressedChange={() => {
                if (soloLectura) return;
                editor.chain().focus().setTextAlign('center').run();
              }}
              aria-label="Centrar"
              data-state={(editor.isActive('bulletList')
                ? editor.getAttributes('bulletList').textAlign === 'center'
                : (editor.isActive('orderedList')
                  ? editor.getAttributes('orderedList').textAlign === 'center'
                  : editor.isActive({ textAlign: 'center' }))) ? 'on' : 'off'}
              disabled={soloLectura}
            >
              <AlignCenter className="h-4 w-4" />
            </Toggle>

            <Toggle
              size="sm"
              pressed={editor.isActive('bulletList')
                ? editor.getAttributes('bulletList').textAlign === 'right'
                : (editor.isActive('orderedList')
                  ? editor.getAttributes('orderedList').textAlign === 'right'
                  : editor.isActive({ textAlign: 'right' }))}
              onPressedChange={() => {
                if (soloLectura) return;
                editor.chain().focus().setTextAlign('right').run();
              }}
              aria-label="Alinear a la derecha"
              data-state={(editor.isActive('bulletList')
                ? editor.getAttributes('bulletList').textAlign === 'right'
                : (editor.isActive('orderedList')
                  ? editor.getAttributes('orderedList').textAlign === 'right'
                  : editor.isActive({ textAlign: 'right' }))) ? 'on' : 'off'}
              disabled={soloLectura}
            >
              <AlignRight className="h-4 w-4" />
            </Toggle>

            <div className="w-px h-6 bg-border mx-1" />

            <Popover open={tablePopoverAbierto} onOpenChange={(open) => !soloLectura && setTablePopoverAbierto(open)}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  aria-label="Insertar tabla"
                  disabled={soloLectura}
                >
                  <TableIcon className="h-4 w-4 mr-2" />
                  Tabla
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[460px] p-4" align="start">
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-4 gap-3 items-end">
                    <div className="space-y-1 col-span-1">
                      <Label className="text-xs">Filas</Label>
                      <Input
                        type="number"
                        min={1}
                        value={tableRows}
                        onChange={(e) => setTableRows(clampTableDimension(parseInt(e.target.value, 10)))}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <Label className="text-xs">Columnas</Label>
                      <Input
                        type="number"
                        min={1}
                        value={tableCols}
                        onChange={(e) => setTableCols(clampTableDimension(parseInt(e.target.value, 10)))}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <Label className="text-xs">Tipo de tabla</Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={tableMode === 'full'}
                          onCheckedChange={(checked) => {
                            if (!checked && autoBlocked) return;
                            cambiarModoTabla(checked ? 'full' : 'auto');
                          }}
                          disabled={soloLectura || autoBlocked}
                          title={autoBlocked ? autoBlockedMsg : undefined}
                          className={cn(autoBlocked ? 'opacity-50 cursor-not-allowed' : '')}
                        />
                        <span className="text-xs text-muted-foreground">Ancho completo (100%)</span>
                      </div>
                    </div>
                    <div className="flex items-end col-span-1">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={insertarTabla}
                        disabled={soloLectura || (superaAnchoEscribible && tableMode !== 'full')}
                      >
                        Insertar tabla
                      </Button>
                    </div>
                  </div>
                  {superaAnchoEscribible && (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 flex flex-col gap-1">
                      <span className="font-semibold">Advertencia</span>
                      <span>
                        {`Con ${tableCols} columnas, el ancho mínimo estimado es ~${Math.round(anchoEstimadoTablaPx)}px (${anchoEstimadoTablaMm}mm) y supera el área escribible disponible (~${Math.round(areaEscribiblePx)}px / ${areaEscribibleMm}mm).`}
                      </span>
                      <span>Reduce columnas o cambia a “Ancho completo (100%)” para habilitar la creación.</span>
                    </div>
                  )}

                  <div className="pt-2 border-t space-y-2">
                    <div className="text-xs text-muted-foreground">Acciones rápidas (selecciona dentro de la tabla)</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={agregarFilaArriba} disabled={!estaEnTabla || soloLectura}>
                        Fila arriba
                      </Button>
                      <Button variant="outline" size="sm" onClick={agregarFilaAbajo} disabled={!estaEnTabla || soloLectura}>
                        Fila abajo
                      </Button>
                      <Button variant="outline" size="sm" onClick={agregarColumnaIzquierda} disabled={!estaEnTabla || soloLectura}>
                        Columna izq.
                      </Button>
                      <Button variant="outline" size="sm" onClick={agregarColumnaDerecha} disabled={!estaEnTabla || soloLectura}>
                        Columna der.
                      </Button>
                      <Button variant="outline" size="sm" onClick={eliminarFila} disabled={!estaEnTabla || soloLectura}>
                        Eliminar fila
                      </Button>
                      <Button variant="outline" size="sm" onClick={eliminarColumna} disabled={!estaEnTabla || soloLectura}>
                        Eliminar columna
                      </Button>
                      <Button variant="outline" size="sm" onClick={combinarCeldas} disabled={!estaEnTabla || soloLectura}>
                        Combinar celdas
                      </Button>
                      <Button variant="outline" size="sm" onClick={dividirCelda} disabled={!estaEnTabla || soloLectura}>
                        Dividir celda
                      </Button>
                      <Button variant="destructive" size="sm" className="col-span-2" onClick={eliminarTabla} disabled={!estaEnTabla || soloLectura}>
                        Eliminar tabla
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 border-t space-y-3">
                    <div className="text-xs text-muted-foreground">Bordes y relleno (selección actual)</div>
                    <div className="grid grid-cols-4 gap-3 items-start">
                      <div className="space-y-1">
                        <Label className="text-xs">Grosor (px)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={draftBorderWidth}
                          onChange={(e) => setDraftBorderWidth(nonNegativeWidth(parseFloat(e.target.value)))}
                          className="h-8"
                          disabled={!estaEnTabla || soloLectura}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Estilo</Label>
                        <Select
                          value={draftBorderStyle}
                          onValueChange={(v) => setDraftBorderStyle(v as 'solid' | 'dashed' | 'dotted' | 'double')}
                          disabled={!estaEnTabla || soloLectura}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Sólido</SelectItem>
                            <SelectItem value="dashed">Discontinuo</SelectItem>
                            <SelectItem value="dotted">Punteado</SelectItem>
                            <SelectItem value="double">Doble</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Color borde</Label>
                        <Popover open={popoverBordeAbierto} onOpenChange={(open) => !soloLectura && setPopoverBordeAbierto(open)}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-full justify-start">
                              <span className="w-4 h-4 rounded border mr-2" style={{ backgroundColor: draftBorderColor }} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3" align="start">
                            <div className="space-y-3">
                              <HexColorPicker color={colorTemporalBorde} onChange={(c) => {
                                setColorTemporalBorde(c);
                                setDraftBorderColor(c);
                              }} />
                              <div className="grid grid-cols-9 gap-2">
                                {colores_predefinidos.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    className={cn('h-6 w-6 rounded border-2 hover:scale-110 transition-transform', color === '#FFFFFF' ? 'border-gray-300' : 'border-border')}
                                    style={{ backgroundColor: color }}
                                    onClick={() => {
                                      setDraftBorderColor(color);
                                      setColorTemporalBorde(color);
                                    }}
                                    title={color}
                                  />
                                ))}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => setPopoverBordeAbierto(false)}
                              >
                                Cerrar
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Relleno celdas</Label>
                        <Popover open={popoverFondoAbierto} onOpenChange={(open) => !soloLectura && setPopoverFondoAbierto(open)}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-full justify-start">
                              <span className="w-4 h-4 rounded border mr-2" style={{ backgroundColor: draftFillColor || '#ffffff' }} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3" align="start">
                            <div className="space-y-3">
                              <HexColorPicker color={colorTemporalFondo} onChange={(c) => {
                                setColorTemporalFondo(c);
                                setDraftFillColor(c);
                              }} />
                              <div className="grid grid-cols-9 gap-2">
                                {colores_predefinidos.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    className={cn('h-6 w-6 rounded border-2 hover:scale-110 transition-transform', color === '#FFFFFF' ? 'border-gray-300' : 'border-border')}
                                    style={{ backgroundColor: color }}
                                    onClick={() => {
                                      setDraftFillColor(color);
                                      setColorTemporalFondo(color);
                                    }}
                                    title={color}
                                  />
                                ))}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const empty = '';
                                    setDraftFillColor(empty);
                                    setColorTemporalFondo('#ffffff');
                                  }}
                                >
                                  Quitar relleno
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPopoverFondoAbierto(false)}
                                >
                                  Cerrar
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={aplicarCambiosTabla}
                        disabled={!estaEnTabla || soloLectura}
                      >
                        Aplicar cambios
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={popoverColorAbierto} onOpenChange={(open) => !soloLectura && setPopoverColorAbierto(open)}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Seleccionar color"
                  disabled={soloLectura}
                >
                  <div
                    className="w-4 h-4 rounded border border-border"
                    style={{ backgroundColor: colorActual }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 p-3"
                align="start"
                onInteractOutside={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('.react-colorful') || target.closest('[role="dialog"]')) {
                    e.preventDefault();
                  }
                }}
                onPointerDownOutside={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('.react-colorful') || target.closest('[role="dialog"]')) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="space-y-3">
                  <HexColorPicker
                    color={colorTemporal}
                    onChange={(color) => setColorTemporal(color)}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-1 rounded border bg-muted" style={{ backgroundColor: colorTemporal, color: '#fff' }}>
                      {colorTemporal.toUpperCase()}
                    </span>
                    {colorTemporal !== colorActual && (
                      <span className="text-muted-foreground">(no aplicado)</span>
                    )}
                  </div>
                  <div className="grid grid-cols-9 gap-2">
                    {colores_predefinidos.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          'h-6 w-6 rounded border-2 hover:scale-110 transition-transform',
                          color === '#FFFFFF' ? 'border-gray-300' : 'border-border'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => aplicarColor(color)}
                        title={color}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (soloLectura) return;
                      aplicarColor(colorTemporal);
                      setPopoverColorAbierto(false);
                    }}
                    disabled={soloLectura}
                  >
                    <Check className="h-4 w-4 mr-2" /> Aplicar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setColorTemporal(colorActual);
                      setPopoverColorAbierto(false);
                    }}
                    disabled={soloLectura}
                  >
                    Cancelar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {mostrarBotonOdontograma && (
              <span
                className="inline-flex"
                title={!onAbrirOdontograma ? 'Este paciente aún no tiene odontograma. Crea uno primero para habilitar esta opción.' : undefined}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 whitespace-nowrap gap-2 ![&_svg]:h-6 ![&_svg]:w-6"
                  aria-label="Abrir odontograma"
                  onClick={() => {
                    onAbrirOdontograma?.();
                  }}
                  disabled={!onAbrirOdontograma}
                >
                  <IconoDiente />
                  Odontograma
                </Button>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-muted/30">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={disminuirZoom}
                disabled={!canZoomOut}
                title="Reducir zoom"
              >
                -
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={resetZoom}
                title="Restablecer (100%)"
              >
                {Math.round(zoom * 100)}%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={aumentarZoom}
                disabled={!canZoomIn}
                title="Aumentar zoom"
              >
                +
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => irAPagina(currentPage - 1)}
                disabled={currentPage <= 1}
                title="Pagina anterior"
              >
                {'<'}
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Input
                  type="number"
                  min={1}
                  max={pageCount}
                  value={pageInputValue}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPageInputValue(val === '' ? '' : String(Number(val)));
                  }}
                  onBlur={() => {
                    const n = Number(pageInputValue);
                    if (!Number.isFinite(n) || n < 1) {
                      setPageInputValue(String(currentPage));
                      return;
                    }
                    irAPagina(Math.min(Math.max(1, n), pageCount));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const n = Number(pageInputValue);
                      if (!Number.isFinite(n) || n < 1) {
                        setPageInputValue(String(currentPage));
                        return;
                      }
                      irAPagina(Math.min(Math.max(1, n), pageCount));
                    }
                  }}
                  className="h-8 w-16 text-center"
                />
                <span>/ {pageCount}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => irAPagina(currentPage + 1)}
                disabled={currentPage >= pageCount}
                title="Pagina siguiente"
              >
                {'>'}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Guias de margen</Label>
              <Switch checked={mostrarGuiasMargen} onCheckedChange={setMostrarGuiasMargen} />
            </div>
          </div>
        </div>
        <div
          className="editor-doc-container flex-1"
          style={{
            height: alturaCajaDocumento,
            maxHeight: alturaCajaDocumento,
            overflowY: 'auto',
            overflowX: 'auto',
            display: 'block',
            padding: '12px',
            position: 'relative',
            zIndex: 0,
          }}
          ref={containerRef}
        >
          <div
            className="editor-doc-zoom-sizer"
            style={{
              width: `${Math.max(1, pageWidthPx * zoom)}px`,
              position: 'relative',
              height: `${totalHeightPx * zoom}px`,
              margin: '0 auto',
              overflow: 'hidden',
            }}
          >
            <div className="absolute top-0 left-0" style={{ width: pageWidthPx, height: totalHeightPx, transform: `scale(${zoom})`, transformOrigin: 'top left', pointerEvents: 'none', zIndex: 0 }}>
              {Array.from({ length: pageCount }).map((_, i) => {
                const isCurrentPage = (i + 1) === currentPage;
                const topPos = i * effectivePageOffset + marginTopPx;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      top: topPos,
                      left: 0,
                      width: pageWidthPx,
                      height: effectivePageOffset,
                      background: '#fff',
                      zIndex: isCurrentPage ? 1 : 0,
                      boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                      pointerEvents: 'none',
                    }}
                  />
                );
              })}
            </div>
            {mostrarGuiasMargen && (
              <div className="absolute top-0 left-0 pointer-events-none" style={{ width: pageWidthPx, height: totalHeightPx, transform: `scale(${zoom})`, transformOrigin: 'top left', zIndex: 20 }}>
                {Array.from({ length: pageCount }).map((_, i) => {
                  if ((i + 1) !== currentPage) return null;
                  const topPos = i * effectivePageOffset + marginTopPx;
                  return (
                    <div key={i} style={{ position: 'absolute', top: topPos, left: 0, width: pageWidthPx, height: effectivePageOffset }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: pageWidthPx, borderTop: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: pageWidthPx, borderBottom: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: marginLeftPx, borderLeft: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                      <div style={{ position: 'absolute', top: 0, bottom: 0, right: marginRightPx, borderRight: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                    </div>
                  );
                })}
              </div>
            )}
            <div
              className="absolute top-0 left-0"
              style={{
                width: pageWidthPx,
                height: totalHeightPx,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                zIndex: 30,
                clipPath: maskClipPath,
                transition: 'clip-path 0.2s ease-out'
              }}
            >
              <div style={{ position: 'absolute', top: marginTopPx, left: marginLeftPx, width: contentWidthPx }}>
                <div ref={contentMeasureRef}>
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
            <div className="absolute top-0 left-0 pointer-events-none" style={{ width: pageWidthPx, height: totalHeightPx, transform: `scale(${zoom})`, transformOrigin: 'top left', zIndex: 40 }}>
              {Array.from({ length: pageCount }).map((_, i) => {
                const isCurrentPage = (i + 1) === currentPage;
                const topPos = i * effectivePageOffset + marginTopPx;
                return (
                  <div
                    key={`dim-${i}`}
                    style={{
                      position: 'absolute',
                      top: topPos,
                      left: 0,
                      width: pageWidthPx,
                      height: effectivePageOffset,
                      backgroundColor: isCurrentPage ? 'transparent' : '#e2e8f0',
                      opacity: isCurrentPage ? 0 : 1,
                      borderBottom: i < pageCount - 1 ? '1px solid #94a3b8' : 'none',
                      transition: 'opacity 0.2s ease, background-color 0.2s ease',
                      pointerEvents: isCurrentPage ? 'none' : 'auto',
                      cursor: isCurrentPage ? 'text' : 'pointer',
                    }}
                    onClick={(e) => {
                      if (!isCurrentPage) {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentPage(i + 1);
                      }
                    }}
                  >
                    {!isCurrentPage && (
                      <div className="w-full h-full flex flex-col items-center justify-center opacity-50">
                        <span className="text-slate-500 font-bold text-lg select-none">Pagina {i + 1}</span>
                        <span className="text-slate-400 text-xs select-none">(Clic para editar)</span>
                      </div>
                    )}
                    {isCurrentPage && (
                      <div style={{ position: 'absolute', bottom: 4, right: 8, fontSize: '10px', color: '#94a3b8', pointerEvents: 'none' }}>
                        Pag. {i + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="absolute top-0 left-0 pointer-events-none" style={{ width: pageWidthPx, height: totalHeightPx, transform: `scale(${zoom})`, transformOrigin: 'top left', zIndex: 50 }}>
              {(() => {
                const topPos = (currentPage - 1) * effectivePageOffset + marginTopPx;
                return (
                  <>
                    {marginTopPx > 0 && (
                      <div
                        className="margin-deploy-top"
                        style={{
                          position: 'absolute',
                          top: topPos - marginTopPx,
                          left: 0,
                          width: pageWidthPx,
                          height: marginTopPx,
                          backgroundColor: '#fff',
                          boxShadow: '0 -2px 5px rgba(0,0,0,0.05)',
                        }}
                      >
                        {mostrarGuiasMargen && (
                          <>
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: marginLeftPx, borderLeft: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                            <div style={{ position: 'absolute', top: 0, bottom: 0, right: marginRightPx, borderRight: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                          </>
                        )}
                      </div>
                    )}
                    {marginBottomPx > 0 && (
                      <div
                        className="margin-deploy-bottom"
                        style={{
                          position: 'absolute',
                          top: topPos + effectivePageOffset,
                          left: 0,
                          width: pageWidthPx,
                          height: marginBottomPx,
                          backgroundColor: '#fff',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                        }}
                      >
                        {mostrarGuiasMargen && (
                          <>
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: marginLeftPx, borderLeft: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                            <div style={{ position: 'absolute', top: 0, bottom: 0, right: marginRightPx, borderRight: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                          </>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <style>{`
          .ProseMirror {
            min-height: ${resolvedMinHeightPx}px;
            white-space: pre-wrap;
            background-color: transparent !important;
            padding: 0;
            color: #000000;
            box-sizing: content-box;
            overflow-wrap: break-word;
            word-break: break-word;
            border-spacing: 0;
            box-sizing: border-box;
            hyphens: auto;
          }
          .ProseMirror:focus {
            outline: none;
          }
          .ProseMirror p {
            margin: 0.5em 0;
            min-height: 1em;
            min-width: 0;
            box-sizing: border-box;
            color: inherit;
            max-width: 100%;
          }
          .ProseMirror br {
            display: block;
            margin: 0.5em 0;
          }
          .ProseMirror ul,
          .ProseMirror ol {
            padding-left: 2rem;
            margin: 0.5rem 0;
            list-style-position: outside;
            color: currentColor;
          }
          .ProseMirror ul li,
          .ProseMirror ol li {
            margin: 0.25rem 0;
            display: list-item;
            color: currentColor;
          }
          .ProseMirror ul li::marker,
          .ProseMirror ol li::marker {
            color: currentColor;
          }
          .ProseMirror ul {
            list-style-type: disc;
            display: block;
          }
          .ProseMirror ol {
            list-style-type: decimal;
            display: block;
          }
          .ProseMirror code,
          .ProseMirror blockquote,
          .ProseMirror div {
            overflow-wrap: break-word;
            white-space: normal;
          }
          .ProseMirror p,
          .ProseMirror ul,
          .ProseMirror ol {
            max-width: 100%;
          }
          .ProseMirror ul[style*="text-align: center"],
          .ProseMirror ol[style*="text-align: center"] {
            display: table;
            text-align: left;
            list-style-position: outside;
            padding-left: 2rem;
            margin-left: auto;
            margin-right: auto;
          }
          .ProseMirror ul[style*="text-align: right"],
          .ProseMirror ol[style*="text-align: right"] {
            display: table;
            text-align: left;
            list-style-position: outside;
            padding-left: 2rem;
            margin-left: auto;
            margin-right: 0;
          }
          .ProseMirror ul[style*="text-align: left"],
          .ProseMirror ol[style*="text-align: left"] {
            display: block;
            text-align: left;
            list-style-position: outside;
            padding-left: 2rem;
            margin-left: 0;
            margin-right: auto;
          }
          .ProseMirror ul[style*="text-align: center"] li,
          .ProseMirror ol[style*="text-align: center"] li,
          .ProseMirror ul[style*="text-align: right"] li,
          .ProseMirror ol[style*="text-align: right"] li {
            text-align: left;
            display: list-item;
          }
          .ProseMirror table {
            max-width: 100%;
            border-collapse: collapse;
            margin: 0.5rem 0;
            border-spacing: 0;
            box-sizing: border-box;
          }
          .ProseMirror table[data-table-mode="auto"] {
            width: auto;
            table-layout: auto;
            display: table;
          }
          .ProseMirror table[data-table-mode="full"] {
            width: 100% !important;
            max-width: 100%;
            table-layout: fixed;
          }
          .ProseMirror table td,
          .ProseMirror table th {
            border: 1px solid #cbd5e1;
            padding: 2px 4px;
            vertical-align: top;
            position: relative;
            word-break: break-word;
            overflow-wrap: break-word;
            white-space: normal;
            min-width: 0;
            box-sizing: border-box;
          }
          .ProseMirror table th {
            background-color: #f8fafc;
            font-weight: 600;
          }
          .ProseMirror table p {
            margin: 0;
            max-width: 100%;
          }
          .ProseMirror .selectedCell:after {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            pointer-events: none;
            content: '';
            background: rgba(59, 130, 246, 0.12);
            outline: 1px solid rgba(59, 130, 246, 0.5);
          }
          button[data-state="on"] {
            background-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
          }
          .ProseMirror table[data-table-mode="full"] td,
          .ProseMirror table[data-table-mode="full"] th {
            width: calc(100% / var(--table-cols, 1));
            min-width: 16px;
          }
          .etiqueta-plantilla {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            margin: 0 2px;
            border-radius: 0.375rem;
            background-color: #dbeafe;
            border: 1px solid #93c5fd;
          }
          
          .etiqueta-eliminada {
            background-color: #fee2e2;
            border: 1px solid #fca5a5;
          }

          @keyframes deploy-vertical {
            from { transform: scaleY(0); }
            to { transform: scaleY(1); }
          }
          .margin-deploy-top {
            transform-origin: bottom;
            animation: deploy-vertical 0.3s ease-out forwards;
          }
          .margin-deploy-bottom {
            transform-origin: top;
            animation: deploy-vertical 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
});

EditorConEtiquetasPersonalizado.displayName = 'EditorConEtiquetasPersonalizado';