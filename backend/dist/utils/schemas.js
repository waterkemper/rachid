"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.anexoIdParamSchema = exports.grupoIdParamSchema = exports.despesaIdParamSchema = exports.idParamSchema = exports.createLifetimeSchema = exports.createSubscriptionSchema = exports.updateDespesaSchema = exports.createDespesaSchema = exports.updateGrupoSchema = exports.createGrupoSchema = exports.updateParticipanteSchema = exports.createParticipanteSchema = exports.resetarSenhaSchema = exports.validarTokenRecuperacaoSchema = exports.solicitarRecuperacaoSenhaSchema = exports.updateUserSchema = exports.createUserSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
/**
 * Common validation schemas
 */
// Auth schemas
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    senha: zod_1.z.string().min(1, 'Password is required'),
});
exports.createUserSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1, 'Name is required').max(255),
    email: zod_1.z.string().email('Invalid email format'),
    senha: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    ddd: zod_1.z.string().regex(/^\d{2}$/, 'DDD must be 2 digits').optional(),
    telefone: zod_1.z.string().optional(),
    referralCode: zod_1.z.string().optional(),
});
exports.updateUserSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1).max(255).optional(),
    email: zod_1.z.string().email().optional(),
    ddd: zod_1.z.string().regex(/^\d{2}$/).optional(),
    telefone: zod_1.z.string().optional(),
    chavePix: zod_1.z.string().optional(),
});
exports.solicitarRecuperacaoSenhaSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
});
exports.validarTokenRecuperacaoSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
});
exports.resetarSenhaSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
    senha: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
});
// Participante schemas
exports.createParticipanteSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1, 'Name is required').max(255),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    chavePix: zod_1.z.string().optional(),
    telefone: zod_1.z.string().optional(),
});
exports.updateParticipanteSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1).max(255).optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    chavePix: zod_1.z.string().optional(),
    telefone: zod_1.z.string().optional(),
});
// Grupo schemas
exports.createGrupoSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1, 'Name is required').max(255),
    descricao: zod_1.z.string().optional(),
    data: zod_1.z.string().optional(),
    participanteIds: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
    templateId: zod_1.z.string().optional(),
});
exports.updateGrupoSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1).max(255).optional(),
    descricao: zod_1.z.string().optional(),
    data: zod_1.z.string().optional(),
});
// Despesa schemas
exports.createDespesaSchema = zod_1.z.object({
    descricao: zod_1.z.string().min(1, 'Description is required').max(500),
    valor: zod_1.z.number().positive('Value must be positive'),
    pagadorId: zod_1.z.number().int().positive('Pagador ID must be a positive integer'),
    participanteIds: zod_1.z.array(zod_1.z.number().int().positive()).min(1, 'At least one participant is required'),
    data: zod_1.z.string().optional(),
});
exports.updateDespesaSchema = zod_1.z.object({
    descricao: zod_1.z.string().min(1).max(500).optional(),
    valor: zod_1.z.number().positive().optional(),
    pagadorId: zod_1.z.number().int().positive().optional(),
    participanteIds: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
    data: zod_1.z.string().optional(),
});
// Subscription schemas
exports.createSubscriptionSchema = zod_1.z.object({
    planType: zod_1.z.enum(['MONTHLY', 'YEARLY'], {
        errorMap: () => ({ message: 'planType must be MONTHLY or YEARLY' }),
    }),
    paymentMethod: zod_1.z.enum(['PIX', 'CREDIT_CARD'], {
        errorMap: () => ({ message: 'paymentMethod must be PIX or CREDIT_CARD' }),
    }),
    creditCard: zod_1.z.object({
        holderName: zod_1.z.string(),
        number: zod_1.z.string(),
        expiryMonth: zod_1.z.string(),
        expiryYear: zod_1.z.string(),
        ccv: zod_1.z.string(),
    }).optional(),
    creditCardHolderInfo: zod_1.z.object({
        name: zod_1.z.string(),
        email: zod_1.z.string().email(),
        cpfCnpj: zod_1.z.string(),
        postalCode: zod_1.z.string(),
        addressNumber: zod_1.z.string(),
        addressComplement: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        mobilePhone: zod_1.z.string().optional(),
    }).optional(),
    userCpfCnpj: zod_1.z.string().optional(),
});
exports.createLifetimeSchema = zod_1.z.object({
    paymentMethod: zod_1.z.enum(['PIX', 'CREDIT_CARD']),
    installmentCount: zod_1.z.number().int().positive().optional(),
    creditCard: zod_1.z.object({
        holderName: zod_1.z.string(),
        number: zod_1.z.string(),
        expiryMonth: zod_1.z.string(),
        expiryYear: zod_1.z.string(),
        ccv: zod_1.z.string(),
    }).optional(),
    creditCardHolderInfo: zod_1.z.object({
        name: zod_1.z.string(),
        email: zod_1.z.string().email(),
        cpfCnpj: zod_1.z.string(),
        postalCode: zod_1.z.string(),
        addressNumber: zod_1.z.string(),
        addressComplement: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        mobilePhone: zod_1.z.string().optional(),
    }).optional(),
    userCpfCnpj: zod_1.z.string().optional(),
});
// Params schemas
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});
exports.despesaIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});
exports.grupoIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});
exports.anexoIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
    anexoId: zod_1.z.string().regex(/^\d+$/, 'Anexo ID must be a number').transform(Number),
});
