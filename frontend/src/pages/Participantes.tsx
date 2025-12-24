import React, { useState, useEffect } from 'react';
import { participanteApi } from '../services/api';
import { Participante } from '../types';
import Modal from '../components/Modal';
import './Participantes.css';

const Participantes: React.FC = () => {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipante, setEditingParticipante] = useState<Participante | null>(null);
  const [formData, setFormData] = useState({ nome: '', email: '', chavePix: '', ddi: '+55', ddd: '', telefone: '' });
  const [tipoPix, setTipoPix] = useState<'email' | 'telefone' | 'outro'>('outro');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadParticipantes();
  }, []);

  const loadParticipantes = async () => {
    try {
      setLoading(true);
      const data = await participanteApi.getAll();
      setParticipantes(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar participantes');
    } finally {
      setLoading(false);
    }
  };

  // Função para extrair DDI, DDD e telefone de uma chave PIX que seja telefone
  const extrairTelefonePix = (chavePix: string) => {
    const telefoneLimpo = chavePix.replace(/\D/g, '');
    
    if (telefoneLimpo.length >= 10) {
      if (telefoneLimpo.startsWith('55') && telefoneLimpo.length >= 12) {
        const ddi = '+' + telefoneLimpo.substring(0, 2);
        const ddd = telefoneLimpo.substring(2, 4);
        const telefone = telefoneLimpo.substring(4);
        return { ddi, ddd, telefone };
      } else if (telefoneLimpo.length >= 10) {
        const ddd = telefoneLimpo.substring(0, 2);
        const telefone = telefoneLimpo.substring(2);
        return { ddi: '+55', ddd, telefone };
      }
    }
    return { ddi: '+55', ddd: '', telefone: '' };
  };

  // Função para determinar o tipo de PIX
  const determinarTipoPix = (chavePix: string, email: string) => {
    if (!chavePix) return 'outro';
    if (chavePix === email && email) return 'email';
    const telefoneLimpo = chavePix.replace(/\D/g, '');
    if (telefoneLimpo.length >= 10) return 'telefone';
    return 'outro';
  };

  const handleOpenModal = (participante?: Participante) => {
    if (participante) {
      setEditingParticipante(participante);
      const email = participante.email || '';
      const chavePix = participante.chavePix || '';
      const tipo = determinarTipoPix(chavePix, email);
      const telefoneInfo = tipo === 'telefone' ? extrairTelefonePix(chavePix) : { ddi: '+55', ddd: '', telefone: participante.telefone || '' };
      
      setFormData({ 
        nome: participante.nome, 
        email,
        chavePix,
        ddi: telefoneInfo.ddi,
        ddd: telefoneInfo.ddd,
        telefone: telefoneInfo.telefone
      });
      setTipoPix(tipo);
    } else {
      setEditingParticipante(null);
      setFormData({ nome: '', email: '', chavePix: '', ddi: '+55', ddd: '', telefone: '' });
      setTipoPix('outro');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingParticipante(null);
    setFormData({ nome: '', email: '', chavePix: '', ddi: '+55', ddd: '', telefone: '' });
    setTipoPix('outro');
  };

  // Função para atualizar PIX baseado no tipo selecionado
  const handleTipoPixChange = (tipo: 'email' | 'telefone' | 'outro') => {
    setTipoPix(tipo);
    
    if (tipo === 'email' && formData.email) {
      setFormData(prev => ({ ...prev, chavePix: prev.email }));
    } else if (tipo === 'telefone') {
      const telefoneCompleto = `${formData.ddi}${formData.ddd}${formData.telefone}`;
      const telefoneLimpo = telefoneCompleto.replace(/\D/g, '');
      if (telefoneLimpo.length >= 10) {
        setFormData(prev => ({ ...prev, chavePix: telefoneCompleto }));
      } else {
        setFormData(prev => ({ ...prev, chavePix: '' }));
      }
    }
  };

  // Função para atualizar telefone e PIX quando campos de telefone mudarem
  const handleTelefoneChange = (campo: 'ddi' | 'ddd' | 'telefone', valor: string) => {
    let novoFormData = { ...formData };
    if (campo === 'ddi') {
      novoFormData.ddi = valor;
    } else if (campo === 'ddd') {
      novoFormData.ddd = valor.replace(/\D/g, '').substring(0, 2);
    } else if (campo === 'telefone') {
      novoFormData.telefone = valor.replace(/\D/g, '').substring(0, 9);
    }
    
    // Se o tipo PIX for telefone, atualizar automaticamente
    if (tipoPix === 'telefone') {
      const telefoneCompleto = `${novoFormData.ddi}${novoFormData.ddd}${novoFormData.telefone}`;
      const telefoneLimpo = telefoneCompleto.replace(/\D/g, '');
      if (telefoneLimpo.length >= 10) {
        novoFormData.chavePix = telefoneCompleto;
      } else {
        novoFormData.chavePix = '';
      }
    }
    
    setFormData(novoFormData);
  };

  // Função para atualizar email e PIX quando email mudar
  const handleEmailChange = (email: string) => {
    const novoFormData = { ...formData, email };
    // Se o tipo PIX for email, atualizar automaticamente
    if (tipoPix === 'email') {
      novoFormData.chavePix = email;
    }
    setFormData(novoFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Montar telefone completo para salvar
      const telefoneCompleto = formData.ddd && formData.telefone 
        ? `${formData.ddi}${formData.ddd}${formData.telefone}` 
        : formData.telefone || '';
      
      const dataToSave = {
        nome: formData.nome,
        email: formData.email || undefined,
        chavePix: formData.chavePix || undefined,
        telefone: telefoneCompleto || undefined,
      };

      if (editingParticipante) {
        await participanteApi.update(editingParticipante.id, dataToSave);
      } else {
        await participanteApi.create(dataToSave);
      }
      handleCloseModal();
      loadParticipantes();
    } catch (err) {
      setError('Erro ao salvar participante');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este participante?')) {
      return;
    }
    try {
      await participanteApi.delete(id);
      loadParticipantes();
    } catch (err) {
      setError('Erro ao excluir participante');
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Participantes</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Novo Participante
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {/* Desktop Table View */}
        <div className="participantes-table-wrapper">
          <table className="participantes-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Chave PIX</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {participantes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                    Nenhum participante cadastrado
                  </td>
                </tr>
              ) : (
                participantes.map((participante) => (
                  <tr key={participante.id}>
                    <td>{participante.nome}</td>
                    <td>{participante.email || '-'}</td>
                    <td>{participante.telefone || '-'}</td>
                    <td>
                      {participante.chavePix ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{participante.chavePix}</span>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px', minWidth: 'auto' }}
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(participante.chavePix!);
                                alert('PIX copiado para a área de transferência!');
                              } catch (err) {
                                alert('Erro ao copiar PIX');
                              }
                            }}
                            title="Copiar PIX"
                          >
                            📋
                          </button>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '10px' }}
                        onClick={() => handleOpenModal(participante)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(participante.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="participantes-cards">
          {participantes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              Nenhum participante cadastrado
            </div>
          ) : (
            participantes.map((participante) => (
              <div key={participante.id} className="participante-card">
                <div className="participante-card-header">
                  <h3 className="participante-card-title">{participante.nome}</h3>
                  <div className="participante-card-actions">
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleOpenModal(participante)}
                      title="Editar participante"
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(participante.id)}
                      title="Excluir participante"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                <div className="participante-card-info">
                  {participante.email && (
                    <div className="participante-card-info-item">
                      <span className="participante-card-info-label">Email:</span>
                      <span>{participante.email}</span>
                    </div>
                  )}
                  {participante.telefone && (
                    <div className="participante-card-info-item">
                      <span className="participante-card-info-label">Telefone:</span>
                      <span>{participante.telefone}</span>
                    </div>
                  )}
                  {participante.chavePix ? (
                    <div className="participante-card-info-item">
                      <span className="participante-card-info-label">Chave PIX:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ wordBreak: 'break-all' }}>{participante.chavePix}</span>
                        <button
                          className="btn btn-secondary btn-small"
                          style={{ padding: '4px 8px', fontSize: '12px', minWidth: 'auto' }}
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(participante.chavePix!);
                              alert('PIX copiado para a área de transferência!');
                            } catch (err) {
                              alert('Erro ao copiar PIX');
                            }
                          }}
                          title="Copiar PIX"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="participante-card-info-item">
                      <span className="participante-card-info-label">Chave PIX:</span>
                      <span>-</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingParticipante ? 'Editar Participante' : 'Novo Participante'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome *</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Telefone</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={formData.ddi}
                onChange={(e) => handleTelefoneChange('ddi', e.target.value)}
                placeholder="+55"
                style={{ width: '80px' }}
                maxLength={4}
              />
              <input
                type="text"
                value={formData.ddd}
                onChange={(e) => handleTelefoneChange('ddd', e.target.value)}
                placeholder="DD"
                style={{ width: '60px' }}
                maxLength={2}
              />
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => handleTelefoneChange('telefone', e.target.value)}
                placeholder="00000-0000"
                style={{ flex: 1 }}
                maxLength={9}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Chave PIX</label>
            <input
              type="text"
              value={formData.chavePix}
              onChange={(e) => {
                setFormData({ ...formData, chavePix: e.target.value });
                // Se o usuário editar manualmente, mudar para 'outro'
                if (tipoPix !== 'outro') {
                  const novoTipo = determinarTipoPix(e.target.value, formData.email);
                  if (novoTipo !== tipoPix) {
                    setTipoPix('outro');
                  }
                }
              }}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
            />
          </div>
          <div className="form-group">
            <label style={{ marginBottom: '10px', display: 'block' }}>Tipo de Chave PIX:</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tipoPix"
                  value="email"
                  checked={tipoPix === 'email'}
                  onChange={() => handleTipoPixChange('email')}
                />
                <span>Usar Email como PIX</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tipoPix"
                  value="telefone"
                  checked={tipoPix === 'telefone'}
                  onChange={() => handleTipoPixChange('telefone')}
                />
                <span>Usar Telefone como PIX</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tipoPix"
                  value="outro"
                  checked={tipoPix === 'outro'}
                  onChange={() => handleTipoPixChange('outro')}
                />
                <span>Outro (CPF, chave aleatória, etc.)</span>
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Participantes;
