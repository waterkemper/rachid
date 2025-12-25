"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt_1 = require("../utils/jwt");
function authMiddleware(req, res, next) {
    try {
        // Tentar obter token do cookie primeiro
        let token = req.cookies?.token;
        // Se não tiver no cookie, tentar no header Authorization
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }
        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }
        try {
            const payload = (0, jwt_1.verifyToken)(token);
            req.usuarioId = payload.usuarioId;
            next();
        }
        catch (error) {
            return res.status(401).json({ error: 'Token inválido' });
        }
    }
    catch (error) {
        return res.status(401).json({ error: 'Erro na autenticação' });
    }
}
