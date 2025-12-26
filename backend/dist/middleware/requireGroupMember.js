"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireGroupMember = requireGroupMember;
const data_source_1 = require("../database/data-source");
const Grupo_1 = require("../entities/Grupo");
const ParticipanteGrupo_1 = require("../entities/ParticipanteGrupo");
const Usuario_1 = require("../entities/Usuario");
/**
 * Middleware que verifica se o usuário é membro do grupo (evento)
 * Permite acesso se:
 * 1. Usuário é dono do grupo (grupo.usuario_id === usuarioId), OU
 * 2. Usuário tem um participante no grupo cujo email corresponde ao email do usuário
 */
async function requireGroupMember(req, res, next) {
    try {
        const usuarioId = req.usuarioId;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        // Obter grupoId do body (POST) ou params (PUT/DELETE)
        let grupoId;
        if (req.method === 'POST' && req.body.grupo_id) {
            grupoId = Number(req.body.grupo_id);
        }
        else if (req.params.id) {
            // Para PUT/DELETE, precisamos buscar a despesa primeiro para obter o grupo_id
            // Isso será feito no controller ou podemos passar grupoId no body
            // Por enquanto, vamos buscar do body se existir
            if (req.body.grupo_id) {
                grupoId = Number(req.body.grupo_id);
            }
        }
        // Se não temos grupoId ainda, tentar buscar da despesa (para PUT/DELETE)
        if (!grupoId && req.params.id) {
            const { Despesa } = await Promise.resolve().then(() => __importStar(require('../entities/Despesa')));
            const despesaRepository = data_source_1.AppDataSource.getRepository(Despesa);
            const despesa = await despesaRepository.findOne({
                where: { id: Number(req.params.id) },
                select: ['grupo_id'],
            });
            if (despesa) {
                grupoId = despesa.grupo_id;
            }
        }
        if (!grupoId) {
            return res.status(400).json({ error: 'ID do grupo não fornecido' });
        }
        const grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
        const participanteGrupoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupo_1.ParticipanteGrupo);
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        // Buscar o grupo
        const grupo = await grupoRepository.findOne({
            where: { id: grupoId },
        });
        if (!grupo) {
            return res.status(404).json({ error: 'Grupo não encontrado' });
        }
        // Verificar se usuário é dono do grupo
        if (grupo.usuario_id === usuarioId) {
            return next();
        }
        // Se não é dono, verificar se tem participante no grupo com email correspondente
        const usuario = await usuarioRepository.findOne({
            where: { id: usuarioId },
            select: ['email'],
        });
        if (!usuario || !usuario.email) {
            return res.status(403).json({ error: 'Usuário não tem permissão para acessar este grupo' });
        }
        // Buscar participantes do grupo
        const participantesGrupo = await participanteGrupoRepository.find({
            where: { grupo_id: grupoId },
            relations: ['participante'],
        });
        // Verificar se algum participante tem email que corresponde ao email do usuário
        const isMember = participantesGrupo.some((pg) => pg.participante?.email?.toLowerCase() === usuario.email.toLowerCase());
        if (!isMember) {
            return res.status(403).json({ error: 'Usuário não é membro deste grupo' });
        }
        next();
    }
    catch (error) {
        console.error('Erro no middleware requireGroupMember:', error);
        return res.status(500).json({ error: 'Erro ao verificar permissão' });
    }
}
