export interface EventTemplate {
  id: string;
  nome: string;
  descricao: string;
  despesas: string[];
}

export class TemplateService {
  private static templates: EventTemplate[] = [
    {
      id: 'churrasco',
      nome: 'Churrasco',
      descricao: 'Divisão de despesas do churrasco',
      despesas: ['Carne', 'Bebidas', 'Carvão', 'Gelo','Aluguel do Salão'],
    },
    {
      id: 'viagem',
      nome: 'Viagem',
      descricao: 'Divisão de despesas da viagem',
      despesas: ['Hospedagem', 'Combustível', 'Alimentação', 'Pedágio','Aluguel de Carro'],
    },
    {
      id: 'escola',
      nome: 'Escola',
      descricao: 'Divisão de despesas escolares',
      despesas: ['Lanche', 'Material', 'Transporte','Uniforme'],
    },
    {
      id: 'time',
      nome: 'Time',
      descricao: 'Divisão de despesas do time',
      despesas: ['Aluguel da quadra', 'Água', 'Bola / Material'],
    },
  ];

  static getAll(): EventTemplate[] {
    return this.templates;
  }

  static getById(id: string): EventTemplate | null {
    return this.templates.find(t => t.id === id) || null;
  }
}

