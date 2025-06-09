// src/common/index.ts
export * from './utils/date.utils';
// adicionar mais exportações conforme necessário
// Exportação centralizada de todos os validadores
export { DocumentValidator } from './utils/document.validator';
export { DateValidator } from './utils/date.validator';
export { AddressValidator } from './utils/address.validator';
export { NumericValidator } from './utils/numeric.validator';

// Re-exportar a classe de validação XML atualizada
export { DataValidation } from './utils/xmlValidation.util';
export type {
  ImportDataItem,
  ImportDataArray,
  ValidationError,
  ValidationResult,
} from './utils/xmlValidation.util';
