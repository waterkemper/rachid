import { analyticsApi } from './api';

export async function track(event: string, props?: Record<string, any>) {
  try {
    await analyticsApi.track(event, props);
  } catch {
    // Falha silenciosa: analytics nunca pode quebrar o fluxo
  }
}

