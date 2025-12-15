"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("dotenv/config");
const data_source_1 = require("../database/data-source");
const Usuario_1 = require("../entities/Usuario");
const Participante_1 = require("../entities/Participante");
const Grupo_1 = require("../entities/Grupo");
const Despesa_1 = require("../entities/Despesa");
const bcrypt_1 = __importDefault(require("bcrypt"));
async function migrateData() {
    try {
        console.log('Iniciando migração de dados...');
        await data_source_1.AppDataSource.initialize();
        console.log('Conexão com banco de dados estabelecida');
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const participanteRepository = data_source_1.AppDataSource.getRepository(Participante_1.Participante);
        const grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
        const despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
        // Verificar se já existe um usuário admin
        let adminUsuario = await usuarioRepository.findOne({ where: { email: 'admin@admin.com' } });
        if (!adminUsuario) {
            console.log('Criando usuário admin...');
            const senhaHash = await bcrypt_1.default.hash('admin123', 10);
            adminUsuario = usuarioRepository.create({
                email: 'admin@admin.com',
                senha: senhaHash,
                nome: 'Administrador',
            });
            adminUsuario = await usuarioRepository.save(adminUsuario);
            console.log('Usuário admin criado com sucesso');
            console.log('Email: admin@admin.com');
            console.log('Senha: admin123');
        }
        else {
            console.log('Usuário admin já existe');
        }
        // Atualizar participantes sem usuario_id
        const participantesSemUsuario = await participanteRepository
            .createQueryBuilder('participante')
            .where('participante.usuario_id IS NULL')
            .getMany();
        if (participantesSemUsuario.length > 0) {
            console.log(`Atribuindo ${participantesSemUsuario.length} participantes ao usuário admin...`);
            for (const participante of participantesSemUsuario) {
                participante.usuario_id = adminUsuario.id;
                await participanteRepository.save(participante);
            }
            console.log('Participantes atualizados');
        }
        // Atualizar grupos sem usuario_id
        const gruposSemUsuario = await grupoRepository
            .createQueryBuilder('grupo')
            .where('grupo.usuario_id IS NULL')
            .getMany();
        if (gruposSemUsuario.length > 0) {
            console.log(`Atribuindo ${gruposSemUsuario.length} grupos ao usuário admin...`);
            for (const grupo of gruposSemUsuario) {
                grupo.usuario_id = adminUsuario.id;
                await grupoRepository.save(grupo);
            }
            console.log('Grupos atualizados');
        }
        // Atualizar despesas sem usuario_id
        const despesasSemUsuario = await despesaRepository
            .createQueryBuilder('despesa')
            .where('despesa.usuario_id IS NULL')
            .getMany();
        if (despesasSemUsuario.length > 0) {
            console.log(`Atribuindo ${despesasSemUsuario.length} despesas ao usuário admin...`);
            for (const despesa of despesasSemUsuario) {
                despesa.usuario_id = adminUsuario.id;
                await despesaRepository.save(despesa);
            }
            console.log('Despesas atualizadas');
        }
        console.log('Migração concluída com sucesso!');
        process.exit(0);
    }
    catch (error) {
        console.error('Erro durante a migração:', error);
        process.exit(1);
    }
}
migrateData();
