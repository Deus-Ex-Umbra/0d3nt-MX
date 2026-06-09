import { DienteSVGProps } from './types';

export function Premolar4Cuadrado({ baseSize, invertido, modoAsignacion, cursorClassName, colores, eventos }: DienteSVGProps) {
    const s = baseSize / 30;
    const h = baseSize * 5 / 3;

    return (
        <svg
            width={baseSize}
            height={h}
            style={{ transform: invertido ? 'scaleY(-1)' : undefined }}
            className={cursorClassName ?? (modoAsignacion ? 'cursor-pointer' : 'cursor-default')}
        >
            <polygon
                points={`0,0 ${baseSize},0 ${20 * s},${10 * s} ${10 * s},${10 * s}`}
                fill={colores.top}
                stroke="#374151"
                strokeWidth="1.5"
                onClick={() => eventos.onClick('top')}
                onMouseEnter={() => eventos.onEnter('top')}
                onMouseLeave={() => eventos.onLeave('top')}
                className="hover:brightness-95 transition-all"
            />
            <polygon
                points={`0,0 ${10 * s},${10 * s} ${10 * s},${20 * s} 0,${30 * s}`}
                fill={colores.left}
                stroke="#374151"
                strokeWidth="1.5"
                onClick={() => eventos.onClick('left')}
                onMouseEnter={() => eventos.onEnter('left')}
                onMouseLeave={() => eventos.onLeave('left')}
                className="hover:brightness-95 transition-all"
            />
            <polygon
                points={`0,${30 * s} ${10 * s},${20 * s} ${20 * s},${20 * s} ${baseSize},${30 * s}`}
                fill={colores.bottom}
                stroke="#374151"
                strokeWidth="1.5"
                onClick={() => eventos.onClick('bottom')}
                onMouseEnter={() => eventos.onEnter('bottom')}
                onMouseLeave={() => eventos.onLeave('bottom')}
                className="hover:brightness-95 transition-all"
            />
            <polygon
                points={`${baseSize},0 ${20 * s},${10 * s} ${20 * s},${20 * s} ${baseSize},${30 * s}`}
                fill={colores.right}
                stroke="#374151"
                strokeWidth="1.5"
                onClick={() => eventos.onClick('right')}
                onMouseEnter={() => eventos.onEnter('right')}
                onMouseLeave={() => eventos.onLeave('right')}
                className="hover:brightness-95 transition-all"
            />
            <polygon
                points={`${10 * s},${10 * s} ${20 * s},${10 * s} ${20 * s},${20 * s} ${10 * s},${20 * s}`}
                fill={colores.center}
                stroke="#374151"
                strokeWidth="1.5"
                onClick={() => eventos.onClick('center')}
                onMouseEnter={() => eventos.onEnter('center')}
                onMouseLeave={() => eventos.onLeave('center')}
                className="hover:brightness-95 transition-all"
            />
            <polygon
                points={`0,${30 * s} ${5 * s},${50 * s} ${10 * s},${30 * s}`}
                fill={colores['root-1']}
                stroke="#374151"
                strokeWidth="1.5"
                onClick={() => eventos.onClick('root-1')}
                onMouseEnter={() => eventos.onEnter('root-1')}
                onMouseLeave={() => eventos.onLeave('root-1')}
                className="hover:brightness-95 transition-all"
            />
            <polygon
                points={`${20 * s},${30 * s} ${25 * s},${50 * s} ${baseSize},${30 * s}`}
                fill={colores['root-3']}
                stroke="#374151"
                strokeWidth="1.5"
                onClick={() => eventos.onClick('root-3')}
                onMouseEnter={() => eventos.onEnter('root-3')}
                onMouseLeave={() => eventos.onLeave('root-3')}
                className="hover:brightness-95 transition-all"
            />
        </svg>
    );
}
