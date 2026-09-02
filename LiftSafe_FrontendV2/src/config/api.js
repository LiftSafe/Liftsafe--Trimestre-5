<<<<<<< HEAD
=======
<<<<<<< HEAD
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
=======
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
// src/config/api.js

// ✅ USAR VARIABLE DE ENTORNO EN LUGAR DE HARDCODEAR
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const ROLE_IDS = {
  Administrador: 1,
  'Director Técnico': 2,
  Coordinador: 3,
  Inspector: 4,
  Asesor: 5,
  Cliente: 6,
};

export const ADMIN_CREATABLE_ROLES = [
  'Administrador',
  'Director Técnico',
  'Coordinador',
  'Inspector',
  'Asesor',
];

// ============ TIPOS DE DOCUMENTO COLOMBIA (MAYORES DE EDAD) ============
// Fuente: Registraduría Nacional del Estado Civil - Colombia

export const DOCUMENT_TYPES = [
  { 
    value: 'CC', 
    label: 'Cédula de ciudadanía',
    description: 'Documento principal para ciudadanos colombianos mayores de 18 años',
    minAge: 18,
    entity: 'Registraduría Nacional del Estado Civil'
  },
  { 
    value: 'CE', 
    label: 'Cédula de extranjería',
    description: 'Para extranjeros residentes en Colombia con visa mayor a 3 meses',
    minAge: 18,
    entity: 'Migración Colombia'
  },
  { 
    value: 'PA', 
    label: 'Pasaporte',
    description: 'Documento de identidad internacional para colombianos',
    minAge: 0,
    entity: 'Ministerio de Relaciones Exteriores'
  },
  { 
    value: 'RC', 
    label: 'Registro civil',
    description: 'Documento de identidad para menores de edad (se mantiene hasta los 18)',
    minAge: 0,
    entity: 'Registraduría Nacional del Estado Civil'
  },
  { 
    value: 'TI', 
    label: 'Tarjeta de identidad',
    description: 'Documento para menores entre 7 y 17 años (se mantiene hasta los 18)',
    minAge: 7,
    entity: 'Registraduría Nacional del Estado Civil'
  },
  { 
    value: 'NIT', 
    label: 'NIT - Número de Identificación Tributaria',
    description: 'Para personas jurídicas y naturales con actividad empresarial',
    minAge: 18,
    entity: 'DIAN'
  },
  { 
    value: 'PEP', 
    label: 'Permiso Especial de Permanencia',
    description: 'Para venezolanos con estatus migratorio especial en Colombia',
    minAge: 18,
    entity: 'Migración Colombia'
  },
  { 
    value: 'PPT', 
    label: 'Pasaporte de la ONU / Protección Temporal',
    description: 'Documento para personas bajo estatuto de protección temporal',
    minAge: 18,
    entity: 'ACNUR / Migración Colombia'
  },
  { 
    value: 'CD', 
    label: 'Carné diplomático',
    description: 'Para funcionarios diplomáticos extranjeros acreditados en Colombia',
    minAge: 18,
    entity: 'Ministerio de Relaciones Exteriores'
  },
];

// Helper para obtener solo documentos de mayores de edad (≥18)
export const ADULT_DOCUMENT_TYPES = DOCUMENT_TYPES.filter(
  doc => doc.minAge >= 18
);

// Helper para obtener label por valor
export const getDocumentLabel = (value) => {
  return DOCUMENT_TYPES.find(d => d.value === value)?.label || value;
};
<<<<<<< HEAD
=======
>>>>>>> feature/esteban-local
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
