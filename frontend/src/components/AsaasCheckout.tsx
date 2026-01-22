import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { subscriptionApi } from '../services/api';

interface AsaasCheckoutProps {
  planType: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

interface InstallmentOption {
  count: number;
  value: number;
  total: number;
}

interface PixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

// Ícones SVG inline
const PixIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="4" fill="#32BCAD" />
    <path d="M12 7L9 10H11V14H13V10H15L12 7Z" fill="white" />
    <path d="M7 12L10 15H8V17H16V15H14L17 12L14 9H16V7H8V9H10L7 12Z" fill="white" />
  </svg>
);

const CreditCardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
    <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2" />
    <circle cx="18" cy="15" r="1.5" fill="currentColor" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M7 11V7C7 4.79086 8.79086 3 11 3H13C15.2091 3 17 4.79086 17 7V11" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const AsaasCheckout: React.FC<AsaasCheckoutProps> = ({
  planType,
  amount,
  onSuccess,
  onError,
  onCancel,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<PixQrCode | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [successCalled, setSuccessCalled] = useState(false);
  const [confirmSandboxLoading, setConfirmSandboxLoading] = useState(false);

  // Form fields for credit card
  const [cardData, setCardData] = useState({
    holderName: '',
    number: '',
    expiryDate: '', // MM/AA format
    ccv: '',
  });

  const [cardHolderInfo, setCardHolderInfo] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    postalCode: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    addressNumber: '',
    addressComplement: '',
    phone: '',
    mobilePhone: '',
  });

  const [loadingCEP, setLoadingCEP] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [userCpfCnpj, setUserCpfCnpj] = useState<string>('');

  useEffect(() => {
    loadInstallmentOptions();
    setSuccessCalled(false); // Reset quando mudar de plano/valor

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [planType, amount]);

  useEffect(() => {
    const cleaned = cardHolderInfo.postalCode.replace(/\D/g, '');
    if (cleaned.length === 8 && !loadingCEP) {
      const timeoutId = setTimeout(() => {
        fetchAddressByCEP(cleaned);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (cleaned.length !== 8) {
      setCepError(null);
      setCardHolderInfo(prev => ({
        ...prev,
        address: '',
        neighborhood: '',
        city: '',
        state: '',
      }));
    }
  }, [cardHolderInfo.postalCode]);

  const loadInstallmentOptions = async () => {
    try {
      setLoadingOptions(true);
      const data = await subscriptionApi.getInstallmentOptions(planType);
      setInstallmentOptions(data.options);
      if (data.options && data.options.length > 0) {
        setSelectedInstallment(data.options[0].count);
      }
    } catch (error: any) {
      console.error('Erro ao carregar opções de parcelamento:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchAddressByCEP = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return;

    setLoadingCEP(true);
    setCepError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        setCepError('CEP não encontrado');
        return;
      }

      setCardHolderInfo(prev => ({
        ...prev,
        address: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      }));
      setCepError(null);
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setCepError('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setLoadingCEP(false);
    }
  };

  const validateCardNumber = (number: string): string | null => {
    const cleaned = number.replace(/\s/g, '');
    if (!cleaned) return 'Número do cartão é obrigatório';
    if (cleaned.length < 13 || cleaned.length > 19) {
      return 'Número do cartão deve ter entre 13 e 19 dígitos';
    }
    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    if (sum % 10 !== 0) {
      return 'Número do cartão inválido';
    }
    return null;
  };

  const validateExpiryDate = (date: string): string | null => {
    if (!date) return 'Data de validade é obrigatória';
    const cleaned = date.replace(/\D/g, '');
    if (cleaned.length !== 4) return 'Data de validade deve estar no formato MM/AA';
    
    const month = parseInt(cleaned.slice(0, 2));
    const year = parseInt(cleaned.slice(2, 4));
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (month < 1 || month > 12) return 'Mês inválido';
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return 'Cartão expirado';
    }
    return null;
  };

  const validateCVV = (cvv: string): string | null => {
    if (!cvv) return 'CVV é obrigatório';
    const cleaned = cvv.replace(/\D/g, '');
    if (cleaned.length < 3 || cleaned.length > 4) {
      return 'CVV deve ter 3 ou 4 dígitos';
    }
    return null;
  };

  const validateCPFCNPJ = (value: string): string | null => {
    if (!value) return 'CPF/CNPJ é obrigatório';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 11 && cleaned.length !== 14) {
      return 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos';
    }
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email) return 'E-mail é obrigatório';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'E-mail inválido';
    }
    return null;
  };

  const validateCEP = (cep: string): string | null => {
    const cleaned = cep.replace(/\D/g, '');
    if (!cleaned) return 'CEP é obrigatório';
    if (cleaned.length !== 8) return 'CEP deve ter 8 dígitos';
    if (loadingCEP) return null;
    if (cepError) return cepError;
    return null;
  };

  const validatePhone = (phone: string, isRequired: boolean = false): string | null => {
    if (!phone && !isRequired) return null;
    if (!phone && isRequired) return 'Telefone é obrigatório';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned && (cleaned.length < 10 || cleaned.length > 11)) {
      return 'Telefone deve ter 10 ou 11 dígitos (com DDD)';
    }
    return null;
  };

  const validateAllFields = (paymentMethod: 'PIX' | 'CREDIT_CARD'): boolean => {
    const errors: Record<string, string> = {};

    // Só validar campos de cartão se for pagamento com cartão
    if (paymentMethod === 'CREDIT_CARD') {
      errors.cardHolderName = !cardData.holderName ? 'Nome no cartão é obrigatório' : '';
      errors.cardNumber = validateCardNumber(cardData.number) || '';
      errors.expiryDate = validateExpiryDate(cardData.expiryDate) || '';
      errors.cvv = validateCVV(cardData.ccv) || '';

      errors.holderName = !cardHolderInfo.name ? 'Nome completo é obrigatório' : '';
      errors.email = validateEmail(cardHolderInfo.email) || '';
      errors.cpfCnpj = validateCPFCNPJ(cardHolderInfo.cpfCnpj) || '';
      errors.cep = validateCEP(cardHolderInfo.postalCode) || '';
      errors.addressNumber = !cardHolderInfo.addressNumber ? 'Número do endereço é obrigatório' : '';
      errors.phone = validatePhone(cardHolderInfo.phone) || '';
      errors.mobilePhone = validatePhone(cardHolderInfo.mobilePhone) || '';
    }
    // Para PIX, não há validação de campos necessária

    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  };

  const parseExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 4) return { month: '', year: '' };
    return {
      month: cleaned.slice(0, 2),
      year: cleaned.slice(2, 4)
    };
  };

  const handlePayment = async () => {
    // Só validar campos se for pagamento com cartão
    if (paymentMethod === 'CREDIT_CARD' && !validateAllFields('CREDIT_CARD')) {
      onError('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      setLoading(true);

      if (paymentMethod === 'PIX') {
        // Validar CPF para PIX - limpar erros primeiro
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.userCpfCnpj;
          return newErrors;
        });

        const cleanedCpf = userCpfCnpj ? userCpfCnpj.replace(/\D/g, '') : '';
        const cpfError = validateCPFCNPJ(userCpfCnpj);
        
        if (cpfError) {
          setFieldErrors(prev => ({ ...prev, userCpfCnpj: cpfError }));
          onError(cpfError);
          setLoading(false);
          return;
        }

        // Se chegou aqui, CPF é válido - garantir que não há erro
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.userCpfCnpj;
          return newErrors;
        });

        let result;
        if (planType === 'LIFETIME') {
          result = await subscriptionApi.createLifetime({
            paymentMethod: 'PIX',
            userCpfCnpj: cleanedCpf,
          });
        } else {
          result = await subscriptionApi.create({
            planType,
            paymentMethod: 'PIX',
            userCpfCnpj: cleanedCpf,
          });
        }
        
        if (result.pixQrCode) {
          setPixQrCode(result.pixQrCode);
          setCheckoutId(result.subscriptionId || result.asaasPaymentId);
          startPolling(result.subscriptionId || result.asaasPaymentId);
        } else {
          throw new Error('QR Code PIX não foi gerado');
        }
      } else {
        const { month, year } = parseExpiryDate(cardData.expiryDate);
        if (!month || !year) {
          throw new Error('Data de validade inválida');
        }

        const installmentCount = selectedInstallment > 1 ? selectedInstallment : undefined;
        
        let result;
        if (planType === 'LIFETIME') {
          result = await subscriptionApi.createLifetime({
            paymentMethod: 'CREDIT_CARD',
            installmentCount,
            creditCard: {
              holderName: cardData.holderName,
              number: cardData.number.replace(/\s/g, ''),
              expiryMonth: month,
              expiryYear: year,
              ccv: cardData.ccv,
            },
            creditCardHolderInfo: {
              name: cardHolderInfo.name,
              email: cardHolderInfo.email,
              cpfCnpj: cardHolderInfo.cpfCnpj.replace(/\D/g, ''),
              postalCode: cardHolderInfo.postalCode.replace(/\D/g, ''),
              addressNumber: cardHolderInfo.addressNumber,
              addressComplement: cardHolderInfo.addressComplement || undefined,
              phone: cardHolderInfo.phone.replace(/\D/g, '') || undefined,
              mobilePhone: cardHolderInfo.mobilePhone.replace(/\D/g, '') || undefined,
            },
          });
        } else {
          result = await subscriptionApi.create({
            planType,
            paymentMethod: 'CREDIT_CARD',
            creditCard: {
              holderName: cardData.holderName,
              number: cardData.number.replace(/\s/g, ''),
              expiryMonth: month,
              expiryYear: year,
              ccv: cardData.ccv,
            },
            creditCardHolderInfo: {
              name: cardHolderInfo.name,
              email: cardHolderInfo.email,
              cpfCnpj: cardHolderInfo.cpfCnpj.replace(/\D/g, ''),
              postalCode: cardHolderInfo.postalCode.replace(/\D/g, ''),
              addressNumber: cardHolderInfo.addressNumber,
              addressComplement: cardHolderInfo.addressComplement || undefined,
              phone: cardHolderInfo.phone.replace(/\D/g, '') || undefined,
              mobilePhone: cardHolderInfo.mobilePhone.replace(/\D/g, '') || undefined,
            },
          });
        }
        
        if (result.status === 'CONFIRMED') {
          onSuccess();
        } else {
          throw new Error('Pagamento não foi confirmado');
        }
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      onError(error.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (id: string) => {
    // Limpar qualquer intervalo existente antes de criar um novo
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      // Proteção: não fazer nada se já chamamos onSuccess
      if (successCalled) {
        clearInterval(interval);
        setPollingInterval(null);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/subscriptions/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.subscription && data.subscription.status === 'ACTIVE') {
            // Limpar intervalo antes de chamar onSuccess
            clearInterval(interval);
            setPollingInterval(null);
            
            // Marcar que já chamamos para evitar múltiplas chamadas
            if (!successCalled) {
              setSuccessCalled(true);
              onSuccess();
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 5000);

    setPollingInterval(interval);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19);
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      const formatted = cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      return formatted.slice(0, 14);
    } else {
      const formatted = cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      return formatted.slice(0, 18);
    }
  };

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
    return formatted.slice(0, 9);
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      const formatted = cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      return formatted.length > cleaned.length ? formatted : cleaned;
    } else if (cleaned.length <= 11) {
      const formatted = cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      return formatted.length > cleaned.length ? formatted : cleaned;
    }
    return cleaned.slice(0, 11);
  };

  const handleBlur = (fieldName: string, validator?: (value: string) => string | null) => {
    if (!validator) return;
    
    let value = '';
    if (fieldName === 'cardHolderName') {
      value = cardData.holderName;
    } else if (fieldName === 'cardNumber') {
      value = cardData.number;
    } else if (fieldName === 'expiryDate') {
      value = cardData.expiryDate;
    } else if (fieldName === 'cvv') {
      value = cardData.ccv;
    } else if (fieldName === 'userCpfCnpj') {
      value = userCpfCnpj;
    } else {
      value = (cardHolderInfo as any)[fieldName] || '';
    }

    const error = validator(value);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const hasErrors = Object.keys(fieldErrors).length > 0;

  // Estilos padrão do site
  const containerStyle: React.CSSProperties = {
    padding: '24px',
    maxWidth: '600px',
    margin: '0 auto',
  };

  const cardStyle: React.CSSProperties = {
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    background: 'rgba(255, 255, 255, 0.06)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(10px)',
    padding: '24px',
    marginBottom: '20px',
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: hasError ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(148, 163, 184, 0.20)',
    background: 'rgba(2, 6, 23, 0.32)',
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
  });

  const buttonPrimaryStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 30%, #3b82f6 60%, #22c55e 100%)',
    color: 'rgba(255, 255, 255, 1)',
    boxShadow: '0 10px 30px rgba(99, 102, 241, 0.35)',
    border: 'none',
    borderRadius: '999px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'filter 0.2s, transform 0.2s',
    width: '100%',
  };

  const buttonSecondaryStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.10)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    color: 'rgba(255, 255, 255, 0.92)',
    borderRadius: '999px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.2s',
    width: '100%',
  };

  if (pixQrCode) {
    // Parse da data de expiração - pode vir em diferentes formatos
    let expirationDate: Date;
    try {
      expirationDate = new Date(pixQrCode.expirationDate);
      // Se a data for inválida, tentar adicionar 30 minutos como fallback
      if (isNaN(expirationDate.getTime())) {
        console.warn('Data de expiração inválida, usando 30 minutos como padrão');
        expirationDate = new Date(Date.now() + 30 * 60000);
      }
    } catch (error) {
      console.error('Erro ao parsear data de expiração:', error);
      expirationDate = new Date(Date.now() + 30 * 60000); // 30 minutos como fallback
    }

    const now = new Date();
    const diffMs = expirationDate.getTime() - now.getTime();
    const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
    
    // Formatar tempo de forma mais legível
    const formatTimeRemaining = (minutes: number): string => {
      // Se o tempo for muito alto (mais de 24 horas), pode indicar um problema
      if (minutes > 1440) {
        console.warn(`Tempo de expiração muito alto: ${minutes} minutos. Verificando data...`);
        // Limitar a exibição a 24 horas máximo
        const days = Math.floor(minutes / 1440);
        const hours = Math.floor((minutes % 1440) / 60);
        if (days > 0) {
          return `${days} dia${days !== 1 ? 's' : ''} e ${hours} hora${hours !== 1 ? 's' : ''}`;
        }
      }
      
      if (minutes < 60) {
        return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
      }
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hora${hours !== 1 ? 's' : ''}`;
      }
      return `${hours} hora${hours !== 1 ? 's' : ''} e ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
    };

    const timeRemaining = formatTimeRemaining(totalMinutes);

    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '20px', color: 'rgba(255, 255, 255, 0.95)', textAlign: 'center' }}>
            Escaneie o QR Code para pagar
          </h3>
          <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'center' }}>
            <QRCodeSVG value={pixQrCode.payload} size={256} />
          </div>
          <p style={{ marginBottom: '12px', color: 'rgba(255, 255, 255, 0.92)', textAlign: 'center' }}>
            <strong>Tempo restante:</strong> {timeRemaining}
          </p>
          <p style={{ fontSize: '14px', color: 'rgba(226, 232, 240, 0.8)', marginBottom: '20px', textAlign: 'center' }}>
            Ou copie e cole o código abaixo no aplicativo do seu banco:
          </p>
          <textarea
            readOnly
            value={pixQrCode.payload}
            style={{
              ...inputStyle(false),
              fontFamily: 'monospace',
              fontSize: '12px',
              marginBottom: '20px',
              resize: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '12px' }}>
            <button onClick={onCancel} style={buttonSecondaryStyle}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={confirmSandboxLoading}
              onClick={async () => {
                setConfirmSandboxLoading(true);
                try {
                  await subscriptionApi.confirmPixSandbox();
                  // Polling vai detectar ACTIVE e redirecionar
                } catch (e: any) {
                  onError(e?.response?.data?.error || e?.message || 'Erro ao simular pagamento');
                } finally {
                  setConfirmSandboxLoading(false);
                }
              }}
              style={{
                ...buttonSecondaryStyle,
                borderColor: 'rgba(34, 197, 94, 0.4)',
                color: 'rgb(134, 239, 172)',
              }}
            >
              {confirmSandboxLoading ? 'Simulando…' : 'Simular pagamento (sandbox)'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.7)', marginTop: '4px', textAlign: 'center' }}>
            Aguardando confirmação do pagamento...
          </p>
        </div>
      </div>
    );
  }

  // Ícone de voltar
  const ArrowLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Botão para voltar aos planos */}
        <button
          onClick={onCancel}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            marginBottom: '20px',
            background: 'transparent',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.92)',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
          }}
        >
          <ArrowLeftIcon />
          <span>Voltar para planos</span>
        </button>

        <h3 style={{ marginBottom: '20px', color: 'rgba(255, 255, 255, 0.95)' }}>
          Escolha a forma de pagamento
        </h3>
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={() => setPaymentMethod('PIX')}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: paymentMethod === 'PIX' ? '2px solid rgba(99, 102, 241, 0.6)' : '1px solid rgba(148, 163, 184, 0.16)',
              background: paymentMethod === 'PIX' 
                ? 'rgba(99, 102, 241, 0.15)' 
                : 'rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.92)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <PixIcon />
            <span style={{ fontWeight: '600' }}>PIX</span>
          </button>
          <button
            onClick={() => setPaymentMethod('CREDIT_CARD')}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: paymentMethod === 'CREDIT_CARD' ? '2px solid rgba(99, 102, 241, 0.6)' : '1px solid rgba(148, 163, 184, 0.16)',
              background: paymentMethod === 'CREDIT_CARD' 
                ? 'rgba(99, 102, 241, 0.15)' 
                : 'rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.92)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <CreditCardIcon />
            <span style={{ fontWeight: '600' }}>Cartão de Crédito</span>
          </button>
        </div>

        {/* Mensagem de segurança */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <LockIcon />
          <span style={{ fontSize: '13px', color: 'rgba(220, 252, 231, 0.9)' }}>
            Seu pagamento é 100% seguro e protegido
          </span>
        </div>

        {paymentMethod === 'PIX' ? (
          <div>
            <p style={{ marginBottom: '16px', color: 'rgba(255, 255, 255, 0.92)' }}>
              Valor: <strong style={{ color: 'rgba(99, 102, 241, 1)' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
              </strong>
            </p>
            <p style={{ fontSize: '14px', color: 'rgba(226, 232, 240, 0.8)', marginBottom: '20px' }}>
              O pagamento via PIX é processado instantaneamente após a confirmação.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.92)',
                fontSize: '14px',
              }}>
                CPF/CNPJ *
              </label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={userCpfCnpj}
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value);
                  setUserCpfCnpj(formatted);
                  
                  // Validar e limpar erro em tempo real
                  const cleaned = formatted.replace(/\D/g, '');
                  if (cleaned.length === 11 || cleaned.length === 14) {
                    // CPF/CNPJ completo - validar
                    const error = validateCPFCNPJ(formatted);
                    if (error) {
                      setFieldErrors(prev => ({ ...prev, userCpfCnpj: error }));
                    } else {
                      // Válido - limpar erro
                      setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.userCpfCnpj;
                        return newErrors;
                      });
                    }
                  } else if (cleaned.length > 0) {
                    // Ainda digitando - limpar erro temporariamente
                    setFieldErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.userCpfCnpj;
                      return newErrors;
                    });
                  }
                }}
                onBlur={() => {
                  // Validar ao sair do campo
                  handleBlur('userCpfCnpj', validateCPFCNPJ);
                }}
                style={inputStyle(!!fieldErrors.userCpfCnpj)}
              />
              {fieldErrors.userCpfCnpj && (
                <p style={{ color: 'rgba(239, 68, 68, 0.9)', fontSize: '12px', marginTop: '4px', marginBottom: '0' }}>
                  {fieldErrors.userCpfCnpj}
                </p>
              )}
              <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.7)', marginTop: '4px' }}>
                Necessário para processar o pagamento PIX. Este dado será salvo no seu cadastro.
              </p>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              style={{
                ...buttonPrimaryStyle,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Processando...' : 'Gerar QR Code PIX'}
            </button>
          </div>
        ) : (
          <div>
            {loadingOptions ? (
              <p style={{ color: 'rgba(255, 255, 255, 0.92)', textAlign: 'center' }}>
                Carregando opções de parcelamento...
              </p>
            ) : (
              <>
                {/* Mostrar valor sempre, mesmo sem parcelamento */}
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ marginBottom: '16px', color: 'rgba(255, 255, 255, 0.92)' }}>
                    Valor: <strong style={{ color: 'rgba(99, 102, 241, 1)' }}>
                      {installmentOptions.length > 0 && selectedInstallment > 1
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            installmentOptions.find(opt => opt.count === selectedInstallment)?.total || amount
                          )
                        : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
                      }
                    </strong>
                  </p>
                </div>

                {installmentOptions.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.92)',
                      fontSize: '14px',
                    }}>
                      Parcelas:
                    </label>
                    <select
                      value={selectedInstallment}
                      onChange={(e) => setSelectedInstallment(parseInt(e.target.value))}
                      style={inputStyle(false)}
                    >
                      {installmentOptions.map((option) => (
                        <option key={option.count} value={option.count}>
                          {option.count}x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(option.value)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    marginBottom: '16px', 
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontSize: '18px',
                    fontWeight: '600',
                  }}>
                    Dados do Cartão
                  </h4>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Nome no cartão"
                      value={cardData.holderName}
                      onChange={(e) => {
                        setCardData({ ...cardData, holderName: e.target.value });
                        if (fieldErrors.cardHolderName) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.cardHolderName;
                            return newErrors;
                          });
                        }
                      }}
                      onBlur={() => handleBlur('cardHolderName', (v) => !v ? 'Nome no cartão é obrigatório' : null)}
                      style={inputStyle(!!fieldErrors.cardHolderName)}
                    />
                    {fieldErrors.cardHolderName && (
                      <p style={{ color: 'rgba(239, 68, 68, 0.9)', fontSize: '12px', marginTop: '4px', marginBottom: '0' }}>
                        {fieldErrors.cardHolderName}
                      </p>
                    )}
                  </div>

                  {/* Número, Vencimento e CVV na mesma linha */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr 0.8fr', 
                    gap: '12px', 
                    marginBottom: '16px' 
                  }}>
                    <div>
                      <input
                        type="text"
                        placeholder="Número do cartão"
                        value={cardData.number}
                        onChange={(e) => {
                          setCardData({ ...cardData, number: formatCardNumber(e.target.value) });
                          if (fieldErrors.cardNumber) {
                            setFieldErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.cardNumber;
                              return newErrors;
                            });
                          }
                        }}
                        onBlur={() => handleBlur('cardNumber', validateCardNumber)}
                        maxLength={19}
                        style={inputStyle(!!fieldErrors.cardNumber)}
                      />
                      {fieldErrors.cardNumber && (
                        <p style={{ color: 'rgba(239, 68, 68, 0.9)', fontSize: '12px', marginTop: '4px', marginBottom: '0' }}>
                          {fieldErrors.cardNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={cardData.expiryDate}
                        onChange={(e) => {
                          const formatted = formatExpiryDate(e.target.value);
                          setCardData({ ...cardData, expiryDate: formatted });
                          if (fieldErrors.expiryDate) {
                            setFieldErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.expiryDate;
                              return newErrors;
                            });
                          }
                        }}
                        onBlur={() => handleBlur('expiryDate', validateExpiryDate)}
                        maxLength={5}
                        style={inputStyle(!!fieldErrors.expiryDate)}
                      />
                      {fieldErrors.expiryDate && (
                        <p style={{ color: 'rgba(239, 68, 68, 0.9)', fontSize: '12px', marginTop: '4px', marginBottom: '0' }}>
                          {fieldErrors.expiryDate}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="CVV"
                        value={cardData.ccv}
                        onChange={(e) => {
                          setCardData({ ...cardData, ccv: e.target.value.replace(/\D/g, '').slice(0, 4) });
                          if (fieldErrors.cvv) {
                            setFieldErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.cvv;
                              return newErrors;
                            });
                          }
                        }}
                        onBlur={() => handleBlur('cvv', validateCVV)}
                        maxLength={4}
                        style={inputStyle(!!fieldErrors.cvv)}
                      />
                      {fieldErrors.cvv && (
                        <p style={{ color: 'rgba(239, 68, 68, 0.9)', fontSize: '12px', marginTop: '4px', marginBottom: '0' }}>
                          {fieldErrors.cvv}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    marginBottom: '16px', 
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontSize: '18px',
                    fontWeight: '600',
                  }}>
                    Dados do Titular
                  </h4>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={cardHolderInfo.name}
                      onChange={(e) => {
                        setCardHolderInfo({ ...cardHolderInfo, name: e.target.value });
                        if (fieldErrors.holderName) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.holderName;
                            return newErrors;
                          });
                        }
                      }}
                      onBlur={() => handleBlur('name', (v) => !v ? 'Nome completo é obrigatório' : null)}
                      style={inputStyle(!!fieldErrors.holderName)}
                    />
                    {fieldErrors.holderName && (
                      <p style={{ color: 'rgba(239, 68, 68, 0.9)', fontSize: '12px', marginTop: '4px', marginBottom: '0' }}>
                        {fieldErrors.holderName}
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <input
                      type="email"
                      placeholder="E-mail"
                      value={cardHolderInfo.email}
                      onChange={(e) => {
                        setCardHolderInfo({ ...cardHolderInfo, email: e.target.value });
                        if (fieldErrors.email) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.email;
                            return newErrors;
                          });
                        }
                      }}
                      onBlur={() => handleBlur('email', validateEmail)}
                      style={inputStyle(!!fieldErrors.email)}
                    />
                    {fieldErrors.email && (
                      <p style={{ color: 'rgba(239, 68, 68, 0.9)', fontSize: '12px', marginTop: '4px', marginBottom: '0' }}>
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="CPF/CNPJ"
                      value={cardHolderInfo.cpfCnpj}
                      onChange={(e) => {
                        setCardHolderInfo({ ...cardHolderInfo, cpfCnpj: formatCPF(e.target.value) });
                        if (fieldErrors.cpfCnpj) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.cpfCnpj;
                            return newErrors;
                          });
                        }
                      }}
                      onBlur={() => handleBlur('cpfCnpj', validateCPFCNPJ)}
                      style={inputStyle(!!fieldErrors.cpfCnpj)}
                    />
                    {fieldErrors.cpfCnpj && (
                      <p style={{ color: 'rgba(239, 68, 68, 0.9)', fontSize: '12px', marginTop: '4px', marginBottom: '0' }}>
                        {fieldErrors.cpfCnpj}
                      </p>
                    )}
                  </div>

                  {/* Seção de Endereço */}
                  <div style={{
                    marginTop: '24px',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    background: 'rgba(15, 23, 42, 0.4)',
                  }}>
                    <h5 style={{
                      marginBottom: '16px',
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontSize: '16px',
                      fontWeight: '600',
                    }}>
                      Endereço
                    </h5>

                    <div style={{ display: 'grid', gridTemplateColumns: '0.4fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <input
                          type="text"
                          placeholder="CEP"
                          value={cardHolderInfo.postalCode}
                          onChange={(e) => {
                            const formatted = formatCEP(e.target.value);
                            setCardHolderInfo({ ...cardHolderInfo, postalCode: formatted });
                            setCepError(null);
                            if (fieldErrors.cep) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.cep;
                                return newErrors;
                              });
                            }
                          }}
                          onBlur={() => handleBlur('postalCode', validateCEP)}
                          style={inputStyle(!!fieldErrors.cep || !!cepError)}
                        />
                        {loadingCEP && (
                          <p style={{ color: 'rgba(226, 232, 240, 0.8)', fontSize: '12px', marginTop: '4px', marginBottom: '0' }}>
                            Buscando...
                          </p>
                        )}
                        {(fieldErrors.cep || cepError) && !loadingCEP && (
                          <p style={{ color: 'rgba(239, 68, 68, 0.9)', fontSize: '12px', marginTop: '4px', marginBottom: '0' }}>
                            {fieldErrors.cep || cepError}
                          </p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Logradouro (Rua, Avenida, etc.)"
                          value={cardHolderInfo.address}
                          onChange={(e) => setCardHolderInfo({ ...cardHolderInfo, address: e.target.value })}
                          style={inputStyle(false)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <input
                          type="text"
                          placeholder="Bairro"
                          value={cardHolderInfo.neighborhood}
                          onChange={(e) => setCardHolderInfo({ ...cardHolderInfo, neighborhood: e.target.value })}
                          style={inputStyle(false)}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Cidade"
                          value={cardHolderInfo.city}
                          onChange={(e) => setCardHolderInfo({ ...cardHolderInfo, city: e.target.value })}
                          style={inputStyle(false)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '0.3fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <input
                          type="text"
                          placeholder="UF"
                          value={cardHolderInfo.state}
                          onChange={(e) => setCardHolderInfo({ ...cardHolderInfo, state: e.target.value.toUpperCase().slice(0, 2) })}
                          maxLength={2}
                          style={inputStyle(false)}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Número"
                          value={cardHolderInfo.addressNumber}
                          onChange={(e) => {
                            setCardHolderInfo({ ...cardHolderInfo, addressNumber: e.target.value });
                            if (fieldErrors.addressNumber) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.addressNumber;
                                return newErrors;
                              });
                            }
                          }}
                          onBlur={() => handleBlur('addressNumber', (v) => !v ? 'Número do endereço é obrigatório' : null)}
                          style={inputStyle(!!fieldErrors.addressNumber)}
                        />
                        {fieldErrors.addressNumber && (
                          <p style={{ color: 'rgba(239, 68, 68, 0.9)', fontSize: '12px', marginTop: '4px', marginBottom: '0' }}>
                            {fieldErrors.addressNumber}
                          </p>
                        )}
                      </div>
                    </div>


                    <div style={{ marginBottom: '0' }}>
                      <input
                        type="text"
                        placeholder="Complemento (opcional)"
                        value={cardHolderInfo.addressComplement}
                        onChange={(e) => setCardHolderInfo({ ...cardHolderInfo, addressComplement: e.target.value })}
                        style={inputStyle(false)}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Telefone (opcional)"
                      value={cardHolderInfo.phone ? formatPhone(cardHolderInfo.phone) : ''}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        setCardHolderInfo({ ...cardHolderInfo, phone: cleaned });
                        if (fieldErrors.phone) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.phone;
                            return newErrors;
                          });
                        }
                      }}
                      onBlur={() => handleBlur('phone', (v) => validatePhone(v))}
                      style={inputStyle(!!fieldErrors.phone)}
                    />
                    {fieldErrors.phone && (
                      <p style={{ color: 'rgba(239, 68, 68, 0.9)', fontSize: '12px', marginTop: '4px', marginBottom: '0' }}>
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: '0' }}>
                    <input
                      type="text"
                      placeholder="Celular (opcional)"
                      value={cardHolderInfo.mobilePhone ? formatPhone(cardHolderInfo.mobilePhone) : ''}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        setCardHolderInfo({ ...cardHolderInfo, mobilePhone: cleaned });
                        if (fieldErrors.mobilePhone) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.mobilePhone;
                            return newErrors;
                          });
                        }
                      }}
                      onBlur={() => handleBlur('mobilePhone', (v) => validatePhone(v))}
                      style={inputStyle(!!fieldErrors.mobilePhone)}
                    />
                    {fieldErrors.mobilePhone && (
                      <p style={{ color: 'rgba(239, 68, 68, 0.9)', fontSize: '12px', marginTop: '4px', marginBottom: '0' }}>
                        {fieldErrors.mobilePhone}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  style={{
                    ...buttonPrimaryStyle,
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Processando...' : 'Pagar'}
                </button>
                {hasErrors && (
                  <p style={{ 
                    color: 'rgba(239, 68, 68, 0.9)', 
                    fontSize: '12px', 
                    marginTop: '12px', 
                    textAlign: 'center' 
                  }}>
                    Por favor, corrija os erros acima antes de continuar
                  </p>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
