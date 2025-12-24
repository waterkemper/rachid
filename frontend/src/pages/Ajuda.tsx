import React from 'react';
import { FaQuestionCircle, FaUsers, FaCalendarAlt, FaDollarSign, FaChartBar, FaLightbulb, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import './Ajuda.css';

const Ajuda: React.FC = () => {
  return (
    <div className="ajuda-container">
      <div className="ajuda-content">
        <div className="ajuda-card ajuda-header-card">
          <div className="ajuda-header">
            <FaQuestionCircle className="ajuda-icon-large" />
            <h1 className="ajuda-title">Guia de Uso</h1>
            <p className="ajuda-subtitle">
              Aprenda a usar o Rachid para dividir despesas de forma simples e eficiente
            </p>
          </div>
        </div>

        <div className="ajuda-card">
          <div className="ajuda-section-header">
            <FaCalendarAlt className="ajuda-section-icon" />
            <h2 className="ajuda-section-title">1. Cadastrar Evento</h2>
          </div>
          <div className="ajuda-divider"></div>
          <div className="ajuda-list">
            <div className="ajuda-list-item">
              <FaCalendarAlt className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Novo Evento</h3>
                <p className="ajuda-list-description">
                  Comece criando um evento para organizar suas despesas (ex: Viagem ao Rio, Churrasco de domingo, etc.). Informe o nome e a data do evento.
                </p>
              </div>
            </div>
            <div className="ajuda-list-item">
              <FaInfoCircle className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Editar Eventos</h3>
                <p className="ajuda-list-description">
                  Clique em um evento para editar seu nome ou data.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="ajuda-card">
          <div className="ajuda-section-header">
            <FaUsers className="ajuda-section-icon" />
            <h2 className="ajuda-section-title">2. Cadastrar Participantes</h2>
          </div>
          <div className="ajuda-divider"></div>
          <div className="ajuda-list">
            <div className="ajuda-list-item">
              <FaUsers className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Adicionar Participantes ao Evento</h3>
                <p className="ajuda-list-description">
                  Após criar o evento, adicione os participantes que estão envolvidos nele. Você pode adicionar pessoas já cadastradas ou criar novas.
                </p>
              </div>
            </div>
            <div className="ajuda-list-item">
              <FaUsers className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Cadastrar Novo Participante</h3>
                <p className="ajuda-list-description">
                  Se a pessoa ainda não está cadastrada, você pode criar um novo participante diretamente ao adicionar ao evento. Inclua nome, email e chave PIX para facilitar os reembolsos.
                </p>
              </div>
            </div>
            <div className="ajuda-list-item">
              <FaUsers className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Gerenciar Participantes</h3>
                <p className="ajuda-list-description">
                  Na página de Participantes, você pode cadastrar pessoas que serão reutilizadas em vários eventos. Inclua nome, email, telefone e chave PIX.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="ajuda-card">
          <div className="ajuda-section-header">
            <FaDollarSign className="ajuda-section-icon" />
            <h2 className="ajuda-section-title">3. Registrar Despesas</h2>
          </div>
          <div className="ajuda-divider"></div>
          <div className="ajuda-list">
            <div className="ajuda-list-item">
              <FaDollarSign className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Adicionar Despesa</h3>
                <p className="ajuda-list-description">
                  Na página Despesas, clique no botão + para adicionar uma nova despesa. Informe o evento, valor, descrição e quem pagou.
                </p>
              </div>
            </div>
            <div className="ajuda-list-item">
              <FaUsers className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Dividir Entre Participantes</h3>
                <p className="ajuda-list-description">
                  Escolha quem deve pagar a despesa. Por padrão, todos os participantes do evento são marcados. Desmarque quem não deve pagar.
                </p>
              </div>
            </div>
            <div className="ajuda-list-item">
              <FaInfoCircle className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Editar ou Excluir</h3>
                <p className="ajuda-list-description">
                  Clique em uma despesa para editar ou excluir se houver algum erro.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="ajuda-card">
          <div className="ajuda-section-header">
            <FaChartBar className="ajuda-section-icon" />
            <h2 className="ajuda-section-title">4. Verificar Resultados</h2>
          </div>
          <div className="ajuda-divider"></div>
          <div className="ajuda-list">
            <div className="ajuda-list-item">
              <FaChartBar className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Ver Relatório do Evento</h3>
                <p className="ajuda-list-description">
                  Acesse a página Participações para ver o resumo financeiro. Veja os saldos de cada participante, quem deve pagar e quem deve receber.
                </p>
              </div>
            </div>
            <div className="ajuda-list-item">
              <FaLightbulb className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Sugestões de Pagamento</h3>
                <p className="ajuda-list-description">
                  O sistema calcula automaticamente as melhores formas de quitar os débitos entre os participantes, otimizando os pagamentos.
                </p>
              </div>
            </div>
            <div className="ajuda-list-item">
              <FaInfoCircle className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Compartilhar</h3>
                <p className="ajuda-list-description">
                  Compartilhe o relatório com os participantes via WhatsApp. O link inclui todas as informações de saldos, sugestões de pagamento e chaves PIX.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="ajuda-card">
          <div className="ajuda-section-header">
            <FaLightbulb className="ajuda-section-icon ajuda-warning" />
            <h2 className="ajuda-section-title">Dicas Importantes</h2>
          </div>
          <div className="ajuda-divider"></div>
          <div className="ajuda-tips">
            <div className="ajuda-tip-item">
              <FaCheckCircle className="ajuda-tip-icon" />
              <p className="ajuda-tip-text">
                Siga o fluxo: primeiro crie o evento, depois adicione os participantes, registre as despesas e por fim verifique os resultados
              </p>
            </div>
            <div className="ajuda-tip-item">
              <FaCheckCircle className="ajuda-tip-icon" />
              <p className="ajuda-tip-text">
                Sempre adicione a chave PIX dos participantes para facilitar reembolsos
              </p>
            </div>
            <div className="ajuda-tip-item">
              <FaCheckCircle className="ajuda-tip-icon" />
              <p className="ajuda-tip-text">
                Registre as despesas assim que ocorrerem para não esquecer
              </p>
            </div>
            <div className="ajuda-tip-item">
              <FaCheckCircle className="ajuda-tip-icon" />
              <p className="ajuda-tip-text">
                Use eventos diferentes para separar grupos de despesas (ex: Viagem vs Churrasco)
              </p>
            </div>
            <div className="ajuda-tip-item">
              <FaCheckCircle className="ajuda-tip-icon" />
              <p className="ajuda-tip-text">
                A página Participações mostra automaticamente quem deve pagar ou receber valores, com sugestões otimizadas de pagamento
              </p>
            </div>
          </div>
        </div>

        <div className="ajuda-card">
          <div className="ajuda-section-header">
            <FaInfoCircle className="ajuda-section-icon ajuda-secondary" />
            <h2 className="ajuda-section-title">Exemplo Prático</h2>
          </div>
          <div className="ajuda-divider"></div>
          <div className="ajuda-example-box">
            <h3 className="ajuda-example-title">Churrasco com Amigos</h3>
            <p className="ajuda-example-text">
              1. Crie o evento "Churrasco Domingo"<br />
              2. Adicione os 4 amigos como participantes ao evento<br />
              3. Registre as despesas: João pagou R$ 100 de carne, Maria R$ 40 de bebida<br />
              4. Marque que todos devem pagar cada despesa (ou ajuste conforme necessário)<br />
              5. Acesse Participações para ver os resultados: João deve receber R$ 65, e cada um deve pagar R$ 35<br />
              6. Compartilhe o relatório via WhatsApp com todos os participantes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ajuda;

