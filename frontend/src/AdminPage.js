import React, { useState, useEffect } from 'react';

const AdminPage = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [operateurs, setOperateurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOperateur, setSelectedOperateur] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [dbStatus, setDbStatus] = useState('🔴');
  const [dbStats, setDbStats] = useState(null);

  useEffect(() => {
    checkDatabaseStatus();
    loadDatabaseStats();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/test-connection');
      const data = await response.json();
      setDbStatus(data.success ? '🟢' : '🔴');
    } catch (error) {
      setDbStatus('🟡');
    }
  };

  const loadDatabaseStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/database-stats');
      const data = await response.json();
      if (data.success) {
        setDbStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleLogin = () => {
    if (password === 'admin123') {
      setAuthenticated(true);
      loadOperateurs();
    } else {
      setError('Mot de passe incorrect');
    }
  };

  const loadOperateurs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/operateurs');
      const data = await response.json();
      if (data.success) {
        setOperateurs(data.operateurs);
      } else {
        setError(data.error || 'Erreur lors du chargement des opérateurs');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const chargerHistorique = async (operateurId) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/historique-operateur/${operateurId}`);
      const data = await response.json();
      if (data.success) {
        setHistorique(data.enregistrements);
        setSelectedOperateur(operateurId);
      } else {
        setError(data.error || 'Erreur lors du chargement de l\'historique');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const exportToERP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('http://localhost:5000/api/export-to-erp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('✅ Données exportées vers l\'ERP avec succès !');
        loadDatabaseStats(); // Recharger les stats après export
      } else {
        setError(data.error || 'Erreur lors de l\'export');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 400, margin: '50px auto', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>🔐 Administration</h2>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Mot de passe:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            placeholder="Entrez le mot de passe"
          />
        </div>
        <button
          onClick={handleLogin}
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Se connecter
        </button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>📊 Administration - Suivi Opérateurs</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>SQL Server: {dbStatus}</span>
          <button
            onClick={() => setAuthenticated(false)}
            style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Statistiques de la base de données */}
      {dbStats && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>📈 Statistiques de la base autonome</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
              <strong>Temps de travail:</strong> {dbStats.temps_travail || 0} enregistrements
            </div>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
              <strong>Historique:</strong> {dbStats.historique || 0} enregistrements
            </div>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
              <strong>Sessions:</strong> {dbStats.sessions || 0} enregistrements
            </div>
          </div>
        </div>
      )}

      {/* Bouton d'export vers l'ERP */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={exportToERP}
          disabled={loading}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '⏳ Export en cours...' : '📤 Exporter vers l\'ERP SILOG'}
        </button>
      </div>

      {success && (
        <div style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '20px' }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Liste des opérateurs */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2>👥 Liste des Opérateurs</h2>
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {operateurs.map((operateur, index) => (
                <div key={index} style={{ padding: '10px', border: '1px solid #ddd', marginBottom: '10px', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 'bold' }}>{operateur.operateur}</div>
                  <div style={{ color: '#666' }}>{operateur.nom}</div>
                  <button
                    onClick={() => chargerHistorique(operateur.operateur)}
                    style={{ marginTop: '5px', padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    📊 Historique
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historique de l'opérateur sélectionné */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2>📋 Historique de l'Opérateur</h2>
          {selectedOperateur && (
            <p style={{ marginBottom: '15px', color: '#666' }}>
              Opérateur: <strong>{selectedOperateur}</strong>
            </p>
          )}
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {historique.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: 800 }}>
                    <div style={{
                      display: 'flex',
                      fontWeight: 'bold',
                      backgroundColor: '#f8f9fa',
                      padding: '10px',
                      borderBottom: '2px solid #dee2e6',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>
                      <div style={{ flex: '1 0 140px' }}>Code LT</div>
                      <div style={{ flex: '1 0 140px' }}>Phase</div>
                      <div style={{ flex: '0 0 160px' }}>Code Rubrique</div>
                      <div style={{ flex: '0 0 140px' }}>Début (heure)</div>
                      <div style={{ flex: '0 0 140px' }}>Fin (heure)</div>
                    </div>
                    {(() => {
                      const sorted = [...historique].sort((a, b) => new Date(b.dateTravail) - new Date(a.dateTravail));
                      return sorted.map((enreg, index) => {
                        const startDate = enreg.dateTravail ? new Date(enreg.dateTravail) : null;
                        const totalSeconds = (enreg.varNumUtil8 || 0) * 60 + (enreg.varNumUtil9 || 0);
                        const endDate = startDate ? new Date(startDate.getTime() + totalSeconds * 1000) : null;
                        const debutHeure = startDate ? startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-';
                        const finHeure = endDate ? endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-';
                        return (
                          <div key={`${enreg.noEnreg}-${index}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 10px',
                            borderBottom: '1px solid #eee',
                            backgroundColor: index === 0 ? '#fcfffc' : 'white'
                          }}>
                            <div style={{ flex: '1 0 140px', color: '#2c3e50' }}>{enreg.codeLanctImprod}</div>
                            <div style={{ flex: '1 0 140px' }}>{enreg.phase || '-'}</div>
                            <div style={{ flex: '0 0 160px' }}>{enreg.codeRubrique || '-'}</div>
                            <div style={{ flex: '0 0 140px' }}>{debutHeure}</div>
                            <div style={{ flex: '0 0 140px' }}>{finHeure}</div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                <p style={{ color: '#666', textAlign: 'center' }}>
                  {selectedOperateur ? 'Aucun historique trouvé pour cet opérateur' : 'Sélectionnez un opérateur pour voir son historique'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 