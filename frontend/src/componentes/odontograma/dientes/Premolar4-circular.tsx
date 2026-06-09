import { DienteSVGProps } from './types';

export function Premolar4Circular({ baseSize, invertido, modoAsignacion, cursorClassName, colores, eventos }: DienteSVGProps) {
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
                d={`M ${$(7)},${$(20)} C ${$(6)},${$(35)} ${$(7.5)},${$(47)} ${$(9)},${$(49)} C ${$(10.5)},${$(47)} ${$(12)},${$(35)} ${$(12)},${$(20)} Z`}
                fill={colores['root-1']}
                stroke="#374151"
                strokeWidth="1.5"
                strokeLinejoin="round"
                onClick={() => eventos.onClick('root-1')}
                onMouseEnter={() => eventos.onEnter('root-1')}
                onMouseLeave={() => eventos.onLeave('root-1')}
                className="hover:brightness-95 transition-all"
            />
            <path
                d={`M ${$(18)},${$(20)} C ${$(18)},${$(35)} ${$(19.5)},${$(47)} ${$(21)},${$(49)} C ${$(22.5)},${$(47)} ${$(24)},${$(35)} ${$(23)},${$(20)} Z`}
                fill={colores['root-3']}
                stroke="#374151"
                strokeWidth="1.5"
                strokeLinejoin="round"
                onClick={() => eventos.onClick('root-3')}
                onMouseEnter={() => eventos.onEnter('root-3')}
                onMouseLeave={() => eventos.onLeave('root-3')}
                className="hover:brightness-95 transition-all"
            />

            <path
                d={`M ${$(10)},${$(10)} L ${$(3)},${$(3)} Q ${$(15)},${$(-1)} ${$(27)},${$(3)} L ${$(20)},${$(10)} Q ${$(15)},${$(7)} ${$(10)},${$(10)} Z`}
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
                d={`M ${$(10)},${$(20)} L ${$(3)},${$(27)} Q ${$(-1)},${$(15)} ${$(3)},${$(3)} L ${$(10)},${$(10)} Q ${$(7)},${$(15)} ${$(10)},${$(20)} Z`}
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
                d={`M ${$(20)},${$(10)} L ${$(27)},${$(3)} Q ${$(31)},${$(15)} ${$(27)},${$(27)} L ${$(20)},${$(20)} Q ${$(23)},${$(15)} ${$(20)},${$(10)} Z`}
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
                d={`M ${$(20)},${$(20)} L ${$(27)},${$(27)} Q ${$(15)},${$(31)} ${$(3)},${$(27)} L ${$(10)},${$(20)} Q ${$(15)},${$(23)} ${$(20)},${$(20)} Z`}
                fill={colores.bottom}
                stroke="#374151"
                strokeWidth="1.5"
                strokeLinejoin="round"
                onClick={() => eventos.onClick('bottom')}
                onMouseEnter={() => eventos.onEnter('bottom')}
                onMouseLeave={() => eventos.onLeave('bottom')}
                className="hover:brightness-95 transition-all"
            />
            <path
                d={`M ${$(10)},${$(10)} Q ${$(15)},${$(7)} ${$(20)},${$(10)} Q ${$(23)},${$(15)} ${$(20)},${$(20)} Q ${$(15)},${$(23)} ${$(10)},${$(20)} Q ${$(7)},${$(15)} ${$(10)},${$(10)} Z`}
                fill={colores.center}
                stroke="#374151"
                strokeWidth="1.5"
                strokeLinejoin="round"
                onClick={() => eventos.onClick('center')}
                onMouseEnter={() => eventos.onEnter('center')}
                onMouseLeave={() => eventos.onLeave('center')}
                className="hover:brightness-95 transition-all"
            />
        </svg>
    );
}
