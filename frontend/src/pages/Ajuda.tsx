import React from 'react';
import { FaQuestionCircle, FaUsers, FaCalendarAlt, FaDollarSign, FaChartBar, FaLightbulb, FaInfoCircle, FaCheckCircle, FaWhatsapp, FaLayerGroup, FaShare } from 'react-icons/fa';
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
            <FaLayerGroup className="ajuda-section-icon" />
            <h2 className="ajuda-section-title">2.5. Criar Subgrupos (Opcional)</h2>
          </div>
          <div className="ajuda-divider"></div>
          <div className="ajuda-list">
            <div className="ajuda-list-item">
              <FaLayerGroup className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">O que são Subgrupos?</h3>
                <p className="ajuda-list-description">
                  Subgrupos (também chamados de "famílias" ou "grupos") são uma forma de agrupar participantes que pagam juntos. Quando você cria subgrupos, o sistema calcula os saldos entre os grupos, não entre indivíduos.
                </p>
              </div>
            </div>
            <div className="ajuda-list-item">
              <FaInfoCircle className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Quando usar Subgrupos?</h3>
                <p className="ajuda-list-description">
                  Use subgrupos quando pessoas pagam em conjunto, como:<br />
                  • Famílias (pais e filhos)<br />
                  • Casais<br />
                  • Times ou grupos de amigos que dividem tudo juntos<br />
                  • Qualquer situação onde um grupo paga como uma unidade
                </p>
              </div>
            </div>
            <div className="ajuda-list-item">
              <FaUsers className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Como Criar um Subgrupo</h3>
                <p className="ajuda-list-description">
                  1. Na página de adicionar participantes ao evento, clique em "Criar sub grupo"<br />
                  2. Dê um nome ao subgrupo (ex: "Família Silva", "Casal João e Maria")<br />
                  3. Selecione os participantes que fazem parte deste subgrupo<br />
                  4. Salve o subgrupo<br />
                  <strong>Importante:</strong> Cada participante só pode estar em um subgrupo por evento.
                </p>
              </div>
            </div>
            <div className="ajuda-list-item">
              <FaLightbulb className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Como Funciona o Cálculo com Subgrupos</h3>
                <p className="ajuda-list-description">
                  <strong>Sem subgrupos:</strong> Se João pagou R$ 100 e todos devem pagar, cada pessoa (João, Maria, Pedro) deve R$ 33,33.<br />
                  <strong>Com subgrupos:</strong> Se "Família Silva" (João + Maria) pagou R$ 100 e todos os subgrupos devem pagar, cada família deve R$ 33,33. O sistema não calcula entre João e Maria individualmente.
                </p>
              </div>
            </div>
            <div className="ajuda-list-item">
              <FaInfoCircle className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Misturando Subgrupos e Indivíduos</h3>
                <p className="ajuda-list-description">
                  Você pode ter subgrupos e participantes individuais no mesmo evento. O sistema calculará:<br />
                  • Saldos entre subgrupos<br />
                  • Saldos entre participantes individuais<br />
                  • Saldos entre subgrupos e participantes individuais<br />
                  Tudo será organizado de forma clara na página de Participações.
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
            <h2 className="ajuda-section-title">4. Verificar Resultados e Compartilhar</h2>
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
              <FaWhatsapp className="ajuda-list-icon" style={{ color: '#25D366' }} />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Compartilhar via WhatsApp</h3>
                <p className="ajuda-list-description">
                  Na página Participações, clique no botão "Compartilhar no WhatsApp" para gerar uma mensagem completa com:<br />
                  • Resumo do evento<br />
                  • Saldos de cada participante ou subgrupo<br />
                  • Sugestões otimizadas de pagamento<br />
                  • Chaves PIX dos participantes<br />
                  • Link para visualizar o evento online (sem precisar criar conta)
                </p>
              </div>
            </div>
            <div className="ajuda-list-item">
              <FaShare className="ajuda-list-icon" />
              <div className="ajuda-list-content">
                <h3 className="ajuda-list-title">Link de Compartilhamento</h3>
                <p className="ajuda-list-description">
                  Cada evento possui um link único de compartilhamento. Ao compartilhar via WhatsApp, o link é automaticamente incluído na mensagem. Qualquer pessoa pode acessar o link para visualizar o resumo do evento, saldos e sugestões de pagamento sem precisar criar uma conta ou fazer login.
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
            <div className="ajuda-tip-item">
              <FaCheckCircle className="ajuda-tip-icon" />
              <p className="ajuda-tip-text">
                Use subgrupos quando pessoas pagam juntas (famílias, casais). Isso simplifica os acertos, pois o sistema calcula entre grupos, não entre indivíduos
              </p>
            </div>
            <div className="ajuda-tip-item">
              <FaCheckCircle className="ajuda-tip-icon" />
              <p className="ajuda-tip-text">
                Cada participante só pode estar em um subgrupo por evento. Você pode criar, editar ou excluir subgrupos a qualquer momento
              </p>
            </div>
            <div className="ajuda-tip-item">
              <FaCheckCircle className="ajuda-tip-icon" />
              <p className="ajuda-tip-text">
                Ao compartilhar via WhatsApp, o link gerado permite que qualquer pessoa visualize o evento sem criar conta, facilitando o compartilhamento com participantes
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
            <h3 className="ajuda-example-title">Exemplo 1: Churrasco com Amigos (sem subgrupos)</h3>
            <p className="ajuda-example-text">
              1. Crie o evento "Churrasco Domingo"<br />
              2. Adicione os 4 amigos como participantes ao evento<br />
              3. Registre as despesas: João pagou R$ 100 de carne, Maria R$ 40 de bebida<br />
              4. Marque que todos devem pagar cada despesa (ou ajuste conforme necessário)<br />
              5. Acesse Participações para ver os resultados: João deve receber R$ 65, e cada um deve pagar R$ 35<br />
              6. Clique em "Compartilhar no WhatsApp" para enviar o resumo completo com link de visualização
            </p>
          </div>
          <div className="ajuda-example-box" style={{ marginTop: '20px' }}>
            <h3 className="ajuda-example-title">Exemplo 2: Viagem em Família (com subgrupos)</h3>
            <p className="ajuda-example-text">
              1. Crie o evento "Viagem ao Rio - Janeiro 2024"<br />
              2. Adicione os participantes: João, Maria, Pedro, Ana, Carlos, Sofia<br />
              3. <strong>Crie subgrupos:</strong><br />
              &nbsp;&nbsp;&nbsp;• "Família Silva" → adicione João e Maria<br />
              &nbsp;&nbsp;&nbsp;• "Família Santos" → adicione Pedro e Ana<br />
              &nbsp;&nbsp;&nbsp;• "Família Costa" → adicione Carlos e Sofia<br />
              4. Registre as despesas: Família Silva pagou R$ 500 de hotel, Família Santos R$ 300 de alimentação, Família Costa R$ 200 de transporte<br />
              5. Marque que todos os subgrupos devem pagar cada despesa<br />
              6. Acesse Participações: o sistema calculará os saldos entre as famílias, não entre indivíduos<br />
              7. Compartilhe via WhatsApp: a mensagem mostrará os saldos por família e o link para visualização
            </p>
          </div>
          <div className="ajuda-example-box" style={{ marginTop: '20px' }}>
            <h3 className="ajuda-example-title">Exemplo 3: Evento com Subgrupos e Indivíduos</h3>
            <p className="ajuda-example-text">
              Você pode misturar subgrupos e participantes individuais no mesmo evento:<br />
              • Crie "Família Silva" (João + Maria) e "Família Santos" (Pedro + Ana)<br />
              • Adicione também Carlos e Sofia como participantes individuais (sem subgrupo)<br />
              • O sistema calculará: saldos entre famílias, saldos entre indivíduos, e saldos entre famílias e indivíduos<br />
              • Ao compartilhar, a mensagem mostrará todos os saldos organizados de forma clara
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ajuda;

