import { DienteSVGProps } from './types';

export function MolarCircular({ baseSize, invertido, modoAsignacion, cursorClassName, colores, eventos }: DienteSVGProps) {
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
                d={`M ${$(5)},${$(20)} C ${$(4)},${$(35)} ${$(5)},${$(45)} ${$(6.5)},${$(48)} C ${$(8)},${$(45)} ${$(9)},${$(35)} ${$(10)},${$(20)} Z`}
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
                d={`M ${$(12)},${$(20)} C ${$(12)},${$(35)} ${$(13.5)},${$(47)} ${$(15)},${$(50)} C ${$(16.5)},${$(47)} ${$(18)},${$(35)} ${$(18)},${$(20)} Z`}
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
                d={`M ${$(20)},${$(20)} C ${$(21)},${$(35)} ${$(22)},${$(45)} ${$(23.5)},${$(48)} C ${$(25)},${$(45)} ${$(26)},${$(35)} ${$(25)},${$(20)} Z`}
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
