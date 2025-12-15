"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanService = void 0;
const data_source_1 = require("../database/data-source");
const Usuario_1 = require("../entities/Usuario");
class PlanService {
    static async isPro(usuarioId) {
        const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
        if (!usuario)
            return false;
        if (usuario.plano !== 'PRO')
            return false;
        if (!usuario.planoValidoAte)
            return true;
        return usuario.planoValidoAte.getTime() > Date.now();
    }
}
exports.PlanService = PlanService;
PlanService.usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
