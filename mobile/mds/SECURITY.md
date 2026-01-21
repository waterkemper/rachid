# Segurança - Vulnerabilidades Conhecidas

## Status das Vulnerabilidades

**Última atualização**: React Native atualizado para 0.73.6 via `npx expo install --fix`

**Vulnerabilidades atuais**: 6 (2 low, 4 high) - todas em dependências de desenvolvimento/build

O `npm audit` pode reportar algumas vulnerabilidades relacionadas a dependências transitivas. A maioria delas não afeta a segurança da aplicação em produção porque são usadas apenas durante o desenvolvimento e build.

## Vulnerabilidades Reportadas

### 1. `ip` - SSRF Vulnerability (Alta Severidade) ✅ RESOLVIDO
- **Pacote**: `ip` (via `react-native`)
- **Impacto**: Usado apenas durante desenvolvimento/build
- **Status**: ✅ Resolvido ao atualizar React Native de 0.73.0 para 0.73.6
- **Ação**: N/A - já resolvido

### 2. `semver` - ReDoS (Alta Severidade) ⚠️ PENDENTE
- **Pacote**: `semver` (via `@expo/cli` → `@expo/image-utils`)
- **Impacto**: Usado apenas durante desenvolvimento/build (gerenciamento de versões)
- **Status**: Vulnerabilidade em dependência transitiva do Expo CLI
- **Ação**: Aguardar atualização do Expo SDK (resolução requer Expo 54+, breaking change)
- **Nota**: Não afeta o app compilado em produção

### 3. `send` - Template Injection XSS (Alta Severidade) ⚠️ PENDENTE
- **Pacote**: `send` (via `@expo/cli`)
- **Impacto**: Usado apenas durante desenvolvimento (servidor local do Expo)
- **Status**: Vulnerabilidade em dependência transitiva do Expo CLI
- **Ação**: Aguardar atualização do Expo SDK (resolução requer Expo 54+, breaking change)
- **Nota**: Não afeta o app compilado em produção

## Recomendações

### Para Desenvolvimento Local
As vulnerabilidades não representam risco significativo durante desenvolvimento local, pois:
- São usadas apenas em ferramentas de build/desenvolvimento
- Não são incluídas no bundle final da aplicação
- O ambiente de desenvolvimento é controlado

### Para Produção
O app compilado não inclui essas dependências vulneráveis. Elas são apenas ferramentas de desenvolvimento.

### Histórico de Atualizações

✅ **React Native atualizado**: 0.73.0 → 0.73.6 (via `npx expo install --fix`)
- Isso resolveu vulnerabilidades do pacote `ip`
- Reduziu vulnerabilidades de 11 para 6

### Atualizações Futuras

Para resolver as vulnerabilidades restantes quando atualizações estiverem disponíveis:

1. **Atualizar Expo SDK** (quando nova versão estável estiver disponível):
   ```bash
   npx expo install --fix
   ```
   ⚠️ **Nota**: Resolver as vulnerabilidades restantes requer Expo 54+, que é uma breaking change

2. **Atualizar pacotes individuais** (se compatível):
   ```bash
   npx expo install [package-name]@latest
   ```

3. **Forçar correção** (⚠️ NÃO RECOMENDADO - pode causar breaking changes):
   ```bash
   npm audit fix --force
   ```
   Isso atualizaria para Expo 54+, que pode quebrar compatibilidade

## Verificação Periódica

Execute periodicamente:
```bash
npm audit
```

Para ver apenas vulnerabilidades que afetam o código em produção:
```bash
npm audit --production
```

## Notas Importantes

- **NÃO execute `npm audit fix --force` sem testar primeiro** - pode atualizar pacotes para versões incompatíveis
- As vulnerabilidades reportadas são em dependências de **desenvolvimento/build**, não no código final
- O app mobile compilado não contém essas vulnerabilidades
- Monitore atualizações do Expo SDK para versões que resolvam essas questões

## Atualização de Versões (Quando Disponível)

Quando novas versões do Expo estiverem disponíveis:

1. Verifique compatibilidade em: https://docs.expo.dev/versions/
2. Atualize seguindo: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/
3. Execute testes completos após atualização

