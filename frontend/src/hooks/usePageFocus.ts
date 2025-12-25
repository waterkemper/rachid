import { useEffect, useCallback } from 'react';

/**
 * Hook para recarregar dados quando a página voltar ao foco
 * Útil quando o usuário navega usando botão voltar do navegador
 * 
 * @param reloadFunction Função a ser chamada quando a página voltar ao foco
 * @param dependencies Dependências do useCallback (array de dependências)
 */
export function usePageFocus(reloadFunction: () => void | Promise<void>, dependencies: React.DependencyList = []) {
  const memoizedReload = useCallback(reloadFunction, dependencies);

  useEffect(() => {
    const handleFocus = () => {
      // Quando a janela voltar ao foco e estiver visível, recarregar dados
      if (document.visibilityState === 'visible') {
        memoizedReload();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [memoizedReload]);
}

