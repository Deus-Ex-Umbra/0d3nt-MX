import { Input } from '@/componentes/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import { Label } from '@/componentes/ui/label';
import { PAISES } from '@/lib/paises';

const codigos_paises = PAISES;

interface PhoneInputProps {
  codigo_pais: string;
  numero: string;
  onCodigoPaisChange: (codigo: string) => void;
  onNumeroChange: (numero: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  idCodigoPais?: string;
  idNumero?: string;
  layout?: 'horizontal' | 'vertical';
}

export function PhoneInput({
  codigo_pais,
  numero,
  onCodigoPaisChange,
  onNumeroChange,
  disabled = false,
  label = 'Teléfono',
  placeholder = '70123456',
  idCodigoPais,
  idNumero,
  layout = 'horizontal',
}: PhoneInputProps) {
  const pais_seleccionado = codigos_paises.find(p => p.codigo === codigo_pais);

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={idNumero}>{label}</Label>}
      <div className={layout === 'vertical' ? 'grid gap-2' : 'flex gap-2'}>
        <Select value={codigo_pais} onValueChange={onCodigoPaisChange} disabled={disabled}>
          <SelectTrigger
            id={idCodigoPais}
            className={
              layout === 'vertical'
                ? 'w-full hover:border-primary/50 focus:border-primary transition-all duration-200'
                : 'w-[180px] hover:border-primary/50 focus:border-primary transition-all duration-200'
            }
          >
            <SelectValue>
              {pais_seleccionado && (
                <div className="flex items-center gap-2">
                  <span className={`fi fi-${pais_seleccionado.iso} rounded-sm shadow-sm`} />
                  <span>{pais_seleccionado.codigo}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {codigos_paises.map((pais) => (
              <SelectItem key={pais.iso} value={pais.codigo}>
                <div className="flex items-center gap-2">
                  <span className={`fi fi-${pais.iso} rounded-sm shadow-sm`} />
                  <span className="font-medium">{pais.codigo}</span>
                  <span className="text-muted-foreground text-sm">{pais.nombre}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={idNumero}
          type="tel"
          value={numero}
          onChange={(e) => {
            const valor = e.target.value.replace(/[^\d]/g, '');
            onNumeroChange(valor);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={
            layout === 'vertical'
              ? 'w-full hover:border-primary/50 focus:border-primary transition-all duration-200'
              : 'flex-1 hover:border-primary/50 focus:border-primary transition-all duration-200'
          }
          maxLength={15}
        />
      </div>
    </div>
  );
}

export function formatearTelefonoCompleto(codigo_pais: string, numero: string): string {
  return `${codigo_pais}${numero}`;
}

export function separarTelefono(telefono_completo: string): { codigo_pais: string; numero: string } {
  if (!telefono_completo) {
    return { codigo_pais: '+591', numero: '' };
  }

  const pais_encontrado = codigos_paises.find(p => telefono_completo.startsWith(p.codigo));

  if (pais_encontrado) {
    return {
      codigo_pais: pais_encontrado.codigo,
      numero: telefono_completo.substring(pais_encontrado.codigo.length),
    };
  }

  return { codigo_pais: '+591', numero: telefono_completo };
}
