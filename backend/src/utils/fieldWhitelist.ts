/**
 * Field whitelisting utilities to prevent privilege escalation
 * Only allow specific fields to be updated in update endpoints
 */

/**
 * Whitelist allowed fields from request body
 * @param body - Request body object
 * @param allowedFields - Array of allowed field names (readonly arrays are supported)
 * @returns Object with only allowed fields
 */
export function whitelistFields<T extends Record<string, any>>(
  body: T,
  allowedFields: readonly (keyof T)[]
): Partial<T> {
  const whitelisted: Partial<T> = {};
  
  for (const field of allowedFields) {
    if (field in body && body[field] !== undefined) {
      whitelisted[field] = body[field];
    }
  }
  
  return whitelisted;
}

/**
 * User update allowed fields
 * Users should NOT be able to update: id, email (should use separate endpoint), role, plano, created_at, etc.
 */
export const USER_UPDATE_ALLOWED_FIELDS = [
  'nome',
  'ddd',
  'telefone',
  'chavePix',
] as const;

/**
 * Participante update allowed fields
 */
export const PARTICIPANTE_UPDATE_ALLOWED_FIELDS = [
  'nome',
  'email',
  'chavePix',
  'telefone',
] as const;

/**
 * Grupo update allowed fields
 */
export const GRUPO_UPDATE_ALLOWED_FIELDS = [
  'nome',
  'descricao',
  'data',
] as const;

/**
 * Despesa update allowed fields
 * Note: participacoes is handled separately in the controller
 */
export const DESPESA_UPDATE_ALLOWED_FIELDS = [
  'descricao',
  'valor',
  'pagadorId',
  'data',
] as const;
