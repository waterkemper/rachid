import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaFileContract, FaUserCheck, FaCreditCard, FaBan, FaBalanceScale, FaEnvelope } from 'react-icons/fa';
import './TermsOfService.css';

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="terms-container">
      <div className="terms-content">
        <button 
          className="terms-back-button"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Voltar
        </button>

        <div className="terms-card terms-header-card">
          <div className="terms-header">
            <FaFileContract className="terms-icon-large" />
            <h1 className="terms-title">Termos de Uso</h1>
            <p className="terms-subtitle">
              Ultima atualizacao: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="terms-card">
          <div className="terms-section-header">
            <FaFileContract className="terms-section-icon" />
            <h2 className="terms-section-title">1. Aceitacao dos Termos</h2>
          </div>
          <div className="terms-divider"></div>
          <p className="terms-text">
            Ao acessar ou usar o Rachid ("Servico"), voce concorda em estar vinculado a estes 
            Termos de Uso. Se voce nao concordar com qualquer parte destes termos, nao podera 
            acessar o Servico.
          </p>
          <p className="terms-text">
            O Rachid e um aplicativo de divisao de despesas que permite aos usuarios criar eventos, 
            registrar despesas e calcular automaticamente os valores devidos entre participantes.
          </p>
        </div>

        <div className="terms-card">
          <div className="terms-section-header">
            <FaUserCheck className="terms-section-icon" />
            <h2 className="terms-section-title">2. Conta do Usuario</h2>
          </div>
          <div className="terms-divider"></div>
          <h3 className="terms-subtitle-section">2.1 Cadastro</h3>
          <p className="terms-text">
            Para usar o Servico, voce deve criar uma conta fornecendo informacoes verdadeiras e 
            atualizadas. Voce e responsavel por manter a confidencialidade da sua conta e senha.
          </p>
          <h3 className="terms-subtitle-section">2.2 Responsabilidades</h3>
          <ul className="terms-list">
            <li>Manter suas credenciais de acesso seguras</li>
            <li>Notificar imediatamente sobre uso nao autorizado da sua conta</li>
            <li>Ser responsavel por todas as atividades realizadas em sua conta</li>
            <li>Fornecer informacoes precisas sobre participantes e despesas</li>
          </ul>
          <h3 className="terms-subtitle-section">2.3 Idade Minima</h3>
          <p className="terms-text">
            Voce deve ter pelo menos 18 anos para usar o Servico. Se for menor de idade, deve ter 
            autorizacao de um responsavel legal.
          </p>
        </div>

        <div className="terms-card">
          <div className="terms-section-header">
            <FaCreditCard className="terms-section-icon" />
            <h2 className="terms-section-title">3. Planos e Pagamentos</h2>
          </div>
          <div className="terms-divider"></div>
          <h3 className="terms-subtitle-section">3.1 Plano Gratuito</h3>
          <p className="terms-text">
            O Rachid oferece um plano gratuito com recursos limitados. Os limites sao definidos 
            e podem ser alterados a nosso criterio.
          </p>
          <h3 className="terms-subtitle-section">3.2 Plano PRO</h3>
          <p className="terms-text">
            O plano PRO oferece recursos adicionais mediante pagamento. Os precos e recursos 
            estao disponiveis na pagina de planos.
          </p>
          <h3 className="terms-subtitle-section">3.3 Pagamentos e Cancelamentos</h3>
          <ul className="terms-list">
            <li>Os pagamentos sao processados por parceiros (Asaas, PayPal)</li>
            <li>Assinaturas mensais e anuais sao renovadas automaticamente</li>
            <li>Voce pode cancelar a qualquer momento; o acesso continua ate o fim do periodo pago</li>
            <li>Nao oferecemos reembolsos por periodos parciais de uso</li>
            <li>O plano vitalicio e um pagamento unico sem renovacao</li>
          </ul>
        </div>

        <div className="terms-card">
          <div className="terms-section-header">
            <FaBan className="terms-section-icon" />
            <h2 className="terms-section-title">4. Uso Aceitavel</h2>
          </div>
          <div className="terms-divider"></div>
          <p className="terms-text">Ao usar o Servico, voce concorda em NAO:</p>
          <ul className="terms-list">
            <li>Usar o Servico para fins ilegais ou nao autorizados</li>
            <li>Tentar acessar contas de outros usuarios sem autorizacao</li>
            <li>Transmitir virus, malware ou codigo malicioso</li>
            <li>Sobrecarregar ou interferir com a infraestrutura do Servico</li>
            <li>Coletar dados de outros usuarios sem consentimento</li>
            <li>Usar o Servico para atividades fraudulentas</li>
            <li>Violar direitos de propriedade intelectual</li>
            <li>Criar multiplas contas para burlar limites do plano gratuito</li>
          </ul>
        </div>

        <div className="terms-card">
          <div className="terms-section-header">
            <FaBalanceScale className="terms-section-icon" />
            <h2 className="terms-section-title">5. Limitacao de Responsabilidade</h2>
          </div>
          <div className="terms-divider"></div>
          <p className="terms-text">
            O Rachid e fornecido "como esta", sem garantias de qualquer tipo. Nos nao garantimos que:
          </p>
          <ul className="terms-list">
            <li>O Servico sera ininterrupto ou livre de erros</li>
            <li>Os calculos de divisao refletem acordos entre participantes</li>
            <li>Os dados estarao sempre disponiveis ou nao serao perdidos</li>
          </ul>
          <p className="terms-text">
            <strong>Importante:</strong> O Rachid e uma ferramenta de calculo e organizacao. 
            A responsabilidade pelos pagamentos reais entre participantes e exclusivamente dos usuarios. 
            Nao somos responsaveis por disputas, inadimplencias ou problemas entre participantes.
          </p>
        </div>

        <div className="terms-card">
          <div className="terms-section-header">
            <FaFileContract className="terms-section-icon" />
            <h2 className="terms-section-title">6. Propriedade Intelectual</h2>
          </div>
          <div className="terms-divider"></div>
          <p className="terms-text">
            O Servico, incluindo seu design, codigo, logos e conteudo, sao propriedade do Rachid 
            e protegidos por leis de propriedade intelectual.
          </p>
          <p className="terms-text">
            Voce mantem a propriedade dos dados que insere no Servico (eventos, despesas, 
            informacoes de participantes).
          </p>
        </div>

        <div className="terms-card">
          <div className="terms-section-header">
            <FaBan className="terms-section-icon" />
            <h2 className="terms-section-title">7. Encerramento</h2>
          </div>
          <div className="terms-divider"></div>
          <p className="terms-text">
            Podemos suspender ou encerrar sua conta se voce violar estes Termos de Uso. 
            Voce tambem pode encerrar sua conta a qualquer momento atraves das configuracoes 
            ou entrando em contato conosco.
          </p>
          <p className="terms-text">
            Apos o encerramento, seus dados serao tratados conforme nossa Politica de Privacidade.
          </p>
        </div>

        <div className="terms-card">
          <div className="terms-section-header">
            <FaBalanceScale className="terms-section-icon" />
            <h2 className="terms-section-title">8. Lei Aplicavel</h2>
          </div>
          <div className="terms-divider"></div>
          <p className="terms-text">
            Estes Termos sao regidos pelas leis da Republica Federativa do Brasil. Qualquer 
            disputa sera submetida ao foro da comarca de domicilio do usuario, conforme o 
            Codigo de Defesa do Consumidor.
          </p>
        </div>

        <div className="terms-card">
          <div className="terms-section-header">
            <FaFileContract className="terms-section-icon" />
            <h2 className="terms-section-title">9. Alteracoes nos Termos</h2>
          </div>
          <div className="terms-divider"></div>
          <p className="terms-text">
            Podemos atualizar estes Termos periodicamente. Mudancas significativas serao 
            comunicadas por e-mail ou atraves do aplicativo. O uso continuado do Servico 
            apos alteracoes constitui aceitacao dos novos termos.
          </p>
        </div>

        <div className="terms-card">
          <div className="terms-section-header">
            <FaEnvelope className="terms-section-icon" />
            <h2 className="terms-section-title">10. Contato</h2>
          </div>
          <div className="terms-divider"></div>
          <p className="terms-text">
            Para duvidas sobre estes Termos de Uso, entre em contato:
          </p>
          <p className="terms-text">
            <strong>E-mail:</strong> suporte@rachid.app<br />
            <strong>Assunto:</strong> Termos de Uso - [Sua duvida]
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
