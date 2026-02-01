import { z } from 'zod';

/**
 * Common validation schemas
 */

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  senha: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  nome: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email format'),
  senha: z.string().min(8, 'Password must be at least 8 characters'),
  ddd: z.string().regex(/^\d{2}$/, 'DDD must be 2 digits').optional(),
  telefone: z.string().optional(),
  referralCode: z.string().optional(),
});

export const updateUserSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  ddd: z.string().regex(/^\d{2}$/).optional(),
  telefone: z.string().optional(),
  chavePix: z.string().optional(),
});

export const solicitarRecuperacaoSenhaSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const validarTokenRecuperacaoSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const resetarSenhaSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  senha: z.string().min(8, 'Password must be at least 8 characters'),
});

// Participante schemas
export const createParticipanteSchema = z.object({
  nome: z.string().min(1, 'Name is required').max(255),
  email: z.string().email().optional().or(z.literal('')),
  chavePix: z.string().optional(),
  telefone: z.string().optional(),
});

export const updateParticipanteSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  email: z.string().email().optional().or(z.literal('')),
  chavePix: z.string().optional(),
  telefone: z.string().optional(),
});

// Grupo schemas
export const createGrupoSchema = z.object({
  nome: z.string().min(1, 'Name is required').max(255),
  descricao: z.string().optional(),
  data: z.string().optional(),
  participanteIds: z.array(z.number().int().positive()).optional(),
  templateId: z.string().optional(),
});

export const updateGrupoSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().optional(),
  data: z.string().optional(),
});

// Despesa schemas - alinhado ao payload do frontend (grupo_id, valorTotal, participante_pagador_id, participacoes)
export const createDespesaSchema = z.object({
  grupo_id: z.number().int().positive('grupo_id is required'),
  descricao: z.string().min(1, 'Description is required').max(500),
  valorTotal: z.number().nonnegative('Value must be zero or positive'),
  participante_pagador_id: z.number().int().positive().optional(),
  data: z.string().optional(),
  participacoes: z.array(z.object({
    participante_id: z.number().int().positive(),
    valorDevePagar: z.number().nonnegative(),
  })).optional(),
});

export const updateDespesaSchema = z.object({
  descricao: z.string().min(1).max(500).optional(),
  valorTotal: z.number().nonnegative().optional(), // Frontend envia valorTotal - permite zero
  participante_pagador_id: z.number().int().positive().optional(), // Frontend envia participante_pagador_id
  participanteIds: z.array(z.number().int().positive()).optional(),
  data: z.string().optional(),
  participacoes: z.array(z.object({
    participante_id: z.number().int().positive(),
    valorDevePagar: z.number().nonnegative(), // Permite zero quando valorTotal é 0,00
  })).optional(),
});

// Subscription schemas
export const createSubscriptionSchema = z.object({
  planType: z.enum(['MONTHLY', 'YEARLY'], {
    errorMap: () => ({ message: 'planType must be MONTHLY or YEARLY' }),
  }),
  paymentMethod: z.enum(['PIX', 'CREDIT_CARD'], {
    errorMap: () => ({ message: 'paymentMethod must be PIX or CREDIT_CARD' }),
  }),
  creditCard: z.object({
    holderName: z.string(),
    number: z.string(),
    expiryMonth: z.string(),
    expiryYear: z.string(),
    ccv: z.string(),
  }).optional(),
  creditCardHolderInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    cpfCnpj: z.string(),
    postalCode: z.string(),
    addressNumber: z.string(),
    addressComplement: z.string().optional(),
    phone: z.string().optional(),
    mobilePhone: z.string().optional(),
  }).optional(),
  userCpfCnpj: z.string().optional(),
});

export const createLifetimeSchema = z.object({
  paymentMethod: z.enum(['PIX', 'CREDIT_CARD']),
  installmentCount: z.number().int().positive().optional(),
  creditCard: z.object({
    holderName: z.string(),
    number: z.string(),
    expiryMonth: z.string(),
    expiryYear: z.string(),
    ccv: z.string(),
  }).optional(),
  creditCardHolderInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    cpfCnpj: z.string(),
    postalCode: z.string(),
    addressNumber: z.string(),
    addressComplement: z.string().optional(),
    phone: z.string().optional(),
    mobilePhone: z.string().optional(),
  }).optional(),
  userCpfCnpj: z.string().optional(),
});

// Params schemas
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

export const despesaIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

export const grupoIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

export const anexoIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
  anexoId: z.string().regex(/^\d+$/, 'Anexo ID must be a number').transform(Number),
});
