"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipacaoService = void 0;
const data_source_1 = require("../database/data-source");
const ParticipacaoDespesa_1 = require("../entities/ParticipacaoDespesa");
const Despesa_1 = require("../entities/Despesa");
class ParticipacaoService {
    static async toggleParticipacao(despesaId, participanteId, usuarioId) {
        const despesa = await this.despesaRepository.findOne({
            where: { id: despesaId, usuario_id: usuarioId },
            relations: ['participacoes'],
        });
        if (!despesa) {
            throw new Error('Despesa não encontrada ou não pertence ao usuário');
        }
        const participacaoExistente = await this.participacaoRepository.findOne({
            where: {
                despesa_id: despesaId,
                participante_id: participanteId,
            },
        });
        if (participacaoExistente) {
            await this.participacaoRepository.delete(participacaoExistente.id);
            await this.recalcularValores(despesaId, usuarioId);
            return null;
        }
        else {
            const valorPorPessoa = await this.calcularValorPorPessoa(despesaId);
            const novaParticipacao = this.participacaoRepository.create({
                despesa_id: despesaId,
                participante_id: participanteId,
                valorDevePagar: valorPorPessoa,
            });
            const participacaoSalva = await this.participacaoRepository.save(novaParticipacao);
            await this.recalcularValores(despesaId, usuarioId);
            return participacaoSalva;
        }
    }
    static async recalcularValores(despesaId, usuarioId) {
        const despesa = await this.despesaRepository.findOne({
            where: { id: despesaId, usuario_id: usuarioId },
            relations: ['participacoes'],
        });
        if (!despesa)
            return;
        const participacoes = await this.participacaoRepository.find({
            where: { despesa_id: despesaId },
        });
        if (participacoes.length === 0)
            return;
        const valorPorPessoa = Number(despesa.valorTotal) / participacoes.length;
        const valorArredondado = Math.round(valorPorPessoa * 100) / 100;
        for (const participacao of participacoes) {
            participacao.valorDevePagar = valorArredondado;
            await this.participacaoRepository.save(participacao);
        }
        const somaAtual = participacoes.reduce((acc, p) => acc + Number(p.valorDevePagar), 0);
        const diferenca = Number(despesa.valorTotal) - somaAtual;
        if (Math.abs(diferenca) > 0.01) {
            const primeiraParticipacao = participacoes[0];
            if (primeiraParticipacao) {
                primeiraParticipacao.valorDevePagar = Number(primeiraParticipacao.valorDevePagar) + diferenca;
                await this.participacaoRepository.save(primeiraParticipacao);
            }
        }
    }
    static async calcularValorPorPessoa(despesaId) {
        const despesa = await this.despesaRepository.findOne({
            where: { id: despesaId },
        });
        if (!despesa)
            return 0;
        const participacoes = await this.participacaoRepository.find({
            where: { despesa_id: despesaId },
        });
        const totalParticipantes = participacoes.length + 1;
        return Math.round((Number(despesa.valorTotal) / totalParticipantes) * 100) / 100;
    }
}
exports.ParticipacaoService = ParticipacaoService;
ParticipacaoService.participacaoRepository = data_source_1.AppDataSource.getRepository(ParticipacaoDespesa_1.ParticipacaoDespesa);
ParticipacaoService.despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
