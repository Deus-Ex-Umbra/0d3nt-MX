import { DienteSVGProps } from './types';

export function IncisivoCircular({ baseSize, invertido, modoAsignacion, cursorClassName, colores, eventos }: DienteSVGProps) {
    const s = baseSize / 30;
    const h = baseSize * 5 / 3;

    const $ = (val: number) => val * s;

    return (
        <svg
            width={baseSize}
            height={h}
            style={{ transform: invertido ? 'scaleY(-1)' : undefined }}
            className={cursorClassName ?? (modoAsignacion ? 'cursor-pointer' : 'cursor-default')}
        >
            <path
                d={`M ${$(11)},${$(20)} C ${$(11)},${$(35)} ${$(13)},${$(48)} ${$(15)},${$(50)} C ${$(17)},${$(48)} ${$(19)},${$(35)} ${$(19)},${$(20)} Z`}
                fill={colores['root-2']}
                stroke="#374151"
                strokeWidth="1.5"
                strokeLinejoin="round"
                onClick={() => eventos.onClick('root-2')}
                onMouseEnter={() => eventos.onEnter('root-2')}
                onMouseLeave={() => eventos.onLeave('root-2')}
                className="hover:brightness-95 transition-all"
            />
            <path
                d={`M ${$(15)},${$(15)} L ${$(4)},${$(4)} Q ${$(15)},${$(0)} ${$(26)},${$(4)} Z`}
                fill={colores.top}
                stroke="#374151"
                strokeWidth="1.5"
                strokeLinejoin="round"
                onClick={() => eventos.onClick('top')}
                onMouseEnter={() => eventos.onEnter('top')}
                onMouseLeave={() => eventos.onLeave('top')}
                className="hover:brightness-95 transition-all"
            />
            <path
                d={`M ${$(15)},${$(15)} L ${$(4)},${$(26)} Q ${$(0)},${$(15)} ${$(4)},${$(4)} Z`}
                fill={colores.left}
                stroke="#374151"
                strokeWidth="1.5"
                strokeLinejoin="round"
                onClick={() => eventos.onClick('left')}
                onMouseEnter={() => eventos.onEnter('left')}
                onMouseLeave={() => eventos.onLeave('left')}
                className="hover:brightness-95 transition-all"
            />
            <path
                d={`M ${$(15)},${$(15)} L ${$(26)},${$(4)} Q ${$(30)},${$(15)} ${$(26)},${$(26)} Z`}
                fill={colores.right}
                stroke="#374151"
                strokeWidth="1.5"
                strokeLinejoin="round"
                onClick={() => eventos.onClick('right')}
                onMouseEnter={() => eventos.onEnter('right')}
                onMouseLeave={() => eventos.onLeave('right')}
                className="hover:brightness-95 transition-all"
            />
            <path
                d={`M ${$(15)},${$(15)} L ${$(26)},${$(26)} Q ${$(15)},${$(30)} ${$(4)},${$(26)} Z`}
                fill={colores.bottom}
                stroke="#374151"
                strokeWidth="1.5"
                strokeLinejoin="round"
                onClick={() => eventos.onClick('bottom')}
                onMouseEnter={() => eventos.onEnter('bottom')}
                onMouseLeave={() => eventos.onLeave('bottom')}
                className="hover:brightness-95 transition-all"
            />
        </svg>
    );
}
