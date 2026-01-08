import React, { useState, useEffect } from 'react';
import { Participante } from '../types';
import Modal from './Modal';
import { FaUserPlus, FaArrowLeft } from 'react-icons/fa';

interface ParticipanteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  participante?: Participante | null;
  onSave: (data: { nome: string; email?: string; chavePix?: string; telefone?: string }) => Promise<void>;
  saving?: boolean;
  error?: string;
  successMessage?: string;
  showSuccessMessage?: boolean;
}

const ParticipanteFormModal: React.FC<ParticipanteFormModalProps> = ({
  isOpen,
  onClose,
  participante,
  onSave,
  saving = false,
  error,
  successMessage,
  showSuccessMessage = false,
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [ddi, setDdi] = useState('+55');
  const [ddd, setDdd] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoPix, setTipoPix] = useState<'email' | 'telefone' | 'outro'>('outro');

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

  // Inicializar formulário quando participante mudar ou modal abrir
  useEffect(() => {
    if (isOpen && participante) {
      const emailValue = participante.email || '';
      const chavePixValue = participante.chavePix || '';
      const tipo = determinarTipoPix(chavePixValue, emailValue);
      
      // Extrair telefone: se tipo for 'telefone', extrair da chave PIX, senão extrair do telefone do participante
      let telefoneInfo;
      if (tipo === 'telefone') {
        telefoneInfo = extrairTelefonePix(chavePixValue);
      } else if (participante.telefone) {
        // Tentar extrair do telefone do participante
        telefoneInfo = extrairTelefonePix(participante.telefone);
      } else {
        telefoneInfo = { ddi: '+55', ddd: '', telefone: '' };
      }
      
      setNome(participante.nome);
      setEmail(emailValue);
      setChavePix(chavePixValue);
      setDdi(telefoneInfo.ddi);
      setDdd(telefoneInfo.ddd);
      setTelefone(telefoneInfo.telefone);
      setTipoPix(tipo);
    } else if (isOpen && !participante) {
      // Resetar para criar novo
      setNome('');
      setEmail('');
      setChavePix('');
      setDdi('+55');
      setDdd('');
      setTelefone('');
      setTipoPix('outro');
    }
  }, [isOpen, participante]);

  // Função para atualizar PIX baseado no tipo selecionado
  const handleTipoPixChange = (tipo: 'email' | 'telefone' | 'outro') => {
    setTipoPix(tipo);
    
    if (tipo === 'email' && email) {
      setChavePix(email);
    } else if (tipo === 'telefone') {
      const telefoneCompleto = `${ddi}${ddd}${telefone}`;
      const telefoneLimpo = telefoneCompleto.replace(/\D/g, '');
      if (telefoneLimpo.length >= 10) {
        setChavePix(telefoneCompleto);
      } else {
        setChavePix('');
      }
    }
  };

  // Função para atualizar telefone e PIX quando campos de telefone mudarem
  const handleTelefoneChange = (campo: 'ddi' | 'ddd' | 'telefone', valor: string) => {
    if (campo === 'ddi') {
      setDdi(valor);
    } else if (campo === 'ddd') {
      setDdd(valor.replace(/\D/g, '').substring(0, 2));
    } else if (campo === 'telefone') {
      setTelefone(valor.replace(/\D/g, '').substring(0, 9));
    }
    
    // Se o tipo PIX for telefone, atualizar automaticamente
    if (tipoPix === 'telefone') {
      const ddiValue = campo === 'ddi' ? valor : ddi;
      const dddValue = campo === 'ddd' ? valor.replace(/\D/g, '').substring(0, 2) : ddd;
      const telefoneValue = campo === 'telefone' ? valor.replace(/\D/g, '').substring(0, 9) : telefone;
      const telefoneCompleto = `${ddiValue}${dddValue}${telefoneValue}`;
      const telefoneLimpo = telefoneCompleto.replace(/\D/g, '');
      if (telefoneLimpo.length >= 10) {
        setChavePix(telefoneCompleto);
      } else {
        setChavePix('');
      }
    }
  };

  // Função para atualizar email e PIX quando email mudar
  const handleEmailChange = (emailValue: string) => {
    setEmail(emailValue);
    // Se o tipo PIX for email, atualizar automaticamente
    if (tipoPix === 'email') {
      setChavePix(emailValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      return;
    }

    // Montar telefone completo para salvar
    const telefoneCompleto = ddd && telefone 
      ? `${ddi}${ddd}${telefone}` 
      : telefone || '';

    await onSave({
      nome: nome.trim(),
      email: email.trim() || undefined,
      chavePix: chavePix.trim() || undefined,
      telefone: telefoneCompleto || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={participante ? 'Editar Participante' : 'Novo Participante'}
    >
      {showSuccessMessage && successMessage && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '16px', 
          backgroundColor: 'rgba(34, 197, 94, 0.1)', 
          border: '1px solid rgba(34, 197, 94, 0.3)', 
          borderRadius: '8px',
          color: '#22c55e',
          textAlign: 'center'
        }}>
          {successMessage}
        </div>
      )}
      {error && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '16px', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)', 
          borderRadius: '8px',
          color: '#ef4444',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome *</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder={participante ? undefined : "Nome do participante"}
            autoFocus={!participante}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="email@exemplo.com"
          />
        </div>
        <div className="form-group">
          <label>Telefone</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={ddi}
              onChange={(e) => handleTelefoneChange('ddi', e.target.value)}
              placeholder="+55"
              style={{ width: '80px' }}
              maxLength={4}
            />
            <input
              type="text"
              value={ddd}
              onChange={(e) => handleTelefoneChange('ddd', e.target.value)}
              placeholder="DD"
              style={{ width: '60px' }}
              maxLength={2}
            />
            <input
              type="text"
              value={telefone}
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
            value={chavePix}
            onChange={(e) => {
              setChavePix(e.target.value);
              // Se o usuário editar manualmente, mudar para 'outro'
              if (tipoPix !== 'outro') {
                const novoTipo = determinarTipoPix(e.target.value, email);
                if (novoTipo !== tipoPix) {
                  setTipoPix('outro');
                }
              }
            }}
            placeholder={participante ? "CPF, e-mail, telefone ou chave aleatória" : "Chave PIX"}
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
        <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {participante ? (saving ? 'Salvando...' : 'Salvar') : (saving ? 'Adicionando...' : 'Adicionar')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ParticipanteFormModal;

