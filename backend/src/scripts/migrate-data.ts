import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../database/data-source';
import { Usuario } from '../entities/Usuario';
import { Participante } from '../entities/Participante';
import { Grupo } from '../entities/Grupo';
import { Despesa } from '../entities/Despesa';
import bcrypt from 'bcrypt';

async function migrateData() {
  try {
    console.log('Iniciando migração de dados...');
    
    await AppDataSource.initialize();
    console.log('Conexão com banco de dados estabelecida');

    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const participanteRepository = AppDataSource.getRepository(Participante);
    const grupoRepository = AppDataSource.getRepository(Grupo);
    const despesaRepository = AppDataSource.getRepository(Despesa);

    // Verificar se já existe um usuário admin
    let adminUsuario = await usuarioRepository.findOne({ where: { email: 'admin@admin.com' } });

    if (!adminUsuario) {
      console.log('Criando usuário admin...');
      const senhaHash = await bcrypt.hash('admin123', 10);
      adminUsuario = usuarioRepository.create({
        email: 'admin@admin.com',
        senha: senhaHash,
        nome: 'Administrador',
      });
      adminUsuario = await usuarioRepository.save(adminUsuario);
      console.log('Usuário admin criado com sucesso');
      console.log('Email: admin@admin.com');
      console.log('Senha: admin123');
    } else {
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
  } catch (error) {
    console.error('Erro durante a migração:', error);
    process.exit(1);
  }
}

migrateData();

