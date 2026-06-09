import { MenuLateral } from '@/componentes/MenuLateral';
import { TituloAccionable } from '@/componentes/tutoriales/titulo-accionable';
import { TutorialModalWrapper } from '@/componentes/tutoriales/tutorial-modal-wrapper';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/componentes/ui/tabs';
import { FinanzasMovimientos } from '@/componentes/finanzas/finanzas-movimientos';
import { FinanzasAnalisis } from '@/componentes/finanzas/finanzas-analisis';
import { Toaster } from '@/componentes/ui/toaster';
import { ProveedorTutorialesPagina } from '@/contextos/tutoriales';
import { TUTORIALES_FINANZAS, IDS_ELEMENTOS_FINANZAS } from '@/tutoriales/finanzas';
import { useFinanzasUI, type SeccionFinanzas } from '@/contextos/finanzas-contexto';

export default function Finanzas() {
  const { seccion_activa, setSeccionActiva } = useFinanzasUI();

  return (
    <ProveedorTutorialesPagina pagina="/finanzas" definicionesTutoriales={TUTORIALES_FINANZAS}>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8 text-sm">
            <div className="space-y-2">
              <h1 id={IDS_ELEMENTOS_FINANZAS.TITULO_PAGINA} className="text-4xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
                <TituloAccionable titulo="Finanzas">Finanzas</TituloAccionable>
              </h1>
              <TutorialModalWrapper tema="Finanzas" />
              <p className="text-lg text-muted-foreground">
                Gestión financiera de tu consultorio
              </p>
            </div>

            <Tabs value={seccion_activa} onValueChange={(v) => setSeccionActiva(v as SeccionFinanzas)} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger id={IDS_ELEMENTOS_FINANZAS.TAB_MOVIMIENTOS} value="movimientos">Movimientos</TabsTrigger>
                <TabsTrigger id={IDS_ELEMENTOS_FINANZAS.TAB_ANALISIS} value="analisis">Análisis</TabsTrigger>
              </TabsList>

              <TabsContent value="movimientos" className="space-y-6 animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
                <FinanzasMovimientos />
              </TabsContent>

              <TabsContent value="analisis" className="space-y-6 animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
                <FinanzasAnalisis />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <Toaster />
      </div>
    </ProveedorTutorialesPagina>
  );
}
