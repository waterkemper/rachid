import React, { useState } from 'react';
import { participanteApi } from '../services/api';
import Modal from './Modal';

interface AdicionarParticipanteRapidoProps {
  isOpen: boolean;
  onClose: () => void;
  onParticipanteAdicionado: (participanteId: number) => void;
}

const AdicionarParticipanteRapido: React.FC<AdicionarParticipanteRapidoProps> = ({
  isOpen,
  onClose,
  onParticipanteAdicionado,
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    setCarregando(true);

    try {
      const participante = await participanteApi.create({
        nome: nome.trim(),
        email: email.trim() || undefined,
      });

      onParticipanteAdicionado(participante.id);
      setNome('');
      setEmail('');
      onClose();
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao criar participante');
    } finally {
      setCarregando(false);
    }
  };

  const handleClose = () => {
    setNome('');
    setEmail('');
    setErro('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar Participante Rápido">
      <form onSubmit={handleSubmit}>
        {erro && <div className="error-message">{erro}</div>}

        <div className="form-group">
          <label>Nome *</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            disabled={carregando}
            placeholder="Nome do participante"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={carregando}
            placeholder="email@exemplo.com"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={carregando}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={carregando}>
            {carregando ? 'Criando...' : 'Criar e Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdicionarParticipanteRapido;
