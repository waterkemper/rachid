import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaShieldAlt, FaDatabase, FaUserShield, FaLock, FaEnvelope, FaTrash } from 'react-icons/fa';
import './PrivacyPolicy.css';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="privacy-container">
      <div className="privacy-content">
        <button 
          className="privacy-back-button"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Voltar
        </button>

        <div className="privacy-card privacy-header-card">
          <div className="privacy-header">
            <FaShieldAlt className="privacy-icon-large" />
            <h1 className="privacy-title">Politica de Privacidade</h1>
            <p className="privacy-subtitle">
              Ultima atualizacao: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="privacy-card">
          <div className="privacy-section-header">
            <FaShieldAlt className="privacy-section-icon" />
            <h2 className="privacy-section-title">1. Introducao</h2>
          </div>
          <div className="privacy-divider"></div>
          <p className="privacy-text">
            O Rachid ("nos", "nosso" ou "aplicativo") respeita sua privacidade e esta comprometido 
            em proteger seus dados pessoais. Esta Politica de Privacidade explica como coletamos, 
            usamos, armazenamos e protegemos suas informacoes quando voce utiliza nosso servico 
            de divisao de despesas.
          </p>
          <p className="privacy-text">
            Ao usar o Rachid, voce concorda com a coleta e uso de informacoes de acordo com esta politica.
          </p>
        </div>

        <div className="privacy-card">
          <div className="privacy-section-header">
            <FaDatabase className="privacy-section-icon" />
            <h2 className="privacy-section-title">2. Dados que Coletamos</h2>
          </div>
          <div className="privacy-divider"></div>
          <h3 className="privacy-subtitle-section">2.1 Informacoes fornecidas por voce:</h3>
          <ul className="privacy-list">
            <li>Nome e endereco de e-mail (para criacao de conta)</li>
            <li>Numero de telefone e DDD (opcional)</li>
            <li>Chave PIX (opcional, para facilitar pagamentos)</li>
            <li>Informacoes de eventos e despesas que voce cria</li>
            <li>Nomes e dados de participantes que voce cadastra</li>
          </ul>
          <h3 className="privacy-subtitle-section">2.2 Informacoes coletadas automaticamente:</h3>
          <ul className="privacy-list">
            <li>Dados de uso do aplicativo</li>
            <li>Informacoes do dispositivo (tipo, sistema operacional)</li>
            <li>Endereco IP e dados de conexao</li>
          </ul>
        </div>

        <div className="privacy-card">
          <div className="privacy-section-header">
            <FaUserShield className="privacy-section-icon" />
            <h2 className="privacy-section-title">3. Como Usamos seus Dados</h2>
          </div>
          <div className="privacy-divider"></div>
          <p className="privacy-text">Utilizamos seus dados para:</p>
          <ul className="privacy-list">
            <li>Fornecer e manter o servico de divisao de despesas</li>
            <li>Processar e gerenciar suas assinaturas e pagamentos</li>
            <li>Enviar notificacoes importantes sobre sua conta</li>
            <li>Permitir o compartilhamento de eventos com outros participantes</li>
            <li>Melhorar nosso servico e desenvolver novos recursos</li>
            <li>Prevenir fraudes e garantir a seguranca do servico</li>
          </ul>
        </div>

        <div className="privacy-card">
          <div className="privacy-section-header">
            <FaLock className="privacy-section-icon" />
            <h2 className="privacy-section-title">4. Protecao dos Dados</h2>
          </div>
          <div className="privacy-divider"></div>
          <p className="privacy-text">
            Implementamos medidas de seguranca tecnicas e organizacionais para proteger seus dados:
          </p>
          <ul className="privacy-list">
            <li>Criptografia de dados em transito (HTTPS/TLS)</li>
            <li>Armazenamento seguro em servidores protegidos</li>
            <li>Acesso restrito aos dados por pessoal autorizado</li>
            <li>Autenticacao segura com tokens JWT</li>
            <li>Monitoramento continuo de seguranca</li>
          </ul>
        </div>

        <div className="privacy-card">
          <div className="privacy-section-header">
            <FaDatabase className="privacy-section-icon" />
            <h2 className="privacy-section-title">5. Compartilhamento de Dados</h2>
          </div>
          <div className="privacy-divider"></div>
          <p className="privacy-text">
            Nao vendemos seus dados pessoais. Podemos compartilhar informacoes com:
          </p>
          <ul className="privacy-list">
            <li><strong>Provedores de pagamento:</strong> Asaas e PayPal para processar pagamentos de assinaturas</li>
            <li><strong>Provedores de servicos:</strong> Amazon AWS para hospedagem e armazenamento</li>
            <li><strong>Participantes de eventos:</strong> Quando voce compartilha um evento, os participantes podem ver as despesas e saldos</li>
            <li><strong>Autoridades legais:</strong> Quando exigido por lei ou ordem judicial</li>
          </ul>
        </div>

        <div className="privacy-card">
          <div className="privacy-section-header">
            <FaUserShield className="privacy-section-icon" />
            <h2 className="privacy-section-title">6. Seus Direitos (LGPD)</h2>
          </div>
          <div className="privacy-divider"></div>
          <p className="privacy-text">
            De acordo com a Lei Geral de Protecao de Dados (LGPD), voce tem direito a:
          </p>
          <ul className="privacy-list">
            <li><strong>Acesso:</strong> Solicitar uma copia dos seus dados pessoais</li>
            <li><strong>Correcao:</strong> Corrigir dados incompletos ou desatualizados</li>
            <li><strong>Exclusao:</strong> Solicitar a exclusao dos seus dados e conta</li>
            <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
            <li><strong>Revogacao:</strong> Retirar seu consentimento a qualquer momento</li>
            <li><strong>Informacao:</strong> Saber com quem seus dados foram compartilhados</li>
          </ul>
        </div>

        <div className="privacy-card">
          <div className="privacy-section-header">
            <FaTrash className="privacy-section-icon" />
            <h2 className="privacy-section-title">7. Retencao e Exclusao de Dados</h2>
          </div>
          <div className="privacy-divider"></div>
          <p className="privacy-text">
            Mantemos seus dados enquanto sua conta estiver ativa. Voce pode solicitar a exclusao 
            da sua conta a qualquer momento atraves das configuracoes do aplicativo ou entrando 
            em contato conosco.
          </p>
          <p className="privacy-text">
            Apos a exclusao, seus dados serao removidos em ate 30 dias, exceto quando necessario 
            manter por obrigacoes legais ou para exercicio de direitos em processos judiciais.
          </p>
        </div>

        <div className="privacy-card">
          <div className="privacy-section-header">
            <FaEnvelope className="privacy-section-icon" />
            <h2 className="privacy-section-title">8. Contato</h2>
          </div>
          <div className="privacy-divider"></div>
          <p className="privacy-text">
            Para exercer seus direitos ou esclarecer duvidas sobre esta politica, entre em contato:
          </p>
          <p className="privacy-text">
            <strong>E-mail:</strong> suporte@rachid.app<br />
            <strong>Assunto:</strong> Privacidade - [Sua solicitacao]
          </p>
        </div>

        <div className="privacy-card">
          <div className="privacy-section-header">
            <FaShieldAlt className="privacy-section-icon" />
            <h2 className="privacy-section-title">9. Alteracoes nesta Politica</h2>
          </div>
          <div className="privacy-divider"></div>
          <p className="privacy-text">
            Podemos atualizar esta Politica de Privacidade periodicamente. Notificaremos sobre 
            mudancas significativas por e-mail ou atraves do aplicativo. Recomendamos revisar 
            esta politica regularmente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
