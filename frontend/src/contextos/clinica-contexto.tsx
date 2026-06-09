import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { catalogoApi } from '@/lib/api';
import { useAutenticacion } from './autenticacion-contexto';

interface ConfiguracionClinica {
    logo: string;
    logo_enlace?: string;
    nombre_clinica?: string;
    mensaje_bienvenida_antes?: string;
    mensaje_bienvenida_despues?: string;
    horarios_laborales?: string;
    gemini_api_key?: string;
    gemini_url_base?: string;
    gemini_verificado?: boolean;
    exchange_rate_api_key?: string;
    exchange_rate_verificado?: boolean;
    cambio_dolar?: number;
    trabajar_con?: 'local' | 'usd';
    moneda_principal?: string;
    moneda_configurada?: boolean;
    modelo_dientes_odontograma?: 'cuadrado' | 'circular';
}

interface ClinicaContexto {
    config_clinica: ConfiguracionClinica;
    cargando: boolean;
    actualizarLogo: (logo: string) => void;
    actualizarConfigClinica: (config: Partial<ConfiguracionClinica>) => void;
    recargarConfigClinica: () => Promise<void>;
}

const CONFIG_DEFAULT: ConfiguracionClinica = {
    logo: '',
    logo_enlace: '',
    nombre_clinica: '',
    mensaje_bienvenida_antes: 'Bienvenido,',
    mensaje_bienvenida_despues: '¿qué haremos hoy?',
    horarios_laborales: '',
    cambio_dolar: 1,
    trabajar_con: 'local',
    moneda_configurada: false,
    modelo_dientes_odontograma: 'cuadrado',
};

const ClinicaContext = createContext<ClinicaContexto | undefined>(undefined);

function obtenerCacheKey(usuario_id: number | undefined): string {
    return usuario_id ? `clinica-config-cache-${usuario_id}` : '';
}

function obtenerCacheLocal(usuario_id: number | undefined): ConfiguracionClinica | null {
    if (!usuario_id) return null;
    try {
        const cached = localStorage.getItem(obtenerCacheKey(usuario_id));
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.error('Error al leer caché de configuración de clínica:', error);
    }
    return null;
}

function guardarCacheLocal(usuario_id: number | undefined, config: ConfiguracionClinica): void {
    if (!usuario_id) return;
    try {
        localStorage.setItem(obtenerCacheKey(usuario_id), JSON.stringify(config));
    } catch (error) {
        console.error('Error al guardar caché de configuración de clínica:', error);
    }
}

export function limpiarCacheClinica(usuario_id: number | undefined): void {
    if (!usuario_id) return;
    try {
        localStorage.removeItem(obtenerCacheKey(usuario_id));
    } catch (error) {
        console.error('Error al limpiar caché de configuración de clínica:', error);
    }
}

export function ProveedorClinica({ children }: { children: ReactNode }) {
    const { usuario } = useAutenticacion();
    const usuario_id = usuario?.id;

    const [config_clinica, setConfigClinica] = useState<ConfiguracionClinica>(() => {
        const cached = obtenerCacheLocal(usuario_id);
        return cached || CONFIG_DEFAULT;
    });
    const [cargando, setCargando] = useState(true);

    const cargarConfiguracionClinica = useCallback(async () => {
        if (!usuario_id) {
            setCargando(false);
            setConfigClinica(CONFIG_DEFAULT);
            return;
        }

        try {
            const config = await catalogoApi.obtenerConfiguracionClinica();
            const nueva_config: ConfiguracionClinica = {
                logo: config.logo || '',
                logo_enlace: config.logo_enlace || '',
                nombre_clinica: config.nombre_clinica || '',
                mensaje_bienvenida_antes: config.mensaje_bienvenida_antes || 'Bienvenido,',
                mensaje_bienvenida_despues: config.mensaje_bienvenida_despues || '¿qué haremos hoy?',
                horarios_laborales: config.horarios_laborales || '',
                gemini_api_key: config.gemini_api_key || '',
                gemini_url_base: config.gemini_url_base || '',
                gemini_verificado: config.gemini_verificado || false,
                cambio_dolar: config.cambio_dolar || 1,
                trabajar_con: config.trabajar_con || 'local',
                moneda_principal: config.moneda_principal || '',
                moneda_configurada: config.moneda_configurada || false,
                modelo_dientes_odontograma: (config as any).modelo_dientes_odontograma === 'circular' ? 'circular' : 'cuadrado',
            };
            setConfigClinica(nueva_config);
            guardarCacheLocal(usuario_id, nueva_config);
        } catch (error) {
            console.error('Error al cargar configuración de clínica:', error);
        } finally {
            setCargando(false);
        }
    }, [usuario_id]);

    useEffect(() => {
        const cached = obtenerCacheLocal(usuario_id);
        if (cached) {
            setConfigClinica(cached);
        } else {
            setConfigClinica(CONFIG_DEFAULT);
        }
        setCargando(true);
        cargarConfiguracionClinica();
    }, [usuario_id, cargarConfiguracionClinica]);

    const actualizarLogo = (logo: string) => {
        setConfigClinica(prev => {
            const nueva_config = { ...prev, logo };
            guardarCacheLocal(usuario_id, nueva_config);
            return nueva_config;
        });
    };

    const actualizarConfigClinica = (config: Partial<ConfiguracionClinica>) => {
        setConfigClinica(prev => {
            const nueva_config = { ...prev, ...config };
            guardarCacheLocal(usuario_id, nueva_config);
            return nueva_config;
        });
    };

    const recargarConfigClinica = async () => {
        await cargarConfiguracionClinica();
    };

    return (
        <ClinicaContext.Provider
            value={{
                config_clinica,
                cargando,
                actualizarLogo,
                actualizarConfigClinica,
                recargarConfigClinica,
            }}
        >
            {children}
        </ClinicaContext.Provider>
    );
}

export function useClinica() {
    const contexto = useContext(ClinicaContext);
    if (contexto === undefined) {
        throw new Error('useClinica debe usarse dentro de un ProveedorClinica');
    }
    return contexto;
}
