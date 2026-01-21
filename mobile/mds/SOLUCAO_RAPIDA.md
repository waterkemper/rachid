# Solução Rápida - Erro de Incompatibilidade SDK

## Problema
Expo Go instalado é SDK 54, mas o projeto usa SDK 50.

## Soluções Rápidas

### ✅ Solução 1: Usar Simulador/Emulador (Mais Rápido)

#### Para iOS (macOS):
```bash
cd mobile
npm run ios
```

#### Para Android:
```bash
cd mobile
npm run android
```
(Certifique-se de que o emulador Android está rodando primeiro)

---

### ✅ Solução 2: Atualizar Projeto para SDK 54

**⚠️ ATENÇÃO**: Isso pode quebrar coisas. Faça backup primeiro!

```bash
cd mobile

# 1. Atualizar Expo
npx expo install expo@latest

# 2. Atualizar dependências
npx expo install --fix

# 3. Testar
npm start
```

**Prós**: Funciona com Expo Go no iOS
**Contras**: Pode precisar ajustar código para novas APIs

---

### ✅ Solução 3: Usar Android (Mais Flexível)

O Expo Go no Android geralmente é mais flexível com versões diferentes do SDK:

1. Instale Expo Go no Android
2. Execute `npm start`
3. Escaneie o QR code

Se funcionar no Android mas não no iOS, é porque iOS é mais restritivo.

---

## Recomendação

Para começar a testar rapidamente:
- **Se você tem macOS**: Use `npm run ios` (simulador)
- **Se você tem Android Studio**: Use `npm run android` (emulador)
- **Se quer usar dispositivo físico**: Atualize para SDK 54 (Solução 2)

