import { useMemo, useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Transformer, Group } from 'react-konva';
import type Konva from 'konva';
import { PiezaAfectada } from '@/tipos';
import { useClinica } from '@/contextos/clinica-contexto';
import { MolarCuadrado } from './dientes/Molar-cuadrado';
import { MolarCircular } from './dientes/Molar-circular';
import { Premolar4Cuadrado } from './dientes/Premolar4-cuadrado';
import { Premolar4Circular } from './dientes/Premolar4-circular';
import { Premolar5Cuadrado } from './dientes/Premolar5-cuadrado';
import { Premolar5Circular } from './dientes/Premolar5-circular';
import { IncisivoCuadrado } from './dientes/Incisivo-cuadrado';
import { IncisivoCircular } from './dientes/Incisivo-circular';
import { DienteSVGProps } from './dientes/types';

export interface SimbologiaAnadida {
    id: string;
    aplicacionId?: number;
    simboloId: number;
    nombre: string;
    imagen_base64: string;
    descripcion?: string;
    categoria?: 'TRATAMIENTO_PATOLOGIA' | 'CONDICION_HALLAZGO';
    color_principal?: string;
    color_secundario?: string | null;
    color_hover: string;
    estado?: 'REALIZADO' | 'POR_REALIZAR';
    piezasAsignadas: PiezaAfectada[];
    transformacion?: {
        x: number;
        y: number;
        scaleX: number;
        scaleY: number;
        rotation: number;
        color?: string;
        hover_color?: string;
        estado?: 'REALIZADO' | 'POR_REALIZAR';
    };
    esImagen?: boolean;
}


interface OdontogramaChartProps {
    simbologiasAnadidas: SimbologiaAnadida[];
    simbologiaActiva: string | null;
    onSimbologiaSelect?: (id: string) => void;
    onPiezaClick: (numeroPieza: number, parte: string) => void;
    piezasSeleccionadas: PiezaAfectada[];
    simbologiaHover: string | null;
    onSimbologiaHover: (id: string | null) => void;
    modoAsignacion: boolean;
    modoEdicionPosicion: boolean;
    modoDibujo: boolean;
    herramientaDibujo?: 'pencil' | 'eraser';
    colorDibujo?: string;
    grosorDibujo?: number;
    mostrarGrid: boolean;
    mostrarAsignaciones?: boolean;
    dibujos: any[];
    setDibujos: (dibujos: any[]) => void;
    escala: number;
    mostrarNumeros: boolean;
    colorFondo: string;
    tipo?: 'adulto' | 'nino';
    configuracionDientes: any;
    setConfiguracionDientes: (config: any) => void;
    onUpdateSimboloTransform: (id: string, transform: any) => void;
    onDienteHover?: (numero: number | null) => void;
    onConfigChangeStart?: () => void;
    onConfigChangeEnd?: () => void;
    stageRef?: any;
}

const FILA_SUPERIOR_ADULTO = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const FILA_INFERIOR_ADULTO = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const FILA_SUPERIOR_NINO = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const FILA_INFERIOR_NINO = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

const getTipoDiente = (numero: number): 'molar' | 'premolar-4' | 'premolar-5' | 'incisor' => {
    const isChild = numero > 50;
    const pos = numero % 10;
    
    if (isChild) {
        if (pos === 4 || pos === 5) return 'molar';
        return 'incisor'; 
    } else {
        if (pos >= 6 && pos <= 8) return 'molar';
        if (pos === 4) return 'premolar-4';
        if (pos === 5) return 'premolar-5';
        return 'incisor';
    }
};

interface DienteProps {
    numero: number;
    invertido: boolean;
    simbologiasAnadidas: SimbologiaAnadida[];
    simbologiaActiva: string | null;
    onParteClick: (numeroPieza: number, parte: string) => void;
    partesSeleccionadas: string[];
    simbologiaHover: string | null;
    onSimbologiaHover: (id: string | null) => void;
    modoAsignacion: boolean;
    modoEdicionPosicion: boolean;
    estaArrastrando: boolean;
    modoDibujo: boolean;
    baseSize: number;
    mostrarAsignaciones: boolean;
}

function Diente({
    numero,
    invertido,
    simbologiasAnadidas,
    simbologiaActiva,
    onParteClick,
    partesSeleccionadas,
    simbologiaHover,
    onSimbologiaHover,
    modoAsignacion,
    modoEdicionPosicion,
    estaArrastrando,
    modoDibujo,
    baseSize,
    mostrarAsignaciones,
}: DienteProps) {
    const tipo = getTipoDiente(numero);
    const { config_clinica } = useClinica();
    const modelo_dientes = (config_clinica as any)?.modelo_dientes_odontograma === 'circular' ? 'circular' : 'cuadrado';
    const simbologiasQueTienen = useMemo(() => {
        return simbologiasAnadidas.filter(s =>
            s.piezasAsignadas.some(p => p.numero_pieza === numero)
        );
    }, [simbologiasAnadidas, numero]);

    const getParteEstado = (parte: string) => {
        const estaSeleccionada = partesSeleccionadas.includes(parte);
        let simbologiasQueAfectan = simbologiasQueTienen.filter(s =>
            s.piezasAsignadas.some(p =>
                p.numero_pieza === numero && p.partes.includes(parte)
            )
        );

        if (modoAsignacion) {
            simbologiasQueAfectan = simbologiasQueAfectan.filter(s => s.id !== simbologiaActiva);
        }

        const enHover = simbologiaHover && simbologiasQueAfectan.some(s => s.id === simbologiaHover);
        const esActiva = simbologiaActiva && simbologiasQueAfectan.some(s => s.id === simbologiaActiva);
        return { estaSeleccionada, simbologiasQueAfectan, enHover, esActiva };
    };

    const getColorParte = (parte: string): string => {
        const { estaSeleccionada, simbologiasQueAfectan } = getParteEstado(parte);
        if (modoAsignacion) {
            const simbActiva = simbologiasAnadidas.find(s => s.id === simbologiaActiva);
            const colorBase = simbActiva?.color_hover || '#3b82f6';

            if (estaSeleccionada) {
                return colorBase + 'B3';
            }
        }

        if (simbologiasQueAfectan.length > 0 && mostrarAsignaciones) {
            const focusedSymbol = simbologiasQueAfectan.find(s => s.id === simbologiaHover);
            if (focusedSymbol) {
                 return focusedSymbol.color_hover + 'E6';
            }
            
            const color = simbologiasQueAfectan[0].color_hover;
            return color + '80'; 
        }

        return 'white';
    };

    const [parteHover, setParteHover] = useState<string | null>(null);

    const handleParteHover = (parte: string, isEntering: boolean) => {
        setParteHover(isEntering ? parte : null);
        
        const { simbologiasQueAfectan } = getParteEstado(parte);
        if (simbologiasQueAfectan.length > 0 && isEntering) {
            onSimbologiaHover(simbologiasQueAfectan[0].id);
        } else if (!isEntering) {
            onSimbologiaHover(null);
        }
    };
    
    const handleParteClick = (parte: string) => {
        if (modoAsignacion) {
            onParteClick(numero, parte);
        }
    };

    const getColorParteConPreview = (parte: string) => {
        if (modoAsignacion && parte === parteHover) {
             const simbActiva = simbologiasAnadidas.find(s => s.id === simbologiaActiva);
             return (simbActiva?.color_hover || '#3b82f6') + '26';
        }
        return getColorParte(parte);
    };
    
    const svgProps: DienteSVGProps = {
        baseSize,
        invertido,
        modoAsignacion,
        cursorClassName: modoDibujo
            ? 'cursor-none'
            : (modoEdicionPosicion
                ? (estaArrastrando ? 'cursor-grabbing' : 'cursor-grab')
                : (modoAsignacion ? 'cursor-pointer' : 'cursor-default')),
        colores: {
            top: getColorParteConPreview('top'),
            left: getColorParteConPreview('left'),
            bottom: getColorParteConPreview('bottom'),
            right: getColorParteConPreview('right'),
            center: getColorParteConPreview('center'),
            'root-1': getColorParteConPreview('root-1'),
            'root-2': getColorParteConPreview('root-2'),
            'root-3': getColorParteConPreview('root-3'),
        },
        eventos: {
            onClick: handleParteClick,
            onEnter: (p) => handleParteHover(p, true),
            onLeave: (p) => handleParteHover(p, false),
        }
    };

    switch (tipo) {
        case 'molar':
            return modelo_dientes === 'circular'
                ? <MolarCircular {...svgProps} />
                : <MolarCuadrado {...svgProps} />;
        case 'premolar-4':
            return modelo_dientes === 'circular'
                ? <Premolar4Circular {...svgProps} />
                : <Premolar4Cuadrado {...svgProps} />;
        case 'premolar-5':
            return modelo_dientes === 'circular'
                ? <Premolar5Circular {...svgProps} />
                : <Premolar5Cuadrado {...svgProps} />;
        case 'incisor':
            return modelo_dientes === 'circular'
                ? <IncisivoCircular {...svgProps} />
                : <IncisivoCuadrado {...svgProps} />;
    }
}

const KonvaSymbolImage = ({
    shapeProps,
    isSelected,
    onChange,
    base64,
    opacity,
    tintColor,
    onSelect,
    onInteractionStart,
    onInteractionEnd,
}: any) => {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);
    const imageRef = useRef<Konva.Image | null>(null);

    const parseHexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
        if (!hex) return null;
        const raw = hex.trim();
        if (!raw.startsWith('#')) return null;
        const h = raw.slice(1);
        const full = h.length === 3
            ? `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
            : h;
        if (full.length !== 6) return null;
        const n = Number.parseInt(full, 16);
        if (!Number.isFinite(n)) return null;
        return {
            r: (n >> 16) & 255,
            g: (n >> 8) & 255,
            b: n & 255,
        };
    };

    useEffect(() => {
        if (!base64) return;
        const img = new window.Image();
        const src = base64.trim().startsWith('data:image') 
            ? base64 
            : `data:image/png;base64,${base64}`;
        img.src = src;
        img.onload = () => setImage(img);
    }, [base64]);

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    useEffect(() => {
        const node = imageRef.current;
        if (!node) return;
        if (!image) return;
        node.filters([]);
        node.clearCache();

        const rgb = tintColor ? parseHexToRgb(tintColor) : null;
        if (!rgb) {
            node.getLayer()?.batchDraw();
            return;
        }
        const { r, g, b } = rgb;
        const tintFilter = (imageData: any) => {
            const data = imageData.data as Uint8ClampedArray;
            for (let i = 0; i < data.length; i += 4) {
                const a = data[i + 3];
                if (a === 0) continue;
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
            }
        };

        node.cache();
        node.filters([tintFilter]);
        node.getLayer()?.batchDraw();
    }, [tintColor, image]);

    return (
        <>
            <Group
                onClick={() => onSelect?.()}
                onTap={() => onSelect?.()}
                onMouseEnter={(e) => {
                    const stage = e.target.getStage?.();
                    const container = stage?.container?.();
                    if (container) container.style.cursor = isSelected ? 'grab' : 'default';
                }}
                onMouseLeave={(e) => {
                    const stage = e.target.getStage?.();
                    const container = stage?.container?.();
                    if (container) container.style.cursor = 'default';
                }}
                ref={shapeRef}
                {...shapeProps}
                opacity={opacity}
                draggable={isSelected}
                onDragStart={(e) => {
                    const stage = e.target.getStage?.();
                    const container = stage?.container?.();
                    if (container) container.style.cursor = 'grabbing';
                    onInteractionStart?.();
                }}
                onDragEnd={(e) => {
                    onInteractionEnd?.();
                    const stage = e.target.getStage?.();
                    const container = stage?.container?.();
                    if (container) container.style.cursor = isSelected ? 'grab' : 'default';
                    onChange({
                        ...shapeProps,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformStart={() => onInteractionStart?.()}
                onTransformEnd={() => {
                    onInteractionEnd?.();
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onChange({
                        ...shapeProps,
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        scaleX: scaleX,
                        scaleY: scaleY,
                    });
                }}
            >
                <KonvaImage
                    ref={(node) => { imageRef.current = node as any; }}
                    image={image ?? undefined}
                    width={shapeProps?.width ?? 100}
                    height={shapeProps?.height ?? 100}
                />
            </Group>
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};


export const generateInitialConfig = (tipo: string, centerX: number, startY: number, gap: number, rowGap: number, baseSize: number) => {
    const config: any = {};
    const filaSup = tipo === 'nino' ? FILA_SUPERIOR_NINO : FILA_SUPERIOR_ADULTO;
    const filaInf = tipo === 'nino' ? FILA_INFERIOR_NINO : FILA_INFERIOR_ADULTO;
    
    const totalWidthSup = filaSup.length * gap;
    filaSup.forEach((num, i) => {
        config[num] = {
            x: centerX - (totalWidthSup / 2) + (i * gap),
            y: startY
        };
    });

    const totalWidthInf = filaInf.length * gap;
    filaInf.forEach((num, i) => {
        config[num] = {
            x: centerX - (totalWidthInf / 2) + (i * gap),
            y: startY + baseSize + rowGap
        };
    });
    return config;
};

export const generateArchConfig = (tipo: string, centerX: number, startY: number, baseSize: number, extraGap: number = 0) => {
    const config: any = {};
    const filaSup = tipo === 'nino' ? FILA_SUPERIOR_NINO : FILA_SUPERIOR_ADULTO;
    const filaInf = tipo === 'nino' ? FILA_INFERIOR_NINO : FILA_INFERIOR_ADULTO;
    const gap = baseSize + 5;
    const FIXED_ARCH_HEIGHT = 60;
    const GAP_SCALE = 200; 
    const currentSeparation = extraGap * GAP_SCALE;
    const totalWidthSup = filaSup.length * gap;    
    const baseYSup = startY - (currentSeparation / 2); 
    filaSup.forEach((num, i) => {
        const linearX = centerX - (totalWidthSup / 2) + (i * gap);
        const distanceFromCenter = linearX - centerX;
        const maxDist = totalWidthSup / 2;
        const parabol = 1 - Math.pow(Math.abs(distanceFromCenter) / (maxDist * 1.2), 2);
        const finalOfsetCurve = Math.max(0, parabol) * FIXED_ARCH_HEIGHT;

        config[num] = {
            x: linearX,
            y: baseYSup - finalOfsetCurve
        };
    });

    const totalWidthInf = filaInf.length * gap;
    const startYInf = startY + 140 + (currentSeparation / 2);
    filaInf.forEach((num, i) => {
        const linearX = centerX - (totalWidthInf / 2) + (i * gap);
        const distanceFromCenter = linearX - centerX;
        
        const maxDist = totalWidthInf / 2;
        const parabol = 1 - Math.pow(Math.abs(distanceFromCenter) / (maxDist * 1.2), 2);
        const finalOfsetCurve = Math.max(0, parabol) * FIXED_ARCH_HEIGHT;
        
        config[num] = {
            x: linearX,
            y: startYInf + finalOfsetCurve
        };
    });
    
    return config;
};

export function OdontogramaChart({
    simbologiasAnadidas,
    simbologiaActiva,
    onSimbologiaSelect,
    onPiezaClick,
    piezasSeleccionadas,
    simbologiaHover,
    onSimbologiaHover,
    modoAsignacion,
    modoEdicionPosicion,
    modoDibujo,
    herramientaDibujo,
    colorDibujo,
    grosorDibujo,
    mostrarGrid,
    mostrarAsignaciones = true,
    dibujos,
    setDibujos,
    escala,
    mostrarNumeros,
    colorFondo: _colorFondo,
    tipo = 'adulto',
    configuracionDientes,
    setConfiguracionDientes,
    onUpdateSimboloTransform,
    onDienteHover,
    onConfigChangeStart,
    onConfigChangeEnd,
    stageRef
}: OdontogramaChartProps) {
    const BASE_SIZE = 40;
    const BASE_WIDTH = 1000;
    const BASE_HEIGHT = 1000;
    const [canvasSize] = useState({ width: BASE_WIDTH, height: BASE_HEIGHT });
    const isDrawing = useRef(false);
    const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
    const [showCursor, setShowCursor] = useState(false);
    const [pointerEventsState, setPointerEventsState] = useState<'auto' | 'none'>('none');
    const [dienteArrastrando, setDienteArrastrando] = useState<number | null>(null);
    const visibleSimbologias = simbologiasAnadidas;

    const isInteractingRef = useRef(false);
    useEffect(() => {
        if (modoDibujo) {
            setPointerEventsState('auto');
            return;
        }
        if (modoAsignacion) {
            setPointerEventsState('none');
            return;
        }
        if (modoEdicionPosicion) {
            setPointerEventsState(simbologiaActiva ? 'auto' : 'none');
            return;
        }

        setPointerEventsState(simbologiaActiva ? 'auto' : 'none');
    }, [modoDibujo, modoAsignacion, modoEdicionPosicion, simbologiaActiva]);

    const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const currentTarget = e.currentTarget;
        const rect = currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / escala;
        const y = (e.clientY - rect.top) / escala;
        
        if (modoDibujo) {
            setCursorPos({ x, y });
        }

        void x;
        void y;
    };

    const activeConfig = useMemo(() => {
        if (configuracionDientes && Object.keys(configuracionDientes).length > 0) {
            return configuracionDientes;
        }
        
        const centerX = BASE_WIDTH / 2;
        const gap = BASE_SIZE + 5;
        const rowGap = 60;
        const totalContentHeight = (BASE_SIZE * 2) + rowGap;
        const startY = (BASE_HEIGHT - totalContentHeight) / 2;
        
        return generateInitialConfig(tipo, centerX, startY, gap, rowGap, BASE_SIZE);
    }, [configuracionDientes, tipo]);
    useEffect(() => {
        if (!configuracionDientes || Object.keys(configuracionDientes).length === 0) {
            setConfiguracionDientes(activeConfig);
        }
    }, [activeConfig, configuracionDientes, setConfiguracionDientes]);
    const handleMouseDown = (e: any) => {
        if (!modoDibujo) return;
        isDrawing.current = true;
        const stage = e.target.getStage();
        const pos = stage.getRelativePointerPosition();
        
        if (herramientaDibujo === 'eraser') {
            setDibujos([...dibujos, { tool: 'eraser', points: [pos.x, pos.y], color: '#ffffff', strokeWidth: (grosorDibujo || 5) * 2 }]);
        } else {
            setDibujos([...dibujos, { tool: 'pencil', points: [pos.x, pos.y], color: colorDibujo || '#df4b26', strokeWidth: grosorDibujo || 2 }]);
        }
    };

    const handleMouseMove = (e: any) => {
        if (!isDrawing.current || !modoDibujo) return;
        const stage = e.target.getStage();
        const point = stage.getRelativePointerPosition();
        
        const lastDibujo = dibujos[dibujos.length - 1];
        lastDibujo.points = lastDibujo.points.concat([point.x, point.y]);
        dibujos.splice(dibujos.length - 1, 1, lastDibujo);
        setDibujos(dibujos.concat());
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    const containerStyle: React.CSSProperties = {
        width: `${BASE_WIDTH}px`,
        height: `${BASE_HEIGHT}px`,
        transform: `scale(${escala})`,
        transformOrigin: 'top left',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: 'white',
        border: '1px solid #ddd',
        overflow: 'hidden',
        cursor: modoDibujo ? 'none' : 'default',
    };

    const renderGrid = () => {
        if (!mostrarGrid) return null;
        const step = 50;
        const itemsX = BASE_WIDTH / step;
        const itemsY = BASE_HEIGHT / step;
        
        const lines = [];
        for (let i = 0; i < itemsX; i++) {
            lines.push(<div key={`v-${i}`} style={{
                position: 'absolute', 
                left: i * step, 
                top: 0, 
                bottom: 0, 
                width: 1, 
                backgroundColor: '#eee'
            }} />);
        }
        for (let i = 0; i < itemsY; i++) {
            lines.push(<div key={`h-${i}`} style={{
                position: 'absolute', 
                top: i * step, 
                left: 0, 
                right: 0, 
                height: 1, 
                backgroundColor: '#eee'
            }} />);
        }
        return <div style={{position: 'absolute', inset: 0, zIndex: 0}}>{lines}</div>;
    };


    const renderTeeth = () => {
        if (!activeConfig) return null;
        return Object.keys(activeConfig).map((key: any) => {
            const num = parseInt(key);
            const pos = activeConfig[num];
            if (!pos) return null;
            
            const getPartesSeleccionadas = (numero: number): string[] => {
                const pieza = piezasSeleccionadas.find(p => p.numero_pieza === numero);
                return pieza?.partes || [];
            };

            return (
                <div
                    key={`tooth-${num}`}
                    style={{
                        position: 'absolute',
                        left: pos.x,
                        top: pos.y,
                        width: BASE_SIZE,
                        cursor: modoEdicionPosicion
                            ? (dienteArrastrando === num ? 'grabbing' : 'grab')
                            : (modoAsignacion ? 'pointer' : 'default'),
                        userSelect: 'none',
                        zIndex: 1
                    }}
                    onMouseEnter={() => onDienteHover?.(num)}
                    onMouseLeave={() => onDienteHover?.(null)}
                    onMouseDown={(e) => {
                        if (modoEdicionPosicion) {
                            setDienteArrastrando(num);
                            onConfigChangeStart?.();
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const initialX = pos.x;
                            const initialY = pos.y;
                            
                            const onMouseMove = (ev: MouseEvent) => {
                                const dx = ev.clientX - startX;
                                const dy = ev.clientY - startY;
                                
                                const newX = Math.max(0, Math.min(BASE_WIDTH - BASE_SIZE, initialX + (dx / escala)));
                                const newY = Math.max(0, Math.min(BASE_HEIGHT - BASE_SIZE, initialY + (dy / escala)));

                                setConfiguracionDientes({
                                    ...activeConfig,
                                    [num]: { 
                                        x: newX,
                                        y: newY 
                                    }
                                });
                            };
                            
                            const onMouseUp = () => {
                                document.removeEventListener('mousemove', onMouseMove);
                                document.removeEventListener('mouseup', onMouseUp);
                                setDienteArrastrando(null);
                                onConfigChangeEnd?.();
                            };
                            
                            document.addEventListener('mousemove', onMouseMove);
                            document.addEventListener('mouseup', onMouseUp);
                            e.stopPropagation();
                        }
                    }}
                >
                    {mostrarNumeros && (
                        <div className="absolute -top-5 left-0 right-0 text-center font-bold text-xs text-gray-700 pointer-events-none">
                            {num}
                        </div>
                    )}
                    <Diente
                        numero={num}
                        invertido={(num >= 10 && num < 30) || (num >= 50 && num < 70)}
                        simbologiasAnadidas={visibleSimbologias}
                        simbologiaActiva={simbologiaActiva}
                        onParteClick={onPiezaClick}
                        partesSeleccionadas={getPartesSeleccionadas(num)}
                        simbologiaHover={simbologiaHover}
                        onSimbologiaHover={onSimbologiaHover}
                        modoAsignacion={modoAsignacion}
                        modoEdicionPosicion={modoEdicionPosicion}
                        estaArrastrando={dienteArrastrando === num}
                        modoDibujo={modoDibujo}
                        baseSize={BASE_SIZE}
                        mostrarAsignaciones={mostrarAsignaciones}
                    />
                </div>
            );
        });
    };

    const renderSymbols = () => {
        return visibleSimbologias.filter(s => s.esImagen).map((s) => {
            const transform = s.transformacion || {
                x: canvasSize.width / 2,
                y: canvasSize.height / 2,
                scaleX: 1,
                scaleY: 1,
                rotation: 0
            };
            const isSelf = s.id === simbologiaActiva;
            const opacity = ((modoAsignacion && !isSelf) || modoEdicionPosicion) ? 0.2 : 1;
            const isListening = !modoDibujo && !modoAsignacion && (!modoEdicionPosicion || Boolean(simbologiaActiva));

            return (
                <KonvaSymbolImage
                    key={s.id}
                    shapeProps={{
                        ...transform,
                        id: s.id,
                        width: 100,
                        height: 100,
                        offsetX: 50,
                        offsetY: 50,
                        listening: isListening,
                        dragBoundFunc: (pos: { x: number, y: number }) => {
                            const stageW = BASE_WIDTH;
                            const stageH = BASE_HEIGHT;
                            const halfW = 50;
                            const halfH = 50;
                            return {
                                x: Math.max(halfW, Math.min(pos.x, stageW - halfW)),
                                y: Math.max(halfH, Math.min(pos.y, stageH - halfH))
                            };
                        }
                    }}
                    opacity={opacity}
                    base64={s.imagen_base64}
                    tintColor={transform?.color || s.color_principal || '#0000FF'}
                    isSelected={isSelf && !modoAsignacion} 
                    onSelect={() => {
                        onSimbologiaSelect?.(s.id);
                        onSimbologiaHover(s.id);
                    }}
                    onInteractionStart={() => { isInteractingRef.current = true; if(pointerEventsState !== 'auto') setPointerEventsState('auto'); }}
                    onInteractionEnd={() => { isInteractingRef.current = false; }}
                    onChange={(newAttrs: any) => {
                        onUpdateSimboloTransform(s.id, {
                            ...transform,
                            x: newAttrs.x,
                            y: newAttrs.y,
                            scaleX: newAttrs.scaleX,
                            scaleY: newAttrs.scaleY,
                            rotation: newAttrs.rotation,
                        });
                    }}
                />
            );
        });
    };

    return (
        <div 
            className="bg-white relative overflow-hidden" 
            style={{ 
                width: `${BASE_WIDTH * escala}px`, 
                height: `${BASE_HEIGHT * escala}px` 
            }}
        >
            <div className="absolute top-2 left-4 px-2 py-1 rounded bg-gray-100/80 text-gray-400 text-[10px] font-bold pointer-events-none select-none z-10 border border-gray-200 uppercase tracking-wider">
                Derecha (Q1/Q4)
            </div>
            <div className="absolute top-2 right-4 px-2 py-1 rounded bg-gray-100/80 text-gray-400 text-[10px] font-bold pointer-events-none select-none z-10 border border-gray-200 uppercase tracking-wider">
                Izquierda (Q2/Q3)
            </div>

            <div 
                style={containerStyle} 
                id="dental-chart-container" 
                onMouseMove={handleContainerMouseMove}
                onMouseEnter={() => setShowCursor(true)}
                onMouseLeave={() => setShowCursor(false)}
            >
                        modoDibujo={modoDibujo}
                {modoDibujo && showCursor && (
                    <div 
                        style={{
                            position: 'absolute',
                            left: cursorPos.x,
                            top: cursorPos.y,
                            width: herramientaDibujo === 'eraser' ? (grosorDibujo || 5) * 2 : (grosorDibujo || 2),
                            height: herramientaDibujo === 'eraser' ? (grosorDibujo || 5) * 2 : (grosorDibujo || 2),
                            borderRadius: '50%',
                            border: '1px solid black',
                            backgroundColor: herramientaDibujo === 'eraser' ? 'rgba(255,255,255,0.5)' : (colorDibujo || '#df4b26'),
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            zIndex: 1000,
                            boxShadow: '0 0 2px rgba(0,0,0,0.5)'
                        }} 
                    />
                )}
                {renderGrid()}
                {renderTeeth()}
                
                <Stage
                    ref={stageRef}
                    width={BASE_WIDTH}
                    height={BASE_HEIGHT}
                    scale={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, pointerEvents: pointerEventsState, backgroundColor: 'transparent', cursor: modoDibujo ? 'none' : 'default' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >
                    <Layer>
                        {dibujos.map((line: any, i: number) => (
                            <Line
                                key={i}
                                points={line.points}
                                stroke={line.color}
                                strokeWidth={line.strokeWidth}
                                tension={0.5}
                                lineCap="round"
                                lineJoin="round"
                                globalCompositeOperation={
                                    line.tool === 'eraser' ? 'destination-out' : 'source-over'
                                }
                            />
                        ))}
                    </Layer>
                    <Layer>
                         {renderSymbols()}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
}
