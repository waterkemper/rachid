# Changelog - App Mobile

## Versão 1.0.0 (Inicial)

### Estrutura Criada

- ✅ Projeto Expo/React Native configurado
- ✅ TypeScript configurado
- ✅ Estrutura de pastas organizada

### Autenticação

- ✅ AuthContext adaptado para mobile (AsyncStorage)
- ✅ Telas de Login e Cadastro
- ✅ Fluxo de autenticação completo

### Navegação

- ✅ React Navigation configurado
- ✅ Stack Navigator para navegação principal
- ✅ Bottom Tab Navigator para acesso rápido
- ✅ Rotas protegidas baseadas em autenticação

### Telas Principais

- ✅ ParticipantesScreen - Gerenciamento de participantes
- ✅ GruposScreen - Lista de eventos
- ✅ DespesasScreen - Lista de despesas
- ✅ RelatorioScreen - Relatórios e saldos
- ✅ ContaScreen - Informações da conta
- ✅ NovoEventoScreen - Criar novo evento
- ✅ AdicionarParticipantesEventoScreen - (placeholder)
- ✅ GruposMaioresScreen - Grupos maiores

### Integração com Backend

- ✅ API client adaptado para mobile (axios + AsyncStorage)
- ✅ Interceptors para autenticação Bearer token
- ✅ Tratamento de erros

### Componentes UI

- ✅ Usando React Native Paper
- ✅ Modal component
- ✅ LoadingScreen component
- ✅ Componentes adaptados para mobile

### Backend

- ✅ CORS atualizado para aceitar requisições mobile
- ✅ AuthController retorna token no body (além do cookie)

### Compartilhamento de Código

- ✅ Pasta `shared/` criada com tipos TypeScript
- ✅ Tipos compartilhados entre web e mobile

## Próximos Passos

- [ ] Implementar funcionalidade completa de AdicionarParticipantesEvento
- [ ] Melhorar UI/UX das telas
- [ ] Adicionar tratamento de erro mais robusto
- [ ] Adicionar loading states em todas as telas
- [ ] Implementar funcionalidades offline (opcional)
- [ ] Adicionar notificações push (opcional)
- [ ] Testes em dispositivos reais
- [ ] Build e publicação nas lojas

