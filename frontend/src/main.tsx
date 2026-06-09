import axios from 'axios';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { toast } from '@/hooks/use-toast';
import './App.css'
import './index.css';
import 'flag-icons/css/flag-icons.min.css';

const INTERVALO_TOAST_SIN_CONEXION_MS = 5000;
let ultimoToastSinConexion = 0;

function mostrarToastSinConexion() {
  const ahora = Date.now();
  if (ahora - ultimoToastSinConexion < INTERVALO_TOAST_SIN_CONEXION_MS) return;
  ultimoToastSinConexion = ahora;

  toast({
    variant: 'destructive',
    title: 'Sin conexión con el servidor',
    description: 'No se pudo conectar con la API. Revisa tu conexión e inténtalo nuevamente.',
  });
}

function esErrorDeConexion(reason: unknown): boolean {
  const anyReason = reason as any;
  if (anyReason?.__esErrorConexion === true) return true;
  if (!axios.isAxiosError(anyReason)) return false;
  if (anyReason.response) return false;
  if (anyReason.code === 'ERR_CANCELED') return false;

  return true;
}

window.addEventListener('unhandledrejection', (event) => {
  if (!esErrorDeConexion(event.reason)) return;
  event.preventDefault();
  mostrarToastSinConexion();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);