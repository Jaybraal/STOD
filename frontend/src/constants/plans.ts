export type PlanId = 'basico' | 'clinica' | 'clinica_plus';

export interface Plan {
  id: PlanId;
  name: string;
  priceLabel: string;
  audience: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'basico',
    name: 'Básico',
    priceLabel: '$25/mes',
    audience: '1 profesional, sin personal adicional',
    features: ['Ficha de paciente', 'Documentos profesionales', 'Agenda'],
  },
  {
    id: 'clinica',
    name: 'Clínica',
    priceLabel: '$55/mes',
    audience: '1-3 profesionales + personal de apoyo',
    features: [
      'Todo lo del plan Básico',
      'Invitación de personal por rol',
      'Denti (asistente de IA)',
    ],
  },
  {
    id: 'clinica_plus',
    name: 'Clínica+',
    priceLabel: '$95/mes',
    audience: 'Clínicas con 4+ profesionales',
    features: [
      'Todo lo del plan Clínica',
      'Soporte prioritario',
      'Branding avanzado',
    ],
  },
];
