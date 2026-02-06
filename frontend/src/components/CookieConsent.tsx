import React, { useState, useEffect } from 'react';
import { FaCookieBite, FaShieldAlt, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './CookieConsent.css';

const CONSENT_KEY = 'cookie_consent';
const CONSENT_DATE_KEY = 'cookie_consent_date';

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true, // Always true - required for app to function
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (accepted: boolean, prefs?: ConsentPreferences) => {
    const consentData = {
      accepted,
      preferences: prefs || preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
    localStorage.setItem(CONSENT_DATE_KEY, new Date().toISOString());
    setShowBanner(false);

    // Dispatch event for analytics integration
    window.dispatchEvent(
      new CustomEvent('cookieConsentUpdated', { detail: consentData })
    );
  };

  const handleAcceptAll = () => {
    const allAccepted = { essential: true, analytics: true, marketing: true };
    setPreferences(allAccepted);
    saveConsent(true, allAccepted);
  };

  const handleAcceptSelected = () => {
    saveConsent(true, preferences);
  };

  const handleRejectAll = () => {
    const onlyEssential = { essential: true, analytics: false, marketing: false };
    setPreferences(onlyEssential);
    saveConsent(false, onlyEssential);
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-consent-overlay">
      <div className="cookie-consent-banner">
        <button
          className="cookie-consent-close"
          onClick={handleRejectAll}
          aria-label="Fechar"
        >
          <FaTimes />
        </button>

        <div className="cookie-consent-header">
          <FaCookieBite className="cookie-icon" />
          <h3>Aviso de Privacidade e Cookies</h3>
        </div>

        <div className="cookie-consent-content">
          <p>
            Nos utilizamos cookies e tecnologias semelhantes para melhorar sua experiencia,
            personalizar conteudo e analisar o trafego do site. De acordo com a{' '}
            <strong>LGPD (Lei Geral de Protecao de Dados)</strong>, precisamos do seu
            consentimento para coletar e processar seus dados pessoais.
          </p>

          {showDetails && (
            <div className="cookie-preferences">
              <div className="cookie-preference-item">
                <div className="preference-info">
                  <FaShieldAlt className="preference-icon essential" />
                  <div>
                    <strong>Cookies Essenciais</strong>
                    <p>Necessarios para o funcionamento basico do site. Nao podem ser desativados.</p>
                  </div>
                </div>
                <label className="preference-toggle disabled">
                  <input type="checkbox" checked disabled />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="cookie-preference-item">
                <div className="preference-info">
                  <FaShieldAlt className="preference-icon analytics" />
                  <div>
                    <strong>Cookies de Analise</strong>
                    <p>Nos ajudam a entender como voce usa o site para melhorarmos nossos servicos.</p>
                  </div>
                </div>
                <label className="preference-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="cookie-preference-item">
                <div className="preference-info">
                  <FaShieldAlt className="preference-icon marketing" />
                  <div>
                    <strong>Cookies de Marketing</strong>
                    <p>Usados para exibir anuncios relevantes e medir a eficacia das campanhas.</p>
                  </div>
                </div>
                <label className="preference-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({ ...preferences, marketing: e.target.checked })
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          <p className="cookie-consent-links">
            Saiba mais em nossa{' '}
            <Link to="/privacidade">Politica de Privacidade</Link>
            {' '}e{' '}
            <Link to="/termos">Termos de Uso</Link>.
          </p>
        </div>

        <div className="cookie-consent-actions">
          <button
            className="cookie-btn cookie-btn-details"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Ocultar detalhes' : 'Personalizar'}
          </button>

          <div className="cookie-btn-group">
            <button className="cookie-btn cookie-btn-reject" onClick={handleRejectAll}>
              Rejeitar todos
            </button>

            {showDetails ? (
              <button className="cookie-btn cookie-btn-accept" onClick={handleAcceptSelected}>
                Aceitar selecionados
              </button>
            ) : (
              <button className="cookie-btn cookie-btn-accept" onClick={handleAcceptAll}>
                Aceitar todos
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
