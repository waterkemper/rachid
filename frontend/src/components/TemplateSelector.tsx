import React from 'react';
import { EventTemplate } from '../types';
import './TemplateSelector.css';

interface TemplateSelectorProps {
  templates: EventTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string | null) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
}) => {
  const getTemplateIcon = (templateId: string): string => {
    const icons: Record<string, string> = {
      churrasco: '🔥',
      viagem: '✈️',
      escola: '📚',
      time: '⚽',
    };
    return icons[templateId] || '📋';
  };

  return (
    <div className="template-selector">
      <div className="template-selector-header">
        <h2>Escolha um template</h2>
        <p className="template-selector-subtitle">
          Templates aceleram a criação com despesas sugeridas prontas para usar
        </p>
      </div>

      <div className="template-grid">
        <div
          className={`template-card ${selectedTemplateId === null ? 'selected' : ''}`}
          onClick={() => onSelectTemplate(null)}
        >
          <div className="template-icon">➕</div>
          <div className="template-name">Criar do zero</div>
          <div className="template-description">Começar sem sugestões</div>
        </div>

        {templates.map((template) => (
          <div
            key={template.id}
            className={`template-card ${selectedTemplateId === template.id ? 'selected' : ''}`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <div className="template-icon">{getTemplateIcon(template.id)}</div>
            <div className="template-name">{template.nome}</div>
            <div className="template-description">{template.descricao}</div>
            <div className="template-expenses-preview">
              <div className="template-expenses-label">Despesas sugeridas:</div>
              <div className="template-expenses-list">
                {template.despesas.slice(0, 3).map((despesa, idx) => (
                  <span key={idx} className="template-expense-tag">
                    {despesa}
                  </span>
                ))}
                {template.despesas.length > 3 && (
                  <span className="template-expense-tag">+{template.despesas.length - 3}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;

