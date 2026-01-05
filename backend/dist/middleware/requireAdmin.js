"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
const data_source_1 = require("../database/data-source");
const Usuario_1 = require("../entities/Usuario");
async function requireAdmin(req, res, next) {
    try {
        const usuarioId = req.usuarioId;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const usuario = await usuarioRepository.findOne({ where: { id: usuarioId } });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        if (usuario.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar esta rota.' });
        }
        next();
    }
    catch (error) {
        console.error('Erro ao verificar permissões de admin:', error);
        return res.status(500).json({ error: 'Erro ao verificar permissões' });
    }
}
