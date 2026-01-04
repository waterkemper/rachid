import { AppDataSource } from '../database/data-source';
import { Usuario } from '../entities/Usuario';
import { Grupo } from '../entities/Grupo';
import { Despesa } from '../entities/Despesa';
import { EventoAcesso } from '../entities/EventoAcesso';
import { MoreThanOrEqual } from 'typeorm';

export interface EstatisticasUsuarios {
  total: number;
  novosUltimos7Dias: number;
  novosUltimos30Dias: number;
  ativosUltimos30Dias: number; // Usuários que criaram eventos/despesas
}

export interface EstatisticasEventos {
  total: number;
  criadosUltimos7Dias: number;
  criadosUltimos30Dias: number;
  comAcessoPublico: number;
}

export interface EstatisticasDespesas {
  total: number;
  valorTotal: number;
  mediaPorEvento: number;
  criadasUltimos7Dias: number;
  criadasUltimos30Dias: number;
}

export interface EstatisticasAcessos {
  total: number;
  ultimos7Dias: number;
  ultimos30Dias: number;
  porEvento: Array<{
    eventoId: number;
    eventoNome: string;
    acessos: number;
  }>;
}

export interface EstatisticasGerais {
  usuarios: EstatisticasUsuarios;
  eventos: EstatisticasEventos;
  despesas: EstatisticasDespesas;
  acessos: EstatisticasAcessos;
}

export class AdminService {
  private static usuarioRepository = AppDataSource.getRepository(Usuario);
  private static grupoRepository = AppDataSource.getRepository(Grupo);
  private static despesaRepository = AppDataSource.getRepository(Despesa);
  private static eventoAcessoRepository = AppDataSource.getRepository(EventoAcesso);

  static async getEstatisticasUsuarios(): Promise<EstatisticasUsuarios> {
    const agora = new Date();
    const ultimos7Dias = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ultimos30Dias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, novosUltimos7Dias, novosUltimos30Dias] = await Promise.all([
      this.usuarioRepository.count(),
      this.usuarioRepository.count({ where: { criadoEm: MoreThanOrEqual(ultimos7Dias) } }),
      this.usuarioRepository.count({ where: { criadoEm: MoreThanOrEqual(ultimos30Dias) } }),
    ]);

    // Usuários ativos = que criaram eventos ou despesas nos últimos 30 dias
    const usuariosAtivosQuery = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .where('EXISTS (SELECT 1 FROM grupos WHERE grupos.usuario_id = usuario.id AND grupos."criadoEm" >= :ultimos30Dias)', { ultimos30Dias })
      .orWhere('EXISTS (SELECT 1 FROM despesas WHERE despesas.usuario_id = usuario.id AND despesas."criadoEm" >= :ultimos30Dias)', { ultimos30Dias })
      .select('COUNT(DISTINCT usuario.id)', 'count')
      .getRawOne();

    const ativosUltimos30Dias = parseInt(usuariosAtivosQuery?.count || '0', 10);

    return {
      total,
      novosUltimos7Dias,
      novosUltimos30Dias,
      ativosUltimos30Dias,
    };
  }

  static async getEstatisticasEventos(): Promise<EstatisticasEventos> {
    const agora = new Date();
    const ultimos7Dias = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ultimos30Dias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, criadosUltimos7Dias, criadosUltimos30Dias] = await Promise.all([
      this.grupoRepository.count(),
      this.grupoRepository.count({ where: { criadoEm: MoreThanOrEqual(ultimos7Dias) } }),
      this.grupoRepository.count({ where: { criadoEm: MoreThanOrEqual(ultimos30Dias) } }),
    ]);

    // Contar grupos com share_token não nulo
    const gruposComAcessoPublico = await this.grupoRepository
      .createQueryBuilder('grupo')
      .where('grupo.share_token IS NOT NULL')
      .andWhere("grupo.share_token != ''")
      .getCount();

    return {
      total,
      criadosUltimos7Dias,
      criadosUltimos30Dias,
      comAcessoPublico: gruposComAcessoPublico,
    };
  }

  static async getEstatisticasDespesas(): Promise<EstatisticasDespesas> {
    const agora = new Date();
    const ultimos7Dias = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ultimos30Dias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, criadasUltimos7Dias, criadasUltimos30Dias] = await Promise.all([
      this.despesaRepository.count(),
      this.despesaRepository.count({ where: { criadoEm: MoreThanOrEqual(ultimos7Dias) } }),
      this.despesaRepository.count({ where: { criadoEm: MoreThanOrEqual(ultimos30Dias) } }),
    ]);

    // Calcular valor total e média
    const valorTotalResult = await this.despesaRepository
      .createQueryBuilder('despesa')
      .select('SUM(despesa.valorTotal)', 'total')
      .getRawOne();

    const valorTotal = parseFloat(valorTotalResult?.total || '0');

    // Contar grupos únicos que têm despesas
    const gruposComDespesas = await this.despesaRepository
      .createQueryBuilder('despesa')
      .select('COUNT(DISTINCT despesa.grupo_id)', 'count')
      .getRawOne();

    const gruposCount = parseInt(gruposComDespesas?.count || '0', 10);
    const mediaPorEvento = gruposCount > 0 ? valorTotal / gruposCount : 0;

    return {
      total,
      valorTotal,
      mediaPorEvento,
      criadasUltimos7Dias,
      criadasUltimos30Dias,
    };
  }

  static async getEstatisticasAcessos(): Promise<EstatisticasAcessos> {
    const agora = new Date();
    const ultimos7Dias = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ultimos30Dias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, ultimos7DiasCount, ultimos30DiasCount] = await Promise.all([
      this.eventoAcessoRepository.count(),
      this.eventoAcessoRepository.count({ where: { acessadoEm: MoreThanOrEqual(ultimos7Dias) } }),
      this.eventoAcessoRepository.count({ where: { acessadoEm: MoreThanOrEqual(ultimos30Dias) } }),
    ]);

    // Agrupar acessos por evento
    const acessosPorEvento = await this.eventoAcessoRepository
      .createQueryBuilder('acesso')
      .innerJoin('acesso.evento', 'grupo')
      .select('grupo.id', 'eventoId')
      .addSelect('grupo.nome', 'eventoNome')
      .addSelect('COUNT(acesso.id)', 'acessos')
      .groupBy('grupo.id')
      .addGroupBy('grupo.nome')
      .orderBy('acessos', 'DESC')
      .limit(20) // Top 20 eventos mais acessados
      .getRawMany();

    const porEvento = acessosPorEvento.map((item) => ({
      eventoId: item.eventoId,
      eventoNome: item.eventoNome,
      acessos: parseInt(item.acessos || '0', 10),
    }));

    return {
      total,
      ultimos7Dias: ultimos7DiasCount,
      ultimos30Dias: ultimos30DiasCount,
      porEvento,
    };
  }

  static async getEstatisticasGerais(): Promise<EstatisticasGerais> {
    const [usuarios, eventos, despesas, acessos] = await Promise.all([
      this.getEstatisticasUsuarios(),
      this.getEstatisticasEventos(),
      this.getEstatisticasDespesas(),
      this.getEstatisticasAcessos(),
    ]);

    return {
      usuarios,
      eventos,
      despesas,
      acessos,
    };
  }

  static async getAllUsuarios(): Promise<Usuario[]> {
    const usuarios = await this.usuarioRepository.find({
      select: ['id', 'email', 'nome', 'ddd', 'telefone', 'chavePix', 'plano', 'planoValidoAte', 'role', 'criadoEm', 'auth_provider'],
      order: { criadoEm: 'DESC' },
    });
    return usuarios;
  }

  static async getAllEventos(): Promise<Grupo[]> {
    const eventos = await this.grupoRepository.find({
      relations: ['usuario'],
      order: { criadoEm: 'DESC' },
    });
    return eventos;
  }
}

