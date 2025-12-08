import { AppDataSource } from '../database/data-source';
import { ParticipacaoDespesa } from '../entities/ParticipacaoDespesa';
import { Despesa } from '../entities/Despesa';

export class ParticipacaoService {
  private static participacaoRepository = AppDataSource.getRepository(ParticipacaoDespesa);
  private static despesaRepository = AppDataSource.getRepository(Despesa);

  static async toggleParticipacao(despesaId: number, participanteId: number): Promise<ParticipacaoDespesa | null> {
    const despesa = await this.despesaRepository.findOne({
      where: { id: despesaId },
      relations: ['participacoes'],
    });

    if (!despesa) {
      throw new Error('Despesa não encontrada');
    }

    const participacaoExistente = await this.participacaoRepository.findOne({
      where: {
        despesa_id: despesaId,
        participante_id: participanteId,
      },
    });

    if (participacaoExistente) {
      await this.participacaoRepository.delete(participacaoExistente.id);
      await this.recalcularValores(despesaId);
      return null;
    } else {
      const valorPorPessoa = await this.calcularValorPorPessoa(despesaId);
      const novaParticipacao = this.participacaoRepository.create({
        despesa_id: despesaId,
        participante_id: participanteId,
        valorDevePagar: valorPorPessoa,
      });
      const participacaoSalva = await this.participacaoRepository.save(novaParticipacao);
      await this.recalcularValores(despesaId);
      return participacaoSalva;
    }
  }

  static async recalcularValores(despesaId: number): Promise<void> {
    const despesa = await this.despesaRepository.findOne({
      where: { id: despesaId },
      relations: ['participacoes'],
    });

    if (!despesa) return;

    const participacoes = await this.participacaoRepository.find({
      where: { despesa_id: despesaId },
    });

    if (participacoes.length === 0) return;

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

  private static async calcularValorPorPessoa(despesaId: number): Promise<number> {
    const despesa = await this.despesaRepository.findOne({
      where: { id: despesaId },
    });

    if (!despesa) return 0;

    const participacoes = await this.participacaoRepository.find({
      where: { despesa_id: despesaId },
    });

    const totalParticipantes = participacoes.length + 1;
    return Math.round((Number(despesa.valorTotal) / totalParticipantes) * 100) / 100;
  }
}

