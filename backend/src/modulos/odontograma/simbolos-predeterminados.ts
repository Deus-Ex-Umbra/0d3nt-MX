import { CategoriaSimboloOdontograma } from './entidades/simbolo-odontograma.entidad';

export type SimboloPredeterminadoBase = {
  nombre: string;
  descripcion?: string;
  imagen_base64: string;
  categoria: CategoriaSimboloOdontograma;
  color_primario: string;
  color_secundario: string | null;
  activo: boolean;
  datos_canvas?: any;
};

export const SIMBOLOS_PREDETERMINADOS: SimboloPredeterminadoBase[] = [
  {
    nombre: 'Caries',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFEAAAAuCAYAAABQ+/UiAAABN0lEQVRoQ+3awY3CMBRFUceJhKiJEtIIiEqoixLogBJYsAg4HgVpNrPJ4t9AGN1I2cXP/kcvOzfJJyzQhBMMSCICJRBRREAAiLCJIgICQIRNXAvisNvVerkAx3l/RHs4pO50CpUptHgauZzP9dn3758e3HFzu4UcQov/Ij66Lo05g+MtF9WVktpSXhusCvG+3aZn2y43OZi8GYY0vSIGUEUM4P0uFVFEQACIsIkiAgJAhE0UERAAImyiiIAAEGETRQQEgAibKCIgAETYRBEBASDCJooICAARNlFEQACIsIkiAgJAhE0UERAAImzif0YsOafahG+mAETzEbnWlMfx9eGqrpHMH32dX3wccWJ57Pe1Xq/rFJo5Ve771B2Pod8ntPgr1RY4tIgAqogiAgJAhE0UERAAIn4Aog+IPvO2JB4AAAAASUVORK5CYII=',
    categoria: CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA,
    color_primario: '#0000FF',
    color_secundario: '#FF0000',
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFEAAAAuCAYAAABQ+/UiAAABN0lEQVRoQ+3awY3CMBRFUceJhKiJEtIIiEqoixLogBJYsAg4HgVpNrPJ4t9AGN1I2cXP/kcvOzfJJyzQhBMMSCICJRBRREAAiLCJIgICQIRNXAvisNvVerkAx3l/RHs4pO50CpUptHgauZzP9dn3758e3HFzu4UcQov/Ij66Lo05g+MtF9WVktpSXhusCvG+3aZn2y43OZi8GYY0vSIGUEUM4P0uFVFEQACIsIkiAgJAhE0UERAAImyiiIAAEGETRQQEgAibKCIgAETYRBEBASDCJooICAARNlFEQACIsIkiAgJAhE0UERAAImzif0YsOafahG+mAETzEbnWlMfx9eGqrpHMH32dX3wccWJ57Pe1Xq/rFJo5Ve771B2Pod8ntPgr1RY4tIgAqogiAgJAhE0UERAAIn4Aog+IPvO2JB4AAAAASUVORK5CYII=',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Corona Definitiva',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,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',
    categoria: CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA,
    color_primario: '#0000FF',
    color_secundario: '#FF0000',
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,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',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Corona Temporal',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,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',
    categoria: CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA,
    color_primario: '#0000FF',
    color_secundario: '#FF0000',
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,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',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Diastema',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAAAqCAYAAAAQ0R0WAAAFnUlEQVRoQ+2ZTUxTWRTHz23pa6X2AQsXzSTFYcZIX0NlghlgbHVMSBo7mMlEi1GTISmJrMSVC3bdsRZXIjFhYSKyVDEmJDPaGsCxEcU+FJxBqqGLWRgKA0gtZ3Je38MWa2ntB0zmkZCQcN+95/7O/5xz77kM1J+MBJjKJzMBFdAWClEBqYDySyKqglQFqQrKj8CXKMjjCXE2m7Du87EPPh+Wmc3AGhoSMx08yGJFtWiHTZ42BxmN4h+M4QoivGYM9gKATrEbkZUBoN3p3P3UYvn70OnTDXj0KPuww/a1pTmPH+PGnjI5Pi0gs3kKo9F1ZZE1APaMMZCVg4wgMYa1iOyFDPINY2zvmTPLP/b1HdwRCguFkAsEghgMAtBvTc0u9vChdnxhIS4k9oMpTl1asjWno5pVFaPFVlZAWox+RkZEFg4bxp8/X5UXk+AhAMQQ8S1j8HNdneGVy7Xa6PPZ1rZ0ZwEGXLnyWEf2vXu3iw0PQ4CmZOxjOkBEHWNglZ36ieLzApTJfpJqX19QMszv1wQWFxPKSxgDUxUV2ukTJ7Qdly/ve18ADilT3LyJ3NCQCOmAyAMZIugsljK7xaLjKis1E1arpdFsBlRyqjLh53JrVgrKZWNktCiKcOOGLvDmTYy89i0ivCJ1eb2cM19QpGaf7yOUJGfQGoLDUS42Ny83zs+v4LlzDXkXlYIDSoY5PIz6S5dejwUCywIAPKX/VVZq4erV/U63m+WkKJqrtzfs9/uXUkKH5zVw/Dg/a7OZO7q6cpszG8cXFVCyAceOzegfPFgbYAx+QoQ7Xi/Xnq2aNn07BQDTbjd4W1pWsLOzuEWhZIAI1vDwjN7rjQ8sLcUlSD09Qnsmr4dCIe7kSe63cHitnMKH57ViZ2e8ZIlfCt9sZFbIMTMzqHc6X0qQTCbtVCRS+326+WnckSMvB6JRCeZUa6sJBgctaccW0r7Nc5UcEBlAm6+vF8fo754erqmr69MK19z856PJyVWqhHcuXhR+9flYSY4LOwIQGWG1Tr8Ph2PQ2rpbHBys/i7ZsN5e1Hd3ZwZYTNUkz70tCiIDXK5ZDASWweEoh3v3vk6x49SpuSe3by8JVKEiEau+VDDSrbNtgIzGkFTmz56tFPv6vkpRkCBM49wcqUvKO9tm47YkaVr0/PkZ/bVra3IOEpo2VzKXa/YJnZ3sdgOMjn7z/1JQb++Mvrt7bQAAfpHD6xMA8hgJ4MSE0LRvX+EPgNmGbUnlm3zgM5m0ryKR2pTQSjbabH7xaHExbuV57Z379/e3bxekkgCSQ8qvALDbDbH+/pqjNtvnS7dcyaSTN0Hq79e2u92Fv/BupaSiAUrcw+bGAoF/pHsYtR4Qcdbr5bK+2ctgN64nhw9z7XfvlhZSQQFtaj+k3OTdbnB4PAK0teV24CPQHR0v/dFoXHH2AYfDKF64UN2U64V3K7UUtMwTjJGRIFIf6O1bw/izZ9Q8SyiFFqIGlcmkAY+nLO8WR1LlozDdAF9drYu1tcUcZnPxLq1pFbS5gxgMJhpi0ahxfHJytX5hIU7HfiVs5E4d0C0bCIrTue4o1k2bwm5o6IN/cXFdATVFTuF5zeyhQ3FvVdUKtrQ0sFyV+jl1ZWraJ7UlGSJiWXLLUmne87yGs9sNE9SkEoTcQ+hLZE/fUBK/fv2vsUTb96NyFfUCwAG73fDU5ar5QRCGEMAjLbVnD7BcHhmyAkQw6ur09ooKjcjzy40tLQJWVUHBvPSlkJTvfD7k5ueDeOuW8fdolJQlFYQNZTNGry4o7VVxLABwyvcVFVqYn69NyyJjiNEE/7V3MOU1IxLZxUZHyyk31kej6/LLTOpLRrJjita0z9f7pfp+c15V1qX8mngaSt+ZLGiZL9VmS7mOCmgL2iogFVB+AakqSFWQqqD8CKgKyo/fv7aKqEnTRtpRAAAAAElFTkSuQmCC',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#0000ff',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAAAqCAYAAAAQ0R0WAAAFnUlEQVRoQ+2ZTUxTWRTHz23pa6X2AQsXzSTFYcZIX0NlghlgbHVMSBo7mMlEi1GTISmJrMSVC3bdsRZXIjFhYSKyVDEmJDPaGsCxEcU+FJxBqqGLWRgKA0gtZ3Je38MWa2ntB0zmkZCQcN+95/7O/5xz77kM1J+MBJjKJzMBFdAWClEBqYDySyKqglQFqQrKj8CXKMjjCXE2m7Du87EPPh+Wmc3AGhoSMx08yGJFtWiHTZ42BxmN4h+M4QoivGYM9gKATrEbkZUBoN3p3P3UYvn70OnTDXj0KPuww/a1pTmPH+PGnjI5Pi0gs3kKo9F1ZZE1APaMMZCVg4wgMYa1iOyFDPINY2zvmTPLP/b1HdwRCguFkAsEghgMAtBvTc0u9vChdnxhIS4k9oMpTl1asjWno5pVFaPFVlZAWox+RkZEFg4bxp8/X5UXk+AhAMQQ8S1j8HNdneGVy7Xa6PPZ1rZ0ZwEGXLnyWEf2vXu3iw0PQ4CmZOxjOkBEHWNglZ36ieLzApTJfpJqX19QMszv1wQWFxPKSxgDUxUV2ukTJ7Qdly/ve18ADilT3LyJ3NCQCOmAyAMZIugsljK7xaLjKis1E1arpdFsBlRyqjLh53JrVgrKZWNktCiKcOOGLvDmTYy89i0ivCJ1eb2cM19QpGaf7yOUJGfQGoLDUS42Ny83zs+v4LlzDXkXlYIDSoY5PIz6S5dejwUCywIAPKX/VVZq4erV/U63m+WkKJqrtzfs9/uXUkKH5zVw/Dg/a7OZO7q6cpszG8cXFVCyAceOzegfPFgbYAx+QoQ7Xi/Xnq2aNn07BQDTbjd4W1pWsLOzuEWhZIAI1vDwjN7rjQ8sLcUlSD09Qnsmr4dCIe7kSe63cHitnMKH57ViZ2e8ZIlfCt9sZFbIMTMzqHc6X0qQTCbtVCRS+326+WnckSMvB6JRCeZUa6sJBgctaccW0r7Nc5UcEBlAm6+vF8fo754erqmr69MK19z856PJyVWqhHcuXhR+9flYSY4LOwIQGWG1Tr8Ph2PQ2rpbHBys/i7ZsN5e1Hd3ZwZYTNUkz70tCiIDXK5ZDASWweEoh3v3vk6x49SpuSe3by8JVKEiEau+VDDSrbNtgIzGkFTmz56tFPv6vkpRkCBM49wcqUvKO9tm47YkaVr0/PkZ/bVra3IOEpo2VzKXa/YJnZ3sdgOMjn7z/1JQb++Mvrt7bQAAfpHD6xMA8hgJ4MSE0LRvX+EPgNmGbUnlm3zgM5m0ryKR2pTQSjbabH7xaHExbuV57Z379/e3bxekkgCSQ8qvALDbDbH+/pqjNtvnS7dcyaSTN0Hq79e2u92Fv/BupaSiAUrcw+bGAoF/pHsYtR4Qcdbr5bK+2ctgN64nhw9z7XfvlhZSQQFtaj+k3OTdbnB4PAK0teV24CPQHR0v/dFoXHH2AYfDKF64UN2U64V3K7UUtMwTjJGRIFIf6O1bw/izZ9Q8SyiFFqIGlcmkAY+nLO8WR1LlozDdAF9drYu1tcUcZnPxLq1pFbS5gxgMJhpi0ahxfHJytX5hIU7HfiVs5E4d0C0bCIrTue4o1k2bwm5o6IN/cXFdATVFTuF5zeyhQ3FvVdUKtrQ0sFyV+jl1ZWraJ7UlGSJiWXLLUmne87yGs9sNE9SkEoTcQ+hLZE/fUBK/fv2vsUTb96NyFfUCwAG73fDU5ar5QRCGEMAjLbVnD7BcHhmyAkQw6ur09ooKjcjzy40tLQJWVUHBvPSlkJTvfD7k5ueDeOuW8fdolJQlFYQNZTNGry4o7VVxLABwyvcVFVqYn69NyyJjiNEE/7V3MOU1IxLZxUZHyyk31kej6/LLTOpLRrJjita0z9f7pfp+c15V1qX8mngaSt+ZLGiZL9VmS7mOCmgL2iogFVB+AakqSFWQqqD8CKgKyo/fv7aKqEnTRtpRAAAAAElFTkSuQmCC',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Diente Ausente',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAfCAYAAABtYXSPAAAA0klEQVRYR+2WSw6AIAxEZc1RvP9RPAprDSZNSFNk+jFhUbcW+pgOo+XY6CkbsRwJM5tGKmNWptbr/jJ5a+errlRH79BLAo+JN5s1ojotSAeGYaTT84YdxAJByqlgONDY2KNICEzfpANFgKjHRCeIMKtkavWYJCCPT0aoEBgaF3qFzTkjLZxlj1chtTLcrGj+IKqZYKR8oWYedVQws1CLUgeGWWVJBNASZpUp6If0F88gm1prlspYN7asS5jQBLaMAFmTY8oxIT4J+Z/RNkLqtzLwA8RBYCALslulAAAAAElFTkSuQmCC',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#FF0000',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAfCAYAAABtYXSPAAAA0klEQVRYR+2WSw6AIAxEZc1RvP9RPAprDSZNSFNk+jFhUbcW+pgOo+XY6CkbsRwJM5tGKmNWptbr/jJ5a+errlRH79BLAo+JN5s1ojotSAeGYaTT84YdxAJByqlgONDY2KNICEzfpANFgKjHRCeIMKtkavWYJCCPT0aoEBgaF3qFzTkjLZxlj1chtTLcrGj+IKqZYKR8oWYedVQws1CLUgeGWWVJBNASZpUp6If0F88gm1prlspYN7asS5jQBLaMAFmTY8oxIT4J+Z/RNkLqtzLwA8RBYCALslulAAAAAElFTkSuQmCC',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Diente Clavija',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA2CAYAAACSjFpuAAAFDklEQVRoQ+2aX0xTVxzHf6flT4E13Za1lMZSFLaSbtGI13SyRoxEfPHfQoZZ1Dgx0UTFRCOBJzU+KS8kkmg0kWbGF4wYlafGKDFQF0Nd7IP0Dr3AnWQgxZtsdBQG9CyXrnpbKL2n908mKS9t7z3n3N/nfL/3d37nBAQr/A+tcD7IAH7sCmcUzChIOAP37wf1IyMYT01F8KZNWo3LZZwkHIKoueoWtdkCLycmIgtBVlfnw4MHq78mipiwsaqAR44whlu3pn0IQRkfJ8bwurW1iDp69PM/CeMW3Vw1wNu3OcOhQ6OdAOi76uo89sWLGXj3LmKzWDTsq1fl5aIjJmyoGmB5+W/0mzfzNoSw1+dzfO/1TkBDw/ivfLwNDTrq0qVSRVRUBTBmTR5GaMnt24fo3t6wDQB7nzwpqqUo+a2qOODDh5xhz56oNbduzWO7ula/t6PPxxmqqpa+R+jEpM0VB1y7doBmmDlepR6Px1HrcqG4ZaGpiTG0tU37EtX9KACFwZ87Z6poalp6zSsupmmlEo5iCgqt6XLlsR7PB2smqnPtGmc4dWp0QUW5E45igBT1mg4E/hGdQJRKOIoACq159mwR1dycOjvGJxxdT1fXmho53kPZAYXWdDp17OPHa0Qv4rGJQQjmL182bTx8WHqdKjtgZSVD+/0zoq2ZqFIs4ZjN2hGGsX8pVUVZAeOtqaOam8mrk1jC4evV48c/+7mlxfKTFEjZAIXv0Pr1uWxvb6loayYCRBPOVClAJEDT3zitVhROF1I2wC1bBum+vukFa967V1S7bVvqxJIsaDkrHFkAL17kDBcuyLuOnTkzVnD1KvcMY5wrZUslGVA42w5HDtvXV5a2NRMVtVoH2jlu7kezWcMyTHpbKsmANTVDtNcb3RFItaYSFY4kQCWsuXTCSX9LlTagz4cNVVX9C9ugsrIs1u//SjZrCiGlJpy0AXfsGKK7u5WxZqKKwvW1rc1UQVLhpAUotOb+/Trq+nXyBZ10XRNUOIMMYxd9EkcMSNNYv2FD4A4AbC4u1rKBgF0Ray6XcE6cMFW0tIirU4kBd+2i9Y8eRX4BwGNud1FtXV36CzqpioItVY/HY6oVc2hMBMjXiadP82cosGrfPp1TDWtKTTiiAXlrVlbSd2Zm8GazWTvAMPZ1pArI0Z404YgGPHBgrODuXe4ZAP7D7XbsrqtLvwCWCkqScEQB3rgR1J88Oc5bs3jvXtPG9nZxL7hUkGT9Sc5wRAGazQF6chLbjEYNOzycXk0oN6zYM5yUgPX1tL6jY74PAEbUzprLTYrYCmdZwA/WRJaDB7/49soVU0huJaSMJ+bQeFnAqDUjpfn5iGlv/7Ri507LVDQgjJ4+HdHl5KxCFkv0isWC/rsnJWTyvlYrPctx81BYmNU9OGhfdBKXFLC+Pqjv6BjnrWkHgDkAGABAQxhHIgghDZ9wAEArCIn/XgoAWbFrCAHk5CDIzkYLn8LvsWuJn4vbwPv+S/V5/jwMnZ1/8Y/sb2w0Os+fj3dZUsBjx15+cvMmbsUYOaMgGAA0GCCC4H/53yf498ZG0w+iAWNWdLuHc0tKSiAcBhwK9fOUYDQ6NKHQqCYczuKVhGAw3lrC3+Pjye/F940Okqr9UiYOBsORwsJs9Pbtur8T76fMouRvhfo9/H5cMDsLmKIW54EVAbjclGYA1TecvE/MKCjvfKo/WkZB9edc3idmFJR3PtUfbcUr+C8rUIhVh+6l8AAAAABJRU5ErkJggg==',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#0000ff',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA2CAYAAACSjFpuAAAFDklEQVRoQ+2aX0xTVxzHf6flT4E13Za1lMZSFLaSbtGI13SyRoxEfPHfQoZZ1Dgx0UTFRCOBJzU+KS8kkmg0kWbGF4wYlafGKDFQF0Nd7IP0Dr3AnWQgxZtsdBQG9CyXrnpbKL2n908mKS9t7z3n3N/nfL/3d37nBAQr/A+tcD7IAH7sCmcUzChIOAP37wf1IyMYT01F8KZNWo3LZZwkHIKoueoWtdkCLycmIgtBVlfnw4MHq78mipiwsaqAR44whlu3pn0IQRkfJ8bwurW1iDp69PM/CeMW3Vw1wNu3OcOhQ6OdAOi76uo89sWLGXj3LmKzWDTsq1fl5aIjJmyoGmB5+W/0mzfzNoSw1+dzfO/1TkBDw/ivfLwNDTrq0qVSRVRUBTBmTR5GaMnt24fo3t6wDQB7nzwpqqUo+a2qOODDh5xhz56oNbduzWO7ula/t6PPxxmqqpa+R+jEpM0VB1y7doBmmDlepR6Px1HrcqG4ZaGpiTG0tU37EtX9KACFwZ87Z6poalp6zSsupmmlEo5iCgqt6XLlsR7PB2smqnPtGmc4dWp0QUW5E45igBT1mg4E/hGdQJRKOIoACq159mwR1dycOjvGJxxdT1fXmho53kPZAYXWdDp17OPHa0Qv4rGJQQjmL182bTx8WHqdKjtgZSVD+/0zoq2ZqFIs4ZjN2hGGsX8pVUVZAeOtqaOam8mrk1jC4evV48c/+7mlxfKTFEjZAIXv0Pr1uWxvb6loayYCRBPOVClAJEDT3zitVhROF1I2wC1bBum+vukFa967V1S7bVvqxJIsaDkrHFkAL17kDBcuyLuOnTkzVnD1KvcMY5wrZUslGVA42w5HDtvXV5a2NRMVtVoH2jlu7kezWcMyTHpbKsmANTVDtNcb3RFItaYSFY4kQCWsuXTCSX9LlTagz4cNVVX9C9ugsrIs1u//SjZrCiGlJpy0AXfsGKK7u5WxZqKKwvW1rc1UQVLhpAUotOb+/Trq+nXyBZ10XRNUOIMMYxd9EkcMSNNYv2FD4A4AbC4u1rKBgF0Ray6XcE6cMFW0tIirU4kBd+2i9Y8eRX4BwGNud1FtXV36CzqpioItVY/HY6oVc2hMBMjXiadP82cosGrfPp1TDWtKTTiiAXlrVlbSd2Zm8GazWTvAMPZ1pArI0Z404YgGPHBgrODuXe4ZAP7D7XbsrqtLvwCWCkqScEQB3rgR1J88Oc5bs3jvXtPG9nZxL7hUkGT9Sc5wRAGazQF6chLbjEYNOzycXk0oN6zYM5yUgPX1tL6jY74PAEbUzprLTYrYCmdZwA/WRJaDB7/49soVU0huJaSMJ+bQeFnAqDUjpfn5iGlv/7Ri507LVDQgjJ4+HdHl5KxCFkv0isWC/rsnJWTyvlYrPctx81BYmNU9OGhfdBKXFLC+Pqjv6BjnrWkHgDkAGABAQxhHIgghDZ9wAEArCIn/XgoAWbFrCAHk5CDIzkYLn8LvsWuJn4vbwPv+S/V5/jwMnZ1/8Y/sb2w0Os+fj3dZUsBjx15+cvMmbsUYOaMgGAA0GCCC4H/53yf498ZG0w+iAWNWdLuHc0tKSiAcBhwK9fOUYDQ6NKHQqCYczuKVhGAw3lrC3+Pjye/F940Okqr9UiYOBsORwsJs9Pbtur8T76fMouRvhfo9/H5cMDsLmKIW54EVAbjclGYA1TecvE/MKCjvfKo/WkZB9edc3idmFJR3PtUfbcUr+C8rUIhVh+6l8AAAAABJRU5ErkJggg==',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Diente Extruido',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAiCAYAAACnSgJKAAACAElEQVRYR+2VPU/CUBSGzymtYEUCDv4BEwVcGY0J+hs0Lg4k4sdKSsJYZqurEo2LITE6OTqIcXJhBdTIbzCoyHePuUQNhYLlmthB7nbTnDzvOe+5bxFsPGgjG0ZwrulnsySFQtjgKgbgG3sqRVIy+XBTKulP8XhgQ1WxySNgaM9VlcTd3cIxAK0xICKenpwEtldXsTWsgKHgDKxphQMiWgcAJyICEdV4BViGs1HHYoWjz46d4+MecDhEKJefuQVYgneCEdHpck3C2JirPeVWq8kt4Ed4N3hiwtfuuPN0C1CUwI6VJRwItwL+ElGvV6FSeWHXGgCe7e8Holtbg59hX3gqlZViMbntMRu1Wcfd290pwOsVzi4v/dFBOWAK39zMSul0fzCRbuAiCt/3YQT0wFX1Rtzbm1aIYAkRJVn2gSAYPW42a9L7eynEiG731J0oive6TjMAKLHcajQqUK2WWAo0PB4hk077tXC4N4h64Ofn5FhZAbq4ME8/9i2ZBNC03DWDvb4GFxFRJyKhXw0TaRZCP257v9SS5dyhINCcoswvqyoafbAYdVxw1qXbnb8CAOntLRhGRLLIM+4KTxGzJhLJX7PacjkYBvgv8M+xZ2zpvBP+556P4Mzz0dh58uI3CWf/U7Ml4RKJx1v2zywWZxf+NNt5/DWr4fJ8BP/tBD4A9ko1Mk8l7EwAAAAASUVORK5CYII=',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#0000ff',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAiCAYAAACnSgJKAAACAElEQVRYR+2VPU/CUBSGzymtYEUCDv4BEwVcGY0J+hs0Lg4k4sdKSsJYZqurEo2LITE6OTqIcXJhBdTIbzCoyHePuUQNhYLlmthB7nbTnDzvOe+5bxFsPGgjG0ZwrulnsySFQtjgKgbgG3sqRVIy+XBTKulP8XhgQ1WxySNgaM9VlcTd3cIxAK0xICKenpwEtldXsTWsgKHgDKxphQMiWgcAJyICEdV4BViGs1HHYoWjz46d4+MecDhEKJefuQVYgneCEdHpck3C2JirPeVWq8kt4Ed4N3hiwtfuuPN0C1CUwI6VJRwItwL+ElGvV6FSeWHXGgCe7e8Holtbg59hX3gqlZViMbntMRu1Wcfd290pwOsVzi4v/dFBOWAK39zMSul0fzCRbuAiCt/3YQT0wFX1Rtzbm1aIYAkRJVn2gSAYPW42a9L7eynEiG731J0oive6TjMAKLHcajQqUK2WWAo0PB4hk077tXC4N4h64Ofn5FhZAbq4ME8/9i2ZBNC03DWDvb4GFxFRJyKhXw0TaRZCP257v9SS5dyhINCcoswvqyoafbAYdVxw1qXbnb8CAOntLRhGRLLIM+4KTxGzJhLJX7PacjkYBvgv8M+xZ2zpvBP+556P4Mzz0dh58uI3CWf/U7Ml4RKJx1v2zywWZxf+NNt5/DWr4fJ8BP/tBD4A9ko1Mk8l7EwAAAAASUVORK5CYII=',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Diente Intruido',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAiCAYAAACuoaIwAAACIElEQVRIS2NkoCNgpKNdDKOWMSxa9II7M/PtaVCw37ihZSwry/id1CggOhg3b37GFRHx/iTIggsXtExUVRl/0sWyU6e0jLW1GX8NP8sOHtQyMjFh/E0Xn61erWXi5UWnOKNrAqGrZaOpET21Ds4SZNWq/5yJiddOgVy7ZYuWqaMj4w+a5TOqFcRubhe5jx5lWc3AwODKxsbBwsnJh+7oP79//7j37dsnJZAEL6/gbSYmVhBTlYGBgQXE+PXrB8P3759AzD98fEz79u/XCNHQYPyMbBA4zh4//s+ZnHyJ6ehR5nUMDIxOrKzsYAsZGRFR+vs3yLAvYL3c3AIMzMxgO8Dg798/DF+/vmf4////HwaG//t27hQPsbERRbEIpA4lgVhb3+C9cOHPGpCFzMwsLNzcgigWYosjdIsmTRIPSU7GtAjDMpAAKRaiWbR7+nSR0Lg4ia+4Eg7WpJ+UdIN35UqID5mYmFm4uPhRgg1k2P///8FB9/fvH3DQNTSIBJWW4rYIq89grkK2kJGRERyksHhCtyg8nCVk3jwNjDgiKVNjs5CJiRnFR8RahNdnMFfNnfuaNy/vJThIQcmchYWN4c+fX+Cgc3ZmCdm0ibCPYGYRVVyhWQiKsX0GBiwhR48SbxFRPkP2YU3N25WfPv1lMDBgDifVIpIsAym+ePE/94IFT/7198uS3GYk2TJc+YdYcaLijFjDCKkbtYxQCBElDwDnSTAyhEv5gAAAAABJRU5ErkJggg==',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#0000ff',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAiCAYAAACuoaIwAAACIElEQVRIS2NkoCNgpKNdDKOWMSxa9II7M/PtaVCw37ihZSwry/id1CggOhg3b37GFRHx/iTIggsXtExUVRl/0sWyU6e0jLW1GX8NP8sOHtQyMjFh/E0Xn61erWXi5UWnOKNrAqGrZaOpET21Ds4SZNWq/5yJiddOgVy7ZYuWqaMj4w+a5TOqFcRubhe5jx5lWc3AwODKxsbBwsnJh+7oP79//7j37dsnJZAEL6/gbSYmVhBTlYGBgQXE+PXrB8P3759AzD98fEz79u/XCNHQYPyMbBA4zh4//s+ZnHyJ6ehR5nUMDIxOrKzsYAsZGRFR+vs3yLAvYL3c3AIMzMxgO8Dg798/DF+/vmf4////HwaG//t27hQPsbERRbEIpA4lgVhb3+C9cOHPGpCFzMwsLNzcgigWYosjdIsmTRIPSU7GtAjDMpAAKRaiWbR7+nSR0Lg4ia+4Eg7WpJ+UdIN35UqID5mYmFm4uPhRgg1k2P///8FB9/fvH3DQNTSIBJWW4rYIq89grkK2kJGRERyksHhCtyg8nCVk3jwNjDgiKVNjs5CJiRnFR8RahNdnMFfNnfuaNy/vJThIQcmchYWN4c+fX+Cgc3ZmCdm0ibCPYGYRVVyhWQiKsX0GBiwhR48SbxFRPkP2YU3N25WfPv1lMDBgDifVIpIsAym+ePE/94IFT/7198uS3GYk2TJc+YdYcaLijFjDCKkbtYxQCBElDwDnSTAyhEv5gAAAAABJRU5ErkJggg==',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Discromico',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAaCAYAAAAnkAWyAAAA1ElEQVRYR+2W4Q6AIAiE8/0fumabzTm5O3WGbvYXqI+DgHBt/ISN2a8D71W9o/xKyt8iTK1qKLbFP/rGd8HOQMYcpPRDtpg7syMfJfbVtxeeATIA1T5F+dRZFoQKZwmY4qfCWxVogUcJbAGfzwh5fI/0PGodpnxZsdqAo0l4wteSL5NYsm2sVVLbE2YCXsqzBaS03dCcH1k0bBT+Ct+7ga3KT4dH6rGPl72dJ8Fiv/+l5VhSJoF6mKWet/zpmGS3jXhc+rlJGfrh4S8feK/KHOW9lH8AOwBAG2SBL2IAAAAASUVORK5CYII=',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#000000',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAaCAYAAAAnkAWyAAAA1ElEQVRYR+2W4Q6AIAiE8/0fumabzTm5O3WGbvYXqI+DgHBt/ISN2a8D71W9o/xKyt8iTK1qKLbFP/rGd8HOQMYcpPRDtpg7syMfJfbVtxeeATIA1T5F+dRZFoQKZwmY4qfCWxVogUcJbAGfzwh5fI/0PGodpnxZsdqAo0l4wteSL5NYsm2sVVLbE2YCXsqzBaS03dCcH1k0bBT+Ct+7ga3KT4dH6rGPl72dJ8Fiv/+l5VhSJoF6mKWet/zpmGS3jXhc+rlJGfrh4S8feK/KHOW9lH8AOwBAG2SBL2IAAAAASUVORK5CYII=',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Ectopico',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAZCAYAAADAHFVeAAAAg0lEQVRIS+2UQQ4AIQgD9f+P1nAgGsIaisBho1eRgVLprfD0QlZ7sBC1NRkHmNk8ilPgDpVxp7vPWr0wSsjA9M64egKmwyAIV+aREZYPhWlDN8uHwvbE6Z1p1i/pDPzzK9xjEAkzO/MWBs3vBgavrIhFTLKazGIKcjtCPHywECX/K+MEpZ8YGjN7Lp8AAAAASUVORK5CYII=',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#000000',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAZCAYAAADAHFVeAAAAg0lEQVRIS+2UQQ4AIQgD9f+P1nAgGsIaisBho1eRgVLprfD0QlZ7sBC1NRkHmNk8ilPgDpVxp7vPWr0wSsjA9M64egKmwyAIV+aREZYPhWlDN8uHwvbE6Z1p1i/pDPzzK9xjEAkzO/MWBs3vBgavrIhFTLKazGIKcjtCPHywECX/K+MEpZ8YGjN7Lp8AAAAASUVORK5CYII=',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Edentulo Total',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAPCAYAAACfvC2ZAAAAYUlEQVRIS2NkGGKAcYi5l2HUwbSOsaEbwiwsO/7TOnTINV9IiJXh1StncODCQ3jUweQGJxZ9WEPYxOTYoE0SID+cOWOFmiSoGCA0NWrolhI0DRYqGj4awlQMTKxGDbkQBgBmqxAQI/ZfPAAAAABJRU5ErkJggg==',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#0000ff',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAPCAYAAACfvC2ZAAAAYUlEQVRIS2NkGGKAcYi5l2HUwbSOsaEbwiwsO/7TOnTINV9IiJXh1StncODCQ3jUweQGJxZ9WEPYxOTYoE0SID+cOWOFmiSoGCA0NWrolhI0DRYqGj4awlQMTKxGDbkQBgBmqxAQI/ZfPAAAAABJRU5ErkJggg==',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Geminacion Fusion',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,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',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#0000ff',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,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',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Giroversion',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,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',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#FF0000',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,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',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Impactacion',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAWCAYAAAAinad/AAAAQUlEQVQ4T2NkoCJgpKJZDHQx7D8OF+O1nJDLYIYSUge2m5CiUcMwo2g0zMBhMpo0iE8aNMnoJBV3hBLtqGGYIQAASCQOFxrbrnsAAAAASUVORK5CYII=',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#000000',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAWCAYAAAAinad/AAAAQUlEQVQ4T2NkoCJgpKJZDHQx7D8OF+O1nJDLYIYSUge2m5CiUcMwo2g0zMBhMpo0iE8aNMnoJBV3hBLtqGGYIQAASCQOFxrbrnsAAAAASUVORK5CYII=',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Implante',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAWCAYAAAC7ZX7KAAAAyklEQVRYR+2WQQ7AIAgE9f+PbuOBBJFVEE1qao8WYVwQyemwLx/Gmy7w7oxxhR8QbGTTy5Lmk+xRPMJQ/WqL5AiByEBW4JE/TZhmzwxwUcAKze08wDxGtS8CXPb2slH+jWwgGPL9O2CkEKnbU5AuF8qSuh5VeBcwLLUvAcuuuqytkaqoDfFyiJSE+iysUFhCHQVc4KUI1ofINNesUtjdT1m+RweqSiMCLNV0tacVwNHhB9Uuuv2WeM3FM9XN7pHR4/8Ce9SasT1O4RfMOVAXvRSYWQAAAABJRU5ErkJggg==',
    categoria: CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA,
    color_primario: '#000000',
    color_secundario: '#FF0000',
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAWCAYAAAC7ZX7KAAAAyklEQVRYR+2WQQ7AIAgE9f+PbuOBBJFVEE1qao8WYVwQyemwLx/Gmy7w7oxxhR8QbGTTy5Lmk+xRPMJQ/WqL5AiByEBW4JE/TZhmzwxwUcAKze08wDxGtS8CXPb2slH+jWwgGPL9O2CkEKnbU5AuF8qSuh5VeBcwLLUvAcuuuqytkaqoDfFyiJSE+iysUFhCHQVc4KUI1ofINNesUtjdT1m+RweqSiMCLNV0tacVwNHhB9Uuuv2WeM3FM9XN7pHR4/8Ce9SasT1O4RfMOVAXvRSYWQAAAABJRU5ErkJggg==',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Macrodoncia',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAZCAYAAACYY8ZHAAABDElEQVRYR+1XQQ7DMAhr///oTZGWiTBjk2rVWJTemlHANrjdeSxwnQtgODaIKioupcQDsMoAXomfJSyq0c6HXPbGP5QFkWnuozAZxd6Hz2v7C0G0vFkgYULQ3JXYiBgIEKFtZxEbHaiKsVi+CcLWf9e4G0QfowwQRpwnRY5TD0BJ7Wxnis7EZ/LBVYqUsPvhl5+B9EX+HgRyJLVrjYSM2w1kMSW8Gr4pJT/y+V4cNaryha58N4jI638CAsmsRmPK6180Z9UYpkIpES04O4debmZBgVd7QT87mCPNKKHYVO8M9jt9Y6MltFbKvrHssqo8aDnV2NlnYOy0nVX5DyGRVWyU9bSVqKLYVqKKEk8pBlsae38vwAAAAABJRU5ErkJggg==',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#000000',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAZCAYAAACYY8ZHAAABDElEQVRYR+1XQQ7DMAhr///oTZGWiTBjk2rVWJTemlHANrjdeSxwnQtgODaIKioupcQDsMoAXomfJSyq0c6HXPbGP5QFkWnuozAZxd6Hz2v7C0G0vFkgYULQ3JXYiBgIEKFtZxEbHaiKsVi+CcLWf9e4G0QfowwQRpwnRY5TD0BJ7Wxnis7EZ/LBVYqUsPvhl5+B9EX+HgRyJLVrjYSM2w1kMSW8Gr4pJT/y+V4cNaryha58N4jI638CAsmsRmPK6180Z9UYpkIpES04O4debmZBgVd7QT87mCPNKKHYVO8M9jt9Y6MltFbKvrHssqo8aDnV2NlnYOy0nVX5DyGRVWyU9bSVqKLYVqKKEk8pBlsae38vwAAAAABJRU5ErkJggg==',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Microdoncia',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAWCAYAAABUpxX0AAAAyElEQVRYR+1WWw7AIAib9z/0Fj5MGANKcNOR6K9YSnlIOwqeVpDzsUnPyhpX+lScepnw7LU7gs/gEdbtnQSRzqJOLLuOF8HxuLikSY0ocW6XJY2CUu81Zz0dHmDEhguQDapjhJQmo69JI5V7i8GalpFpwBwEOUaBo+ZUB5JXHlZ6N2kwBlNKS7Vlff2yPMqT1ppmROnISFQnCGpE/mgV6fDIkwQtRUeVlj+w9ZWbnwtagNByxQN9c2F6TJC9T6/Yp2f5HPZTsjwuKCdSF+29g3QAAAAASUVORK5CYII=',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#000000',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAWCAYAAABUpxX0AAAAyElEQVRYR+1WWw7AIAib9z/0Fj5MGANKcNOR6K9YSnlIOwqeVpDzsUnPyhpX+lScepnw7LU7gs/gEdbtnQSRzqJOLLuOF8HxuLikSY0ocW6XJY2CUu81Zz0dHmDEhguQDapjhJQmo69JI5V7i8GalpFpwBwEOUaBo+ZUB5JXHlZ6N2kwBlNKS7Vlff2yPMqT1ppmROnISFQnCGpE/mgV6fDIkwQtRUeVlj+w9ZWbnwtagNByxQN9c2F6TJC9T6/Yp2f5HPZTsjwuKCdSF+29g3QAAAAASUVORK5CYII=',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Migracion Der',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAfCAYAAABKz/VnAAACP0lEQVRYR+2XQUvjQBTH/9OSqWkm7noRdG0vhWVhl7bqyYve9ejBg4hfwA+wn2ER9qSCn6R6EVzB27ogRbwontqTF5vaTLWzTErMpm3aJq3LRBwInem8N3m/+T/eTAjeUCNviAXvMKqqqZwyp6fWwvKy8TvKhikHw1j5wTSTKJUyK4VCOCjlYAyjLKQqppmsHh1l1sIAKQsTBUhpmLBAysO4QKVSZrVYNC76FYZYwAwL5IM5OXn4RinAGKBpQCpFSS6XuoxSJqP6uAWgl//kZLJWqXwxg9b2wRjGZR4QTjXxGiGAfNpNQlKqOb+G4Y29PpBOSxv6YiM3SNM8HzlOpyna/0tbQNeF0HWa2Ni4+yUEWFDA+fwEPz/PpXrNd8CUa1F3dBx+hED0A3HfEQTUCdOhyjhCfJU1+Obmh++Hh3M/fTn076Bfvr5KSKMtyi3rqy/dfMrIq8QwMo8Ww3i8s1mtdnX12VcMXmCur2uFxcW7s/G8qmsVHmKT6KAYCEH14ODT2tbWR9+FtOucub3lRcvignOg2QQsC+C86fS9sexzSJt6Xc7LcdOx9Wy40396gqjX9YptN9YbjWfNtoH204JtP+Pxsd1vtWQdJQlA/AAQCBQEIjcgNoemE2yAIq6SsYEZBBIbZSTI3t7s6vb2VLzvZsOCKK8MY4nq7u5MV9Ua6m42qCT+j3n34JYgx8fZ2H9p2owl7sOCKJlmS0s3O/v702fz8+xP2ExQrjSHBQi8aI6ykAq+78qooEKvGP4Cq/HlIGySDYcAAAAASUVORK5CYII=',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#0000ff',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAfCAYAAABKz/VnAAACP0lEQVRYR+2XQUvjQBTH/9OSqWkm7noRdG0vhWVhl7bqyYve9ejBg4hfwA+wn2ER9qSCn6R6EVzB27ogRbwontqTF5vaTLWzTErMpm3aJq3LRBwInem8N3m/+T/eTAjeUCNviAXvMKqqqZwyp6fWwvKy8TvKhikHw1j5wTSTKJUyK4VCOCjlYAyjLKQqppmsHh1l1sIAKQsTBUhpmLBAysO4QKVSZrVYNC76FYZYwAwL5IM5OXn4RinAGKBpQCpFSS6XuoxSJqP6uAWgl//kZLJWqXwxg9b2wRjGZR4QTjXxGiGAfNpNQlKqOb+G4Y29PpBOSxv6YiM3SNM8HzlOpyna/0tbQNeF0HWa2Ni4+yUEWFDA+fwEPz/PpXrNd8CUa1F3dBx+hED0A3HfEQTUCdOhyjhCfJU1+Obmh++Hh3M/fTn076Bfvr5KSKMtyi3rqy/dfMrIq8QwMo8Ww3i8s1mtdnX12VcMXmCur2uFxcW7s/G8qmsVHmKT6KAYCEH14ODT2tbWR9+FtOucub3lRcvignOg2QQsC+C86fS9sexzSJt6Xc7LcdOx9Wy40396gqjX9YptN9YbjWfNtoH204JtP+Pxsd1vtWQdJQlA/AAQCBQEIjcgNoemE2yAIq6SsYEZBBIbZSTI3t7s6vb2VLzvZsOCKK8MY4nq7u5MV9Ua6m42qCT+j3n34JYgx8fZ2H9p2owl7sOCKJlmS0s3O/v702fz8+xP2ExQrjSHBQi8aI6ykAq+78qooEKvGP4Cq/HlIGySDYcAAAAASUVORK5CYII=',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Migracion Izq',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAfCAYAAABKz/VnAAACIUlEQVRYR+2XvWoCQRCAZ5UzxZ02aSIIKQIRYxFiZxEbJdrmIRQsQ3yIvIdY+ACGtDEBGwkqBkLARk1SBXLercQ7dMOqp+fvnQYPV7zG/ZnZmW9mf0YEO/ShHWKBPcy2ZnOtzFSrynk83nguFE6c2wS2MgwFCYdrD7LcO8LYv7L+JuFXcqZcxoGrq3qOglCnmIVJp38CqdTXCIRZGAqSTH7kCIF+RrSPucwsAmEuM8tAmIIxAmEGxgwIACgI2W4JsT1xnAoOBwDPA3AcBxwH/b4gEGK3uz6dw9dIEAanjfa1Mf2c1gYQJmT0epo+zzuJx4O+9Wd45mo2CaKtoSAEisHbYTS/9tODEBGLxdNrr9dRpovMwPh871K9rg5juLYdqxQxxv6RrzMwPP/aAQCHVd78046Csf9AW2MGJpFo3mQy4h0rQPq3bm45EwzWSKXyaxg0hEA2FNqwgCz7R8XuwtrMCIiCZLPHl52OSjAGUBQAVVX6v+32oI+xCqpKx2l7MEfb82TGYwMdTXYcC3sPoV5vMjYIyfJZdeE20wu73W9Sq9VdeBlYXc40m+RQFIFQH0WRBk1CkYhrdD0vrZpplRyNNnKS1J2oyZitzZYBWZ0Zo+Nn6v9MqYQvYrHG/XSGmIShEZkHxCwMBZreckzDaECxWONRkrqgv+ON9rMV86bOzDxH8nkcCIX4FyucNGtjbRizBqyU28NYGe1VbO1UZv4AGcUdLyGxHz0AAAAASUVORK5CYII=',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#0000ff',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAfCAYAAABKz/VnAAACIUlEQVRYR+2XvWoCQRCAZ5UzxZ02aSIIKQIRYxFiZxEbJdrmIRQsQ3yIvIdY+ACGtDEBGwkqBkLARk1SBXLercQ7dMOqp+fvnQYPV7zG/ZnZmW9mf0YEO/ShHWKBPcy2ZnOtzFSrynk83nguFE6c2wS2MgwFCYdrD7LcO8LYv7L+JuFXcqZcxoGrq3qOglCnmIVJp38CqdTXCIRZGAqSTH7kCIF+RrSPucwsAmEuM8tAmIIxAmEGxgwIACgI2W4JsT1xnAoOBwDPA3AcBxwH/b4gEGK3uz6dw9dIEAanjfa1Mf2c1gYQJmT0epo+zzuJx4O+9Wd45mo2CaKtoSAEisHbYTS/9tODEBGLxdNrr9dRpovMwPh871K9rg5juLYdqxQxxv6RrzMwPP/aAQCHVd78046Csf9AW2MGJpFo3mQy4h0rQPq3bm45EwzWSKXyaxg0hEA2FNqwgCz7R8XuwtrMCIiCZLPHl52OSjAGUBQAVVX6v+32oI+xCqpKx2l7MEfb82TGYwMdTXYcC3sPoV5vMjYIyfJZdeE20wu73W9Sq9VdeBlYXc40m+RQFIFQH0WRBk1CkYhrdD0vrZpplRyNNnKS1J2oyZitzZYBWZ0Zo+Nn6v9MqYQvYrHG/XSGmIShEZkHxCwMBZreckzDaECxWONRkrqgv+ON9rMV86bOzDxH8nkcCIX4FyucNGtjbRizBqyU28NYGe1VbO1UZv4AGcUdLyGxHz0AAAAASUVORK5CYII=',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Movilidad',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAWCAYAAADafVyIAAAAhUlEQVRIS+2V4QqAMAiEt/d/6IaBMcxzV80F0X6G7u47ydWSfGry/cUT2BzRyEhYjxptEytwqmMbBYoxc1lAGpQGxRnWjAiWCEg8HoV8U4OQkiH4hoCl6ONBhPvvxEa0VMAz9njIuj3QRbcFrNspAtHyQsO1+/GY7SvreuoT8RMM40yPqAELuS4XaeQ4aQAAAABJRU5ErkJggg==',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#000000',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAWCAYAAADafVyIAAAAhUlEQVRIS+2V4QqAMAiEt/d/6IaBMcxzV80F0X6G7u47ydWSfGry/cUT2BzRyEhYjxptEytwqmMbBYoxc1lAGpQGxRnWjAiWCEg8HoV8U4OQkiH4hoCl6ONBhPvvxEa0VMAz9njIuj3QRbcFrNspAtHyQsO1+/GY7SvreuoT8RMM40yPqAELuS4XaeQ4aQAAAABJRU5ErkJggg==',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Oclusal Incisal',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADoAAAAiCAYAAAAOPsreAAABG0lEQVRYR+1XUQ7FIAjb7n/ovbjEhGeEVuIWmexXgZYCsvPY5Ds34Xkk0a8pnYqmokEzkKUbVDgVNlL0Ign3/LC2NUTrQ7Mv98oZwv4Hnb0sg1qAEGHWVotn4TA1mUG0BJiRiIoFkannLPY7AexlFNwiy9qGIaqRRWqj3tTagRVpuqKjRLUStIbYEDnZtKwhU34M0d7AQAOMtXllGNUgvYSgCWole5q6byva60cPBu3tdS8MllI9pyOKaqDQMsC20fSFASWDBVYJoneS9fc4UXb7kUAkuaWJWuCQAu15O4Bk4pAvd4+yi7nnidCejbaE23vs8HKVLvkTs+41V3bWpaMjS6IRVbMwp6KpaNAMZOkGFc69GX2G7zal+wPa10ojjFkA1wAAAABJRU5ErkJggg==',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#000000',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADoAAAAiCAYAAAAOPsreAAABG0lEQVRYR+1XUQ7FIAjb7n/ovbjEhGeEVuIWmexXgZYCsvPY5Ds34Xkk0a8pnYqmokEzkKUbVDgVNlL0Ign3/LC2NUTrQ7Mv98oZwv4Hnb0sg1qAEGHWVotn4TA1mUG0BJiRiIoFkannLPY7AexlFNwiy9qGIaqRRWqj3tTagRVpuqKjRLUStIbYEDnZtKwhU34M0d7AQAOMtXllGNUgvYSgCWole5q6byva60cPBu3tdS8MllI9pyOKaqDQMsC20fSFASWDBVYJoneS9fc4UXb7kUAkuaWJWuCQAu15O4Bk4pAvd4+yi7nnidCejbaE23vs8HKVLvkTs+41V3bWpaMjS6IRVbMwp6KpaNAMZOkGFc69GX2G7zal+wPa10ojjFkA1wAAAABJRU5ErkJggg==',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Ortodontico Fijo',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZcAAABnCAYAAADMgw+gAAAUnUlEQVR4Xu2dC2xTx5rHZ46Jb7gEUBtWukJLt1DpJvRxk9J2wcGhAiGB1FZVkZAaSgMhIFAWk+YCEW1sZFLCrdqwUPqgQkBDGodK5SFVCFVqUVoeYSP6olxasqihL7or2IIILk1snzOrcW1qjHPOHOc4PuP8LUV27Hl88/tm5n/mdQ4leIEACIAACICAxQSoxekhORAAARAAARAgEBdUAhAAARAAAcsJQFwsR4oEQQAEQAAEIC6oAyAAAiAAApYTgLhYjhQJggAIgAAIQFxQB0AABEAABCwnAHGxHCkSBAEQAAEQgLigDoAACIAACFhOQFdcTp48OWXLli2ffPvttwVXr161PHMkeCuBCRMmhMrLy9dt3LhxC9iAAAj8QWDp0qWrzpw588rly5ed4JJZAuPHjydTp04lmzdvHtTgY8DIO3furGtqavJSSu/MbFGQehKBUGFhofPUqVODciyogkAuEDh//vyUioqKD69cuVJACIGwDKFTJ0yYQD755JO0+6GUEc+ePfvg448//hGEZQg9eWtW0RHMnj17MILJmguQsR0IzJw58/r333/PhQWvLBBwu92ktbU1LYFJGWnr1q0127Zt4x0brhSy4FCeJWPsyoULFwqzlD2yBYGsE+jo6Citrq4+RgiBuGTPG8EjR46UT5w48UuzJqQUl5UrV3oOHz7cDHExi9PS8MH33ntv+kMPPfSVpakiMRCQhMC2bdtKtm7delwWcWGM3SRL6e9da+J3/P/495K4gJsZfPXVV91PPPHEabM2pxSXxYsXe44ePQpxMUvT2vDBlpaW6TNmzIC4WMsVqUlCoLGxsaSlpUUacTHCyoVGRnFpaGhwV1dXD19xSb5CSHa0jE6FuBg1V/yeywQgLrbwbnBYi4ukVwRGNQcjFyNC+D2nCUBcbOHerIlLKKH4Nz8zxkKUUr4ZwMyGAB7fTPibWTPGnIIjk0R7+XxoUMfOuD2JdsXjJ9uZ/H2qsiSnY7RICXGxRduCEdkiYEJcbmnXOvYO1H4HW0ShfsuGF8EifW5WxCW0atWqtYqiaJRSjTF2IrZgpTmdzv/p6+v7CyGkjBCixBa2ou+JL0qpQ1EUVfv99V+U0jL+nVlPv/XWW839/f26Dr7rrruCTz31lJcQovH0FUUJO53OfdxOxpjL4XDkJeSrqaraSSmdxhjjdk3jURhjnYqiUB6eMRYtT6zsnQ6Hg2ma5oqlfTISiUx1OBw8LP9j4XC4y+l0TqOU0jNnznQdOXLEaBcMxMVsRUD4nCIgKC6hBx98sN7pdEbbtc5LdTgcJ8LhMG+zLkrpbf1RLK7p/ocx9o/PPvssT1VV3T5o9OjRZPLkyXbxUejatWuru7u7Nxtc1A+9uDidTnLu3Lm09j9bTbe0tLS/t7dXz7GhsrKy+ra2tletzjud9Pbu3buioaGB26JnM8QlHbiIkzMEBMWF9PT0ZL0fevjhh1deuXJFt6MuKSkhBw8ezLqt8QrS1dVVUlFRYbRhYtiLC+vt7dVrVCGXy7UmEAi8ZoeW197e7vF6vUa78SAudnAWbMgaAZnEpby83HPx4kXdNl1cXEwOHz5sG3E5duxYyaJFiyAuejW8tLQU4pK1LgAZg0BmCEBcMsM1nirERYAvxEUAEoKAgGQEIC6ZdRjERYAvxEUAEoKAgGQEZBKX2bNne3p6enJxWuyqz+d7tKqq6ozZ6pP2CX2bLehjWsys5xEeBGxOQCZxeeyxxzzffPONrrhMnDiRHDlyRKY1l5DD4ajdsGHDvgULFvyf2eoCcTFLzILwWNC3ACKSyHkCuSYu/Dkpx48fl0pcFEV5bv369ccqKyv/abbCQVzMErMgPMTFAohIIucJQFwy62KRNRd+d3av1ztrSO8thmmx9B0PcUmfHWIOHwIyicu8efM8X375pe60mIQjF17ZcM4F51yGT6eDkg4PAjKJS0VFhaerq0tXXAoLC4mdnjArMnKBuOCcy/DobVDKYUUg18SF3/7l9OnTMq25YOSCrcjDqs9BYYcJAYhLZh2NkYsAX4iLACQEAQHJCMgkLiIPWJR15OLz+cpwzmXgxoN7i0nWscBcEJBJXJYvX+758MMPdddc7LQJitcukZEL3y3W1NRUhHMuEBf0SCCQMwRyTVy4Y+xwB+d4BREVl3Xr1hUtX74chygHaFkYueRMl4OCDBcCEJfMelpEXPhuMb/f78IhSoxcMlsbkToIDCEBmcRl1apVnkOHDhk9RkO6kQsXF6y54HkuQ9jskRUIZJ6ATOKydu1az/79+yEuCdUCt3/JfBu5LQec0M8CdGQpHQGIS2ZdJjothpELRi6ZrYlIHQSGmADEJbPAIS4CfEXOuZSVldW3tbXx59Zn/SU6ctm5c6d71qxZp7NuMAwAgSwQgLhkFjrERYCvgLiQsrKyUFtb258Ekst4kEAgsNLn820mhDh1Mgvt2rVr9cyZM1/PuEHIAARsSGDjxo0rd+/ebdRObLFI7vV6a9vb2182aNO2sDXu6q6urpKKiorjhJACHfcPzYI+Y4xQ+scyzahRo4iiKMThcET/4p8H+I4/eKZ+xIgRGv89MWzy57y8PN3f43nxeHl5eUpbW9vL4XA42lHHbUy0lX++++67g5WVleWapjF+mIm/eD78lfx/8vfJYeO/DxR30qRJuqON1tbWVX6//xXGmJPzTOaa4OiQUWW1YZ8Ak0DAKgK69T/WbkIFBQX1Docj2q/E+wYzfUhSf2Km74n3I8qpU6c2fv3113qdNA8b9Hg85WPGjGFJfYfqdDpDlNIQ759i/Q0bO3Ys6+vrI7E+U1VVlRUUFBSGw+FIfn5+hFIaIYSEeXhFUeioUaNoJBJx5Ofn/8npdLJwOOyYNGlS90DO6OjoWFldXR0Vb50+KPN3RdbJ3ExF4pUlEy+9EUBifsFMZJ4iTW6P7qgk8XeL2A5R0ZANCNiOQKb6FeGCxi8UjSIwxoKJF+ix8Iwx9mvs82+EkHxCyPXY+zVFURRN034mhGiEkMuKovQxxvh7WNO0a5RSh6ZpXFz/zBgboSjKvzDGKGPsXxljYyildzPGxlJKufg5Brp4HaAfkkZcjNgPy98hLsPS7Sh0DhEQbcOi4WJCwkcmKiGEvwcZY1xobmiadp1S2ksI+ZUxFh3BcFGhlI5gjI0khIyklI5ljN2pKMooTdPyFUUp4AKohxzikkMVMl4UExUuB0uPIoGA/ARE27BoOD7DHxMYLi4anzIjhPymadqv/LOiKPwzH+XEBYiPSPgfF5CRMVHhI5k8RVFGxoQlcdRyG3SIi/z18JYScIfyV4qhco6VFMUBARAwIS4cFu8c+F9UYLiQxNZl+mJiw6fCfmOMcdHgi+EKpZRPof2ZCw0XlJiwxIVH1wEQlxyrnxCXHHMoigMCOgRMisvNyY2YuHCBiYpNTGT4aIYLD+WiwhhTYiLjUBSFL9LzUYzuaCXRVIhLjlVdiEuOORTFAQHrxSVRZH6f6vhdUbiwRMUl9hf9PjaSERaVm4kn7QaOfY8FfVlrNMRFVs/BbhAwTyDNkYv5jNKIgZFLGtAEoyRvZxTd3iyYfOpgBuKS9S2WgyqcceRU5xgGKnM6/khMKzk+zhAZ+yfbIbiPjM6OZNtGU/lDXBYv9hw9evSWO3wmdoJxQPfddx9RVZVomhZ9T/xs9F0olHa/eTNibM84r3wiHQ+PF+9QkjPnB5G8CcNDPne5gVJqdF7FVMUayM4BKlyoqKjouTvuuIMvzKW8wajZzG0WXnU4HCdUVZ2eMC8c/S4cjp4Lu+VFKXXxeWXRMjDG+A6bTkVRmKZpnJ87OZ9IJGImTdPTDKK2IlxKAupPP/10/OLFiyfiAhPvgxJD840w99xzT/TwZKo+KN4PJb/zsP39/WbR8ykpvv2Xn5fjO7X4tl8+PTUqNi1lKIQDnHMxa4deeJG+kMeP94E3bc7ayCW5NNl6ZOeFCxdqVVXVVFXtVxTlYCQSeWr+/Pmv3bhx45ZTpnFQsQoZKi4ufq62trZTVVWXw+E4eePGjWiR+PmkuNCFQqFpmqY5Yp3byUgkwvNx8WCxiqvwE7C8oiZWVv453iHy91S/x+L/Q1XVvB9//DF0/vz5AoPT+cE9e/a4y8vLcW8xK5se0pKGgN/vH7dnz55uSumdekZn4+mOPT09/8ZX0fv6+pwjRozI27t3r9LS0tJpdCuV2tpaV3FxcfREfbzfifcdfX190Yun+P/JvydekCf2N1GliF2sa5rmUlWV7xi77WI/4YKfbwzovHTpEvniiy9OMMb0+qLMr7nYRVxSVbLS0tL+3t5e3RPxLperLhAIvGmHlhUIBEp9Pt8xo4r49ttvlz366KNn7GAzbACBoSbg9/v/1traenPkMlD+2RCXZFva29vHNTQ06AohY+x/A4HApLKyMj7qyfqrs7PzgYULFxoKYkNDg7u6utr0Re5wep6LbcSlvb29xuv1btGbzmOMXdm9e3fRzJkzTT+7Ouu1FgaAgAUEXnrppQd27Nhh1PnZ4maQBw4cKFy9evV/G4yygtu3b3fNmTPnnxbgGXQSondFhrgYP8/FTuLi8Xq9uk+tg7gMuu0gAckJ2HlaLBmtqLi8+eab7rlz55oeBWTClRAXAaoCt9wP2WlaTPR5Lu+8845r+vTptrjKEXADgoCApQSampru37Vr10mjHWN2mBaDuNzuekyLWdocxBITFResuYjxRKjcJNDY2PiAwCK5LabFPvroo8Jly5YZToth5JJiK3Jy9c3WbrFUzShXRy4Ql9zsNFEqMQK5KC7Nzc3uefPmYVpMb8EZ4iLWQFKFEh254DHH6TNGTPkJ5KK4bNq0yf30009DXCAumWmgouKyY8eO6bNnz/4qM1YgVRCwNwGZdot1dHSMW7JkidGZnKCM4vL8889PX7Zsmel+aDituawJBAKv2aE5iYgLdovZwVOwIZsEZNotlsvi4vP5yqqqqkyft4O4ZKH1QFyyAB1ZSkcgF8Vlw4YN7meffVaqaTGIi/E5F4xcpOteYPBwJpCD4hLy+Xy1VVVVb9nBr6LnXCAuEBc71FfYAAKWEZDpnIvgtBgXl7qqqipb3IYK4iJQVQW3ImPkIsASQUDALgQaGxtLWlpajstwiPLTTz8dN3/+fKMFfYjL4tw85wJxsUuvATtAQICATOLS3d09bu7cuYbiUl9fX7dixQqMXHJsKzLERaBBIwgI2IVALopLXV1dncfjkUZc+K7VpqamogULFpi+gS52i2WhJWG3WBagI0vpCEBcMusykTUXLi7r1q0rWr58OcRlAHfwG1di5JLZuorUQcBSAjIdohSdFpNx5OL3+/+6aNGiX8w6FyMXs8QsCI+RiwUQkUTOE5BpKzJ3xsSJE38xeJ5LqKampm7NmjXSTIsRQoIvvPCCa+nSpabvzg5xyUITFREX7lQ7PVgoC5iQ5TAnIJu4TJo0iRm4LLRkyZI6r9crlbj4/X5XZWUlxAXTYsO8R0Lxc4YAxCWzrhRZc+EXuevXr5+2ePHis2atwcjFLDELwgcCgZU+n2+z3m487tSWlpapM2bM+NqCLJEECEhHQKZDlBxuLo5c+IL+cF9z6e/t7XXqtB5bLejv3bt3VUNDwyt64oIbV0rXF8JgiwnIdMt9UXF55plnVr/44ouvW4wqreS6urpKKioqjA6pBv1+/79XVlZ+YzaTlCOXJUuWeD7++GPdZ7wTQkKPPPJIvaIomtlMTYRXKaWdmqZNo5QqifEYY1rsN/r5558fV1W1QE9cxowZU19cXPyywWjBhGnpB7106VLou+++0xNDnjjWXNJHjJg5QEBQXILV1dXlo0ePNlrvyCiR/v7+8u3btxvNRoQmT5783Jw5czozaoxg4j/88MO0AwcObDOaQWlsbJy6cOFC0zMoaU+LxewPCZZjMMF4HgN1xGFCCGOMFVCasiiJ+eqlMxj7MhUX4pIpskhXCgKi51z4hVi2C8QYc1JKjS4YeWcVopQORb8pgoTba2Tz0K+5iFg+VGEYY0RAXIbKHEvy4dNi77777l+nTp1qen+5JQYgERDIMgET4pJlS6NXuEJ9kGi4rBfoDwP4tNjQ7hazUeGFHWsnmwVsCe7cuXParFmzTO/SEEgbQUDA9gQgLrZwUXDIb7lvi2LHjJDwakAEH6bFRCghTM4SkElcRJ0gYV8VbGhocFdXV5t+wFnKhYq1a9d69u/fb7SgL8oz4+EkdJgIk+ChQ4dc9957r+nDSyKJIwwI2J3A5s2bS9544w2j3Uy2KQbvh0Rekk3hB5ubm93z5s2zRlwET5CLcESYNAmMHDnyytmzZwvTjI5oICA9gQ8++KCkpqZGGnGRHnjqAgTff/999/3332+NuPA83G739Z9//llve2+OsrRFsUJr1qz5e01NzRu2sAZGgECWCLjd7l9i/ZDRrqYsWZjb2U6ZMiW4b9++0emUcsD9uydPnly1YsWKV65fv55OugPFkW07sJVlF00r5Ha7SWtra1oOFc0E4UBABgIdHR3/sWzZMk3TNH5GDRe7Q+i0/Pz80MGDB9cVFRVtSSdbw8Mhzc3NtT09PeGrV6860skgIY7qcDhORCIRV/KByIHSjR2U5IcnB5v3IE1PO7qaHHOgMimKQiZMmKC6XK7jTz755Fdp54iIIJBjBLq7u0s2bdrkPnfu3H9evnwZI5gM+3f8+PGktLSUvP7664b6oGfKoCJnuIxIHgRAAARAQFICEBdJHQezQQAEQMDOBCAudvYObAMBEAABSQlAXCR1HMwGARAAATsTgLjY2TuwDQRAAAQkJQBxkdRxMBsEQAAE7EwA4mJn78A2EAABEJCUAMRFUsfBbBAAARCwMwGIi529A9tAAARAQFICEBdJHQezQQAEQMDOBCAudvYObAMBEAABSQlAXCR1HMwGARAAATsTgLjY2TuwDQRAAAQkJQBxkdRxMBsEQAAE7EwA4mJn78A2EAABEJCUAMRFUsfBbBAAARCwMwGIi529A9tAAARAQFICEBdJHQezQQAEQMDOBCAudvYObAMBEAABSQn8P7LQjDrBnFZyAAAAAElFTkSuQmCC',
    categoria: CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA,
    color_primario: '#46464f',
    color_secundario: '#FF0000',
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,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',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Ortodontico Removible',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,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',
    categoria: CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA,
    color_primario: '#46464f',
    color_secundario: '#FF0000',
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,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',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Protesis Fija',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAAWCAYAAACPHL/WAAABaUlEQVRYR2NkGGaAcZj5hwGnh44dO8b55MmTQeNfGRkZhm/fvnFxcXF9+/nzJzcvLy+DiYnJG3QHYnjIwcHh84EDB3gYGBheDBrfIBzCxsDA8IuBgQFEg8DXmTNneqenp1+GKUHxUE9Pj0hJSclNBgYGoUHoGVxOesfAwCCM1UMNDQ0iDQ0NQ85DZ86cUYclP5QYGqoe2rNnj5qLi8tbUCwR4yFQlA7mJPhi1apVSmFhYd+J8dC7hoYG9YaGBozSZADz2H80u1/s379f0dHR8QcxHnpZWFio2N/fD/b9IAEUeWjYxdCoh+iQLEdwkqusrBRub28/xcDAIAYN6fdtbW2GVVVV4DJ+kAB0t3zYsmWLiY+Pz3uMUm7//v0su3bt4ufk5JT69+8f49+/f/96enres7KyGjSlXGVlpSg7Ozs82f38+fN/W1vbO0ZGRrDYyOk+DJLkRbIzRmOI5CCjs4bRGKJzgJNsHQAbdLwXmx6S1QAAAABJRU5ErkJggg==',
    categoria: CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA,
    color_primario: '#000000',
    color_secundario: '#FF0000',
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAAWCAYAAACPHL/WAAABaUlEQVRYR2NkGGaAcZj5hwGnh44dO8b55MmTQeNfGRkZhm/fvnFxcXF9+/nzJzcvLy+DiYnJG3QHYnjIwcHh84EDB3gYGBheDBrfIBzCxsDA8IuBgQFEg8DXmTNneqenp1+GKUHxUE9Pj0hJSclNBgYGoUHoGVxOesfAwCCM1UMNDQ0iDQ0NQ85DZ86cUYclP5QYGqoe2rNnj5qLi8tbUCwR4yFQlA7mJPhi1apVSmFhYd+J8dC7hoYG9YaGBozSZADz2H80u1/s379f0dHR8QcxHnpZWFio2N/fD/b9IAEUeWjYxdCoh+iQLEdwkqusrBRub28/xcDAIAYN6fdtbW2GVVVV4DJ+kAB0t3zYsmWLiY+Pz3uMUm7//v0su3bt4ufk5JT69+8f49+/f/96enres7KyGjSlXGVlpSg7Ozs82f38+fN/W1vbO0ZGRrDYyOk+DJLkRbIzRmOI5CCjs4bRGKJzgJNsHQAbdLwXmx6S1QAAAABJRU5ErkJggg==',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Protesis Removible',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAWCAYAAABtwKSvAAABq0lEQVRYR+1WPWvCUBS9ifKgivTDJP+gdbQdugQEJf4KcZeAk7/Av+HsIPobIhEEhyylWztU9yTVQkkreTSWlFiM2nBfaUuIfWO4591z7nncEw4SdLgEaYEvxdRqtUue51dYsRzHud1u9w4A0Jj13e12Oz2dTo8ppUzD7fV69ia/KPAzVkhQtxiPx8VSqbRgxIGiKPnhcGgAwAkWK0kSmKaZx4phnfBc07SLarX6iCW0riuXy8JoNLoHgDMsVhAEsG07ZEaUM4kSwzrhp8lkci3L8hw73XVd8MxuACALAO4ePNn+xvTMOp2OwELKcRyv1WoxC/F76LqeNgzjPJVKWTzPO9t9Pc/L5nK5HTqNRgO9AFi0xKKWaRXGgnEEicMQU6/Xi5RStBmEkDdVVR9kWX5Fg4JCPzRns1lhuVymWbD9fv8WmzPMoalp2tV3cmZjm51ixYiiCJZlhbbCj+aMruuFSqUS2jAYcrEMzTiL+evQ9P/NMgCwE5D73P3V0KSUrprNJusAPngOBoMj0zQzruu+EEJ8Qaiz3e8wVjNqNDEr+ncmZoZ80kmUM++BnrQXmkf1UAAAAABJRU5ErkJggg==',
    categoria: CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA,
    color_primario: '#000000',
    color_secundario: '#FF0000',
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAWCAYAAABtwKSvAAABq0lEQVRYR+1WPWvCUBS9ifKgivTDJP+gdbQdugQEJf4KcZeAk7/Av+HsIPobIhEEhyylWztU9yTVQkkreTSWlFiM2nBfaUuIfWO4591z7nncEw4SdLgEaYEvxdRqtUue51dYsRzHud1u9w4A0Jj13e12Oz2dTo8ppUzD7fV69ia/KPAzVkhQtxiPx8VSqbRgxIGiKPnhcGgAwAkWK0kSmKaZx4phnfBc07SLarX6iCW0riuXy8JoNLoHgDMsVhAEsG07ZEaUM4kSwzrhp8lkci3L8hw73XVd8MxuACALAO4ePNn+xvTMOp2OwELKcRyv1WoxC/F76LqeNgzjPJVKWTzPO9t9Pc/L5nK5HTqNRgO9AFi0xKKWaRXGgnEEicMQU6/Xi5RStBmEkDdVVR9kWX5Fg4JCPzRns1lhuVymWbD9fv8WmzPMoalp2tV3cmZjm51ixYiiCJZlhbbCj+aMruuFSqUS2jAYcrEMzTiL+evQ9P/NMgCwE5D73P3V0KSUrprNJusAPngOBoMj0zQzruu+EEJ8Qaiz3e8wVjNqNDEr+ncmZoZ80kmUM++BnrQXmkf1UAAAAABJRU5ErkJggg==',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Protesis Total',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAXCAYAAABNq8wJAAAAyUlEQVRYR2NkGOKAcYi7n2HUAwMdgygxEBMToz/QDiJk/5IlSy4iq0FPQp8JGTCQ8qKiogyvX7/mxeeB/wPpQEJ2i4iIMLx58wYl0NFjYMh74C2hUBhIeTExMYZXr14J40xCU6ZMQZGkp2N//PhBVJFeUlLyBl8eoKebqWIXUb6mik00MmR4eSAqKsrg79+/g7okWrly5WhFRqPUTNjY0YqMcBjRVgXBimzSpEmi7OzsgzoTp6enj1ZktE0nJJo+vCoyEj0/KJQDAEhdOBia00W7AAAAAElFTkSuQmCC',
    categoria: CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA,
    color_primario: '#000000',
    color_secundario: '#FF0000',
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAXCAYAAABNq8wJAAAAyUlEQVRYR2NkGOKAcYi7n2HUAwMdgygxEBMToz/QDiJk/5IlSy4iq0FPQp8JGTCQ8qKiogyvX7/mxeeB/wPpQEJ2i4iIMLx58wYl0NFjYMh74C2hUBhIeTExMYZXr14J40xCU6ZMQZGkp2N//PhBVJFeUlLyBl8eoKebqWIXUb6mik00MmR4eSAqKsrg79+/g7okWrly5WhFRqPUTNjY0YqMcBjRVgXBimzSpEmi7OzsgzoTp6enj1ZktE0nJJo+vCoyEj0/KJQDAEhdOBia00W7AAAAAElFTkSuQmCC',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Remanente Radicular',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAWCAYAAADXYyzPAAAAkElEQVRIS2NkGCDAOED2Mgy8xa+lpP7j873os2dYHUmuPgzDYAYhW4RNDN2RpOojymKQJYQsxyWPS3zUYpxBOiBBTchSXGkAnz6ccYycanFlJWQ12LIVPn0EExcxvsXmY0L6CFpMTFaialCPFiCEghxfnGKTg8cxrsIeW5DDUjNIjlx9A18t0rtBMOpjuoU4AESW0Bfxuhj6AAAAAElFTkSuQmCC',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#ff0000',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAWCAYAAADXYyzPAAAAkElEQVRIS2NkGCDAOED2Mgy8xa+lpP7j873os2dYHUmuPgzDYAYhW4RNDN2RpOojymKQJYQsxyWPS3zUYpxBOiBBTchSXGkAnz6ccYycanFlJWQ12LIVPn0EExcxvsXmY0L6CFpMTFaialCPFiCEghxfnGKTg8cxrsIeW5DDUjNIjlx9A18t0rtBMOpjuoU4AESW0Bfxuhj6AAAAAElFTkSuQmCC',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Restaruracion',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAYCAYAAADkgu3FAAABPUlEQVRIS2NkoBNgpJM9DBgW7d//SeTsWVTrmZh4v/748ZmLj4+XKHfl5DC+RVeIYtGqVT918/I+b2VkZOBGVvj/P8MvRkYGNqJsYWBgkJdn/nrihKAcsnoUiwID3+ufOPHnCCMjAw+xhmJT9/8/47tly9jUHR353sDkaWLRv3+ML44fF1ZUVGT8QXOLli8XVnR0pLFFoKBbu1ZY1cqK8R1NfQSyaMMGNjVzcz546qNJHNEtMdDVog0bhNXMzREZlyZBB0re69YJK1lZMX6naWIAWTRpkrBSWBiNLQLF0Z49wqra2sMpedMtHw0Oi9LSvuhu3vz9GDWqCbw+2rbts2hS0o8TDAyMXKRUdOh1kpwc4+uTJ4U1cFZ8IImbN/+LbN3KQFLVjWwgL+9nhvh4RGGKNcNSUqsS0ku3VhAAAPrYGdCYT8sAAAAASUVORK5CYII=',
    categoria: CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA,
    color_primario: '#0000FF',
    color_secundario: '#FF0000',
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAYCAYAAADkgu3FAAABPUlEQVRIS2NkoBNgpJM9DBgW7d//SeTsWVTrmZh4v/748ZmLj4+XKHfl5DC+RVeIYtGqVT918/I+b2VkZOBGVvj/P8MvRkYGNqJsYWBgkJdn/nrihKAcsnoUiwID3+ufOPHnCCMjAw+xhmJT9/8/47tly9jUHR353sDkaWLRv3+ML44fF1ZUVGT8QXOLli8XVnR0pLFFoKBbu1ZY1cqK8R1NfQSyaMMGNjVzcz546qNJHNEtMdDVog0bhNXMzREZlyZBB0re69YJK1lZMX6naWIAWTRpkrBSWBiNLQLF0Z49wqra2sMpedMtHw0Oi9LSvuhu3vz9GDWqCbw+2rbts2hS0o8TDAyMXKRUdOh1kpwc4+uTJ4U1cFZ8IImbN/+LbN3KQFLVjWwgL+9nhvh4RGGKNcNSUqsS0ku3VhAAAPrYGdCYT8sAAAAASUVORK5CYII=',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Restauracion Temporal',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAhCAYAAACiGknfAAACY0lEQVRYR+2Yv0/bUBDH3zmpiVDtwfaAaJuBwfwBDY5xElhgidiy8R9UDUIiKEKwVupCR0YY2FAUhYg/gKUKS6bSH8pfUKQUVDWpYrnBVz1DqiBSJ9iOLSO8eLDv7vO+Pt+7e0BCdkHIeMnjAsZ6XWq1Wr59BG5yEiGZvLQLOFDhq1wuf12rvQdCDN9oe4F4vinu7aVgaWkg+D1gbDSky8XFc2SYKd9hCSGAeMUuL8v84eFowL9OTyVjdbWBAIIFjNimN6o2EsKOZREA1O+Nb8Q2k04nxVLp66BY9xS+A4zYjsTjKTYeRzMa/Q66PgXR6D+bP90u43YBzwgh1wyTMc7OPlBoqrCuqvLLSsWBwohtfn1dm9jaOncLNsy+OT2NPYVBVRWpUvn2YIXpasVCYRY2N38MC+j2eT8woyhJsVp9eEpYwDs7MuTztqXGLSy19wbYNC/EYnEGNjY6XkDZ+bgDrGmqWC5/cZQS7NqazG9v+6pwLJFQuZMTB8CmedEpFmde+aiwVYdVVeadVAnLOACFmbClRGRhYV44OvrsKIeDqBKugNlCYZb3uQ6HDzid1oRSaeDuattLWD9dEAprWkoolz85yuEn4P9sd/07XeRJ4TE0Fp4pHER76TglCCEGMzf3Vshkjlux2E2D7fWl68AAvOjs7n4kAM/piOQGmOIZcDvXec3a82fNihT2dqaLKIomVKsj1uF6XTJWVgKbmqnCsWx2ntvfH62XoIv8mcu96dZq78alqK1fxN8TBwevuWy2OdLG0f8SPfkhPp78EI4jkEjYzo+P62wtkJQYEjR0Cv8FCCDlMZMuoQYAAAAASUVORK5CYII=',
    categoria: CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA,
    color_primario: '#0000FF',
    color_secundario: '#FF0000',
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAhCAYAAACiGknfAAACY0lEQVRYR+2Yv0/bUBDH3zmpiVDtwfaAaJuBwfwBDY5xElhgidiy8R9UDUIiKEKwVupCR0YY2FAUhYg/gKUKS6bSH8pfUKQUVDWpYrnBVz1DqiBSJ9iOLSO8eLDv7vO+Pt+7e0BCdkHIeMnjAsZ6XWq1Wr59BG5yEiGZvLQLOFDhq1wuf12rvQdCDN9oe4F4vinu7aVgaWkg+D1gbDSky8XFc2SYKd9hCSGAeMUuL8v84eFowL9OTyVjdbWBAIIFjNimN6o2EsKOZREA1O+Nb8Q2k04nxVLp66BY9xS+A4zYjsTjKTYeRzMa/Q66PgXR6D+bP90u43YBzwgh1wyTMc7OPlBoqrCuqvLLSsWBwohtfn1dm9jaOncLNsy+OT2NPYVBVRWpUvn2YIXpasVCYRY2N38MC+j2eT8woyhJsVp9eEpYwDs7MuTztqXGLSy19wbYNC/EYnEGNjY6XkDZ+bgDrGmqWC5/cZQS7NqazG9v+6pwLJFQuZMTB8CmedEpFmde+aiwVYdVVeadVAnLOACFmbClRGRhYV44OvrsKIeDqBKugNlCYZb3uQ6HDzid1oRSaeDuattLWD9dEAprWkoolz85yuEn4P9sd/07XeRJ4TE0Fp4pHER76TglCCEGMzf3Vshkjlux2E2D7fWl68AAvOjs7n4kAM/piOQGmOIZcDvXec3a82fNihT2dqaLKIomVKsj1uF6XTJWVgKbmqnCsWx2ntvfH62XoIv8mcu96dZq78alqK1fxN8TBwevuWy2OdLG0f8SPfkhPp78EI4jkEjYzo+P62wtkJQYEjR0Cv8FCCDlMZMuoQYAAAAASUVORK5CYII=',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Semi Impactacion',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAXCAYAAAAYyi9XAAAAm0lEQVRIS+2VQQ7AIAgE9f+PbsOBhGxZQlWMTepRlIEFsbfNq2/mtWOAF2QugcmeDRDP6JUwCc+ojtRmHWfOh1VCBwjTy2xf7JHtAc8C1XFZhgLwglkOtBJ5UK8+U5JizSyAdd8SIAOXSBrJxmqblT/dGFH7T0k68t6+CcSajGTujjj2uL3BzKYSOn49vEu/yGP+w7Is/wyXS3sDpGcmGDbfZtoAAAAASUVORK5CYII=',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#000000',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAXCAYAAAAYyi9XAAAAm0lEQVRIS+2VQQ7AIAgE9f+PbsOBhGxZQlWMTepRlIEFsbfNq2/mtWOAF2QugcmeDRDP6JUwCc+ojtRmHWfOh1VCBwjTy2xf7JHtAc8C1XFZhgLwglkOtBJ5UK8+U5JizSyAdd8SIAOXSBrJxmqblT/dGFH7T0k68t6+CcSajGTujjj2uL3BzKYSOn49vEu/yGP+w7Is/wyXS3sDpGcmGDbfZtoAAAAASUVORK5CYII=',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Supernumerario',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,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',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#0000ff',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,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',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Transposicion',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,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',
    categoria: CategoriaSimboloOdontograma.CONDICION_HALLAZGO,
    color_primario: '#0000ff',
    color_secundario: null,
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,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',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
  {
    nombre: 'Tratamiento Pulpar',
    descripcion: 'Símbolo predeterminado del sistema',
    imagen_base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAmCAYAAAAm56DSAAABF0lEQVRIS2NkoCJgpKJZDEPYsBUr3uv/+/f/PyQ4WP9GRfFexRU0eL05Y8ZL/ZKSd+YMDP/aIQYwVaanCxzp7ZW8hs1AvIZNmPBSr6bmzf7//xmEQJoZGRneJSUJ20+aJHGFXMOO/v/PwAM17EtMDK/ljBly1DJM2HLGDKq5jEzD+vpe6NbVvT2G7M2oKGGrWbMkLpMcZj09n0QaGh7fRIqAL2QbNnHiO53q6ufHqeIyaNJAiU2yXTZqGOlJYzTMRsMMRw0xtJJGTAyZJS0Wb76LihJUnzVL6g3JJS22MBuGtRO2Gj0+nsdu6lR5rO0NvM2DQ4e+6BUUvLBjYGDohdTojAXFxaKro6L4SI8AUhuCQ7ixR4pXAbJwRTZoqkaoAAAAAElFTkSuQmCC',
    categoria: CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA,
    color_primario: '#0000FF',
    color_secundario: '#FF0000',
    activo: true,
    datos_canvas: {
      objetos: [
        {
          tipo: 'imagen',
          x: 0,
          y: 0,
          ancho: 400,
          alto: 400,
          imagen:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAmCAYAAAAm56DSAAABF0lEQVRIS2NkoCJgpKJZDEPYsBUr3uv/+/f/PyQ4WP9GRfFexRU0eL05Y8ZL/ZKSd+YMDP/aIQYwVaanCxzp7ZW8hs1AvIZNmPBSr6bmzf7//xmEQJoZGRneJSUJ20+aJHGFXMOO/v/PwAM17EtMDK/ljBly1DJM2HLGDKq5jEzD+vpe6NbVvT2G7M2oKGGrWbMkLpMcZj09n0QaGh7fRIqAL2QbNnHiO53q6ufHqeIyaNJAiU2yXTZqGOlJYzTMRsMMRw0xtJJGTAyZJS0Wb76LihJUnzVL6g3JJS22MBuGtRO2Gj0+nsdu6lR5rO0NvM2DQ4e+6BUUvLBjYGDohdTojAXFxaKro6L4SI8AUhuCQ7ixR4pXAbJwRTZoqkaoAAAAAElFTkSuQmCC',
          eliminar_fondo: true,
          modo: 'draw',
        },
      ],
    },
  },
];
