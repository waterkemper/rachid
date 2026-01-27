"use strict";
/**
 * Field whitelisting utilities to prevent privilege escalation
 * Only allow specific fields to be updated in update endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DESPESA_UPDATE_ALLOWED_FIELDS = exports.GRUPO_UPDATE_ALLOWED_FIELDS = exports.PARTICIPANTE_UPDATE_ALLOWED_FIELDS = exports.USER_UPDATE_ALLOWED_FIELDS = void 0;
exports.whitelistFields = whitelistFields;
/**
 * Whitelist allowed fields from request body
 * @param body - Request body object
 * @param allowedFields - Array of allowed field names (readonly arrays are supported)
 * @returns Object with only allowed fields
 */
function whitelistFields(body, allowedFields) {
    const whitelisted = {};
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
exports.USER_UPDATE_ALLOWED_FIELDS = [
    'nome',
    'ddd',
    'telefone',
    'chavePix',
];
/**
 * Participante update allowed fields
 */
exports.PARTICIPANTE_UPDATE_ALLOWED_FIELDS = [
    'nome',
    'email',
    'chavePix',
    'telefone',
];
/**
 * Grupo update allowed fields
 */
exports.GRUPO_UPDATE_ALLOWED_FIELDS = [
    'nome',
    'descricao',
    'data',
];
/**
 * Despesa update allowed fields
 * Note: participacoes is handled separately in the controller
 * Frontend envia: valorTotal e participante_pagador_id
 */
exports.DESPESA_UPDATE_ALLOWED_FIELDS = [
    'descricao',
    'valorTotal',
    'participante_pagador_id',
    'data',
];
