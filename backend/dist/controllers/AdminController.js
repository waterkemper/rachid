"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const AdminService_1 = require("../services/AdminService");
class AdminController {
    static async getEstatisticasGerais(req, res) {
        try {
            const estatisticas = await AdminService_1.AdminService.getEstatisticasGerais();
            res.json(estatisticas);
        }
        catch (error) {
            console.error('Erro ao obter estatísticas gerais:', error);
            res.status(500).json({ error: 'Erro ao obter estatísticas' });
        }
    }
    static async getEstatisticasUsuarios(req, res) {
        try {
            const estatisticas = await AdminService_1.AdminService.getEstatisticasUsuarios();
            res.json(estatisticas);
        }
        catch (error) {
            console.error('Erro ao obter estatísticas de usuários:', error);
            res.status(500).json({ error: 'Erro ao obter estatísticas de usuários' });
        }
    }
    static async getEstatisticasEventos(req, res) {
        try {
            const estatisticas = await AdminService_1.AdminService.getEstatisticasEventos();
            res.json(estatisticas);
        }
        catch (error) {
            console.error('Erro ao obter estatísticas de eventos:', error);
            res.status(500).json({ error: 'Erro ao obter estatísticas de eventos' });
        }
    }
    static async getEstatisticasDespesas(req, res) {
        try {
            const estatisticas = await AdminService_1.AdminService.getEstatisticasDespesas();
            res.json(estatisticas);
        }
        catch (error) {
            console.error('Erro ao obter estatísticas de despesas:', error);
            res.status(500).json({ error: 'Erro ao obter estatísticas de despesas' });
        }
    }
    static async getEstatisticasAcessos(req, res) {
        try {
            const estatisticas = await AdminService_1.AdminService.getEstatisticasAcessos();
            res.json(estatisticas);
        }
        catch (error) {
            console.error('Erro ao obter estatísticas de acessos:', error);
            res.status(500).json({ error: 'Erro ao obter estatísticas de acessos' });
        }
    }
    static async getAllUsuarios(req, res) {
        try {
            const usuarios = await AdminService_1.AdminService.getAllUsuarios();
            res.json(usuarios);
        }
        catch (error) {
            console.error('Erro ao listar usuários:', error);
            res.status(500).json({ error: 'Erro ao listar usuários' });
        }
    }
    static async getAllEventos(req, res) {
        try {
            const eventos = await AdminService_1.AdminService.getAllEventos();
            res.json(eventos);
        }
        catch (error) {
            console.error('Erro ao listar eventos:', error);
            res.status(500).json({ error: 'Erro ao listar eventos' });
        }
    }
}
exports.AdminController = AdminController;
