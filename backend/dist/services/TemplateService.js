"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
class TemplateService {
    static getAll() {
        return this.templates;
    }
    static getById(id) {
        return this.templates.find(t => t.id === id) || null;
    }
}
exports.TemplateService = TemplateService;
TemplateService.templates = [
    {
        id: 'churrasco',
        nome: 'Churrasco',
        descricao: 'Divisão de despesas do churrasco',
        despesas: ['Carne', 'Bebidas', 'Carvão', 'Gelo', 'Aluguel do Salão'],
    },
    {
        id: 'viagem',
        nome: 'Viagem',
        descricao: 'Divisão de despesas da viagem',
        despesas: ['Hospedagem', 'Combustível', 'Alimentação', 'Pedágio', 'Aluguel de Carro'],
    },
    {
        id: 'escola',
        nome: 'Escola',
        descricao: 'Divisão de despesas escolares',
        despesas: ['Lanche', 'Material', 'Transporte', 'Uniforme'],
    },
    {
        id: 'time',
        nome: 'Time',
        descricao: 'Divisão de despesas do time',
        despesas: ['Aluguel da quadra', 'Água', 'Bola / Material'],
    },
];
