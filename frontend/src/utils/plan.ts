import { Usuario } from '../types';

export function isPro(usuario: Usuario | null | undefined): boolean {
  if (!usuario) return false;
  if (usuario.plano !== 'PRO') return false;
  if (!usuario.planoValidoAte) return true;
  return new Date(usuario.planoValidoAte).getTime() > Date.now();
}

