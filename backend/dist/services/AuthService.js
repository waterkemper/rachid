"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const data_source_1 = require("../database/data-source");
const Usuario_1 = require("../entities/Usuario");
const jwt_1 = require("../utils/jwt");
class AuthService {
    static async login(email, senha) {
        const usuario = await this.repository.findOne({ where: { email } });
        if (!usuario) {
            return null;
        }
        const senhaValida = await bcrypt_1.default.compare(senha, usuario.senha);
        if (!senhaValida) {
            return null;
        }
        const token = (0, jwt_1.generateToken)({
            usuarioId: usuario.id,
            email: usuario.email,
        });
        const { senha: _, ...usuarioSemSenha } = usuario;
        return { token, usuario: usuarioSemSenha };
    }
    static async createUsuario(data) {
        const senhaHash = await bcrypt_1.default.hash(data.senha, 10);
        const usuario = this.repository.create({
            email: data.email,
            senha: senhaHash,
            nome: data.nome,
            ddd: data.ddd,
            telefone: data.telefone,
        });
        return await this.repository.save(usuario);
    }
    static async findById(id) {
        return await this.repository.findOne({ where: { id } });
    }
    static async findByEmail(email) {
        return await this.repository.findOne({ where: { email } });
    }
}
exports.AuthService = AuthService;
AuthService.repository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
