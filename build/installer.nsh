!include "LogicLib.nsh"

!macro customInstall
  ; Limpiamos cualquier servicio de base de datos de instalaciones anteriores que pudiera dar conflicto.
  ; Ahora el despliegue lo maneja internamente main.js dentro del espacio de usuario sin permisos extra.
  nsExec::ExecToStack '"$SYSDIR\sc.exe" stop "0d3nt-postgres"'
  Pop $0
  nsExec::ExecToStack '"$SYSDIR\sc.exe" delete "0d3nt-postgres"'
  Pop $0
!macroend


