export interface DefaultCategory {
  name: string;
  color: string;
  icon: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Hogar', color: '#4A90D9', icon: '🏠' },
  { name: 'Entretenimiento', color: '#9B59B6', icon: '🎬' },
  { name: 'Servicios', color: '#3498DB', icon: '📱' },
  { name: 'Auto', color: '#E67E22', icon: '🚗' },
  { name: 'Comida', color: '#E74C3C', icon: '🍽️' },
  { name: 'Salud', color: '#2ECC71', icon: '💊' },
  { name: 'Educación', color: '#1ABC9C', icon: '📚' },
  { name: 'Transporte', color: '#F39C12', icon: '🚌' },
  { name: 'Ropa', color: '#E91E63', icon: '👕' },
];
