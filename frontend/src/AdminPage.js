import React, { useState, useEffect } from 'react';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : ('http://' + window.location.hostname + ':3000');

const AdminPage = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [operateurs, setOperateurs] = useState([]);
  const [operateursBadges, setOperateursBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOperateur, setSelectedOperateur] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [dbStatus, setDbStatus] = useState('🔴');
  const [dbStats, setDbStats] = useState(null);
  const [filtreActif, setFiltreActif] = useState('tous'); // 'tous' ou 'badges'
  const [lancements, setLancements] = useState({ enCours: [], termines: [] });
  const [loadingLancements, setLoadingLancements] = useState(false);
  const [vueSimple, setVueSimple] = useState(true);
  const [tousLancements, setTousLancements] = useState([]);
  const [loadingTousLancements, setLoadingTousLancements] = useState(false);
  
  // Nouvelle section admin temps
  const [operateursAdmin, setOperateursAdmin] = useState([]);
  const [operateurSelectionne, setOperateurSelectionne] = useState('');
  const [sessionsOperateur, setSessionsOperateur] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [modificationEnCours, setModificationEnCours] = useState(null);

  useEffect(() => {
    checkDatabaseStatus();
    loadDatabaseStats();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch(API_BASE + '/api/test-connection');
      const data = await response.json();
      setDbStatus(data.success ? '🟢' : '🔴');
    } catch (error) {
      setDbStatus('🟡');
    }
  };

  const loadDatabaseStats = async () => {
    try {
      const response = await fetch(API_BASE + '/api/database-stats');
      const data = await response.json();
      if (data.success) {
        setDbStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const loadLancements = async () => {
    setLoadingLancements(true);
    setError('');
    try {
      const endpoint = vueSimple ? '/api/lancements-simple' : '/api/lancements-status';
      const response = await fetch(API_BASE + endpoint);
      const data = await response.json();
      if (data.success) {
        setLancements({
          enCours: data.enCours || [],
          termines: data.termines || []
        });
      } else {
        setError(data.error || 'Erreur lors du chargement des lancements');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoadingLancements(false);
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
      const response = await fetch(API_BASE + '/api/operateurs');
      const data = await response.json();
      if (data.success) {
        setOperateurs(data.operateurs);
        setFiltreActif('tous');
      } else {
        setError(data.error || 'Erreur lors du chargement des opérateurs');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const loadOperateursBadges = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_BASE + '/api/operateurs-badges');
      const data = await response.json();
      if (data.success) {
        setOperateursBadges(data.operateurs_badges);
        setFiltreActif('badges');
      } else {
        setError(data.error || 'Erreur lors du chargement des opérateurs badgés');
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
      const response = await fetch(API_BASE + `/api/operateur-lancements-journee/${operateurId}`);
      const data = await response.json();
      if (data.success) {
        setHistorique(data.lancements);
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

  const chargerTousLancements = async () => {
    setLoadingTousLancements(true);
    setError('');
    try {
      const response = await fetch(API_BASE + '/api/tous-operateurs-lancements-journee');
      const data = await response.json();
      if (data.success) {
        setTousLancements(data.operateurs);
        setSelectedOperateur(null); // Réinitialiser la sélection individuelle
      } else {
        setError(data.error || 'Erreur lors du chargement des lancements');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoadingTousLancements(false);
    }
  };

  const chargerOperateursAdmin = async () => {
    setLoadingAdmin(true);
    setError('');
    try {
      const response = await fetch(API_BASE + '/api/admin-operateurs-sessions');
      const data = await response.json();
      if (data.success) {
        setOperateursAdmin(data.operateurs);
      } else {
        setError(data.error || 'Erreur lors du chargement des opérateurs');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleOperateurSelection = (operateurId) => {
    setOperateurSelectionne(operateurId);
    const operateur = operateursAdmin.find(op => op.operateur === operateurId);
    setSessionsOperateur(operateur ? operateur.sessions : []);
  };

  const modifierSession = async (sessionId, heureDebut, heureFin) => {
    try {
      const response = await fetch(API_BASE + '/api/admin-modifier-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          heureDebut,
          heureFin
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setSuccess('Session modifiée avec succès');
        // Mettre à jour localement
        setSessionsOperateur(prev => 
          prev.map(session => 
            session.id === sessionId 
              ? { ...session, heureDebut, heureFin }
              : session
          )
        );
        setModificationEnCours(null);
      } else {
        setError(data.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    }
  };

  const terminerSession = async (sessionId) => {
    try {
      const response = await fetch(API_BASE + '/api/admin-terminer-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      
      const data = await response.json();
      if (data.success) {
        setSuccess(`Session terminée à ${data.heureFin}`);
        // Mettre à jour localement
        setSessionsOperateur(prev => 
          prev.map(session => 
            session.id === sessionId 
              ? { ...session, heureFin: data.heureFin, statut: 'TERMINE' }
              : session
          )
        );
      } else {
        setError(data.error || 'Erreur lors de la terminaison');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    }
  };

  const exportToERP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(API_BASE + '/api/export-to-erp', {
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
          
          {/* Boutons de filtre */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={loadOperateurs}
              style={{
                padding: '8px 16px',
                backgroundColor: filtreActif === 'tous' ? '#007bff' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              👥 Tous les opérateurs
            </button>
            <button
              onClick={loadOperateursBadges}
              style={{
                padding: '8px 16px',
                backgroundColor: filtreActif === 'badges' ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🟢 Opérateurs badgés
            </button>
            <button
              onClick={chargerTousLancements}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              disabled={loadingTousLancements}
            >
              {loadingTousLancements ? '⏳' : '📋'} Voir tous les lancements
            </button>
            <button
              onClick={chargerOperateursAdmin}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              disabled={loadingAdmin}
            >
              {loadingAdmin ? '⏳' : '⚙️'} Gestion des temps
            </button>
          </div>

          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filtreActif === 'tous' ? (
                operateurs.map((operateur, index) => (
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
                ))
              ) : (
                operateursBadges.map((operateur, index) => (
                  <div key={index} style={{ padding: '12px', border: '1px solid #28a745', marginBottom: '12px', borderRadius: '6px', backgroundColor: '#f8fff9' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>🟢 {operateur.operateur}</div>
                    <div style={{ color: '#2c3e50', fontWeight: '500', marginBottom: '8px' }}>{operateur.nom}</div>
                    
                    {/* Lancements en cours */}
                    {operateur.lancements && (
                      <div style={{ fontSize: '13px', color: '#2980b9', marginBottom: '5px' }}>
                        <strong>🚀 Lancements:</strong> {operateur.lancements}
                      </div>
                    )}
                    
                    {/* Phases */}
                    {operateur.phases && (
                      <div style={{ fontSize: '13px', color: '#8e44ad', marginBottom: '5px' }}>
                        <strong>⚙️ Phases:</strong> {operateur.phases}
                      </div>
                    )}
                    
                    {/* Postes */}
                    {operateur.postes && (
                      <div style={{ fontSize: '13px', color: '#d35400', marginBottom: '8px' }}>
                        <strong>🏭 Postes:</strong> {operateur.postes}
                      </div>
                    )}
                    
                    <div style={{ fontSize: '12px', color: '#28a745', marginBottom: '5px' }}>
                      Sessions: {operateur.nombre_sessions} | Statut: {operateur.statut}
                    </div>
                    
                    {operateur.derniere_activite && (
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                        Dernière activité: 16/09/2025
                      </div>
                    )}
                    
                    <button
                      onClick={() => chargerHistorique(operateur.operateur)}
                      style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      📊 Historique
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* PRIORITÉ : Section admin gestion des temps */}
        {operateursAdmin.length > 0 && (
          <div style={{ marginBottom: '40px', padding: '20px', border: '2px solid #28a745', borderRadius: '10px', backgroundColor: '#f8fff8' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#28a745' }}>
              ⚙️ Gestion des temps - Administration (PRIORITÉ)
            </h2>
            
            {/* Menu déroulant opérateurs */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                Sélectionner un opérateur :
              </label>
              <select
                value={operateurSelectionne}
                onChange={(e) => handleOperateurSelection(e.target.value)}
                style={{
                  padding: '10px',
                  fontSize: '16px',
                  border: '2px solid #28a745',
                  borderRadius: '5px',
                  backgroundColor: 'white',
                  minWidth: '300px'
                }}
              >
                <option value="">-- Choisir un opérateur --</option>
                {operateursAdmin.map(op => (
                  <option key={op.operateur} value={op.operateur}>
                    {op.operateur} - {op.nom} ({op.sessions.length} session{op.sessions.length > 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Tableau des sessions si opérateur sélectionné */}
            {operateurSelectionne && sessionsOperateur.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#495057' }}>
                  Sessions de travail - {operateursAdmin.find(op => op.operateur === operateurSelectionne)?.nom}
                </h4>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#28a745', color: 'white' }}>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Lancement</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Phase</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Poste</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Heure début</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Heure fin</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Statut</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionsOperateur.map((session, index) => (
                        <tr key={session.id} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }}>{session.codeLancement}</td>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }}>{session.phase}</td>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }}>{session.poste}</td>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                            {modificationEnCours === session.id ? (
                              <input
                                type="time"
                                defaultValue={session.heureDebut}
                                id={`debut-${session.id}`}
                                style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                              />
                            ) : (
                              session.heureDebut || 'N/A'
                            )}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                            {modificationEnCours === session.id ? (
                              <input
                                type="time"
                                defaultValue={session.heureFin || ''}
                                id={`fin-${session.id}`}
                                style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                              />
                            ) : (
                              session.heureFin || '⏱️ En cours'
                            )}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              backgroundColor: session.statut === 'EN_COURS' ? '#e7f3ff' : '#d4edda',
                              color: session.statut === 'EN_COURS' ? '#0066cc' : '#155724'
                            }}>
                              {session.statut === 'EN_COURS' ? '🔄 EN COURS' : '✅ TERMINÉ'}
                            </span>
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                            {session.statut === 'EN_COURS' ? (
                              <span style={{
                                padding: '5px 10px',
                                backgroundColor: '#f8f9fa',
                                color: '#6c757d',
                                border: '1px solid #dee2e6',
                                borderRadius: '3px',
                                fontSize: '12px'
                              }}>
                                🔒 En cours
                              </span>
                            ) : modificationEnCours === session.id ? (
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                  onClick={() => {
                                    const debut = document.getElementById(`debut-${session.id}`).value;
                                    const fin = document.getElementById(`fin-${session.id}`).value;
                                    modifierSession(session.id, debut, fin);
                                  }}
                                  style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  ✅ Sauver
                                </button>
                                <button
                                  onClick={() => setModificationEnCours(null)}
                                  style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  ❌ Annuler
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setModificationEnCours(session.id)}
                                style={{
                                  padding: '5px 10px',
                                  backgroundColor: '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                ✏️ Modifier
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {operateurSelectionne && sessionsOperateur.length === 0 && (
              <p style={{ color: '#6c757d', textAlign: 'center', marginTop: '20px' }}>
                Aucune session trouvée pour cet opérateur.
              </p>
            )}
          </div>
        )}

        {/* Historique de l'opérateur sélectionné (en bas maintenant) */}
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

          {/* Section tous les lancements */}
          {tousLancements.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>
                🎯 Tous les lancements de la journée ({tousLancements.length} opérateurs)
              </h3>
              
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {tousLancements.map((operateur, index) => (
                  <div key={`global-${operateur.operateur}`} style={{
                    marginBottom: '25px',
                    border: '2px solid #dee2e6',
                    borderRadius: '10px',
                    backgroundColor: 'white'
                  }}>
                    {/* En-tête opérateur */}
                    <div style={{
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      borderBottom: '2px solid #dee2e6',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#495057', fontSize: '18px' }}>
                          👤 {operateur.operateur} - {operateur.nom}
                        </h4>
                        <div style={{ color: '#6c757d', fontSize: '14px', marginTop: '5px' }}>
                          {operateur.nombreLancements} lancement{operateur.nombreLancements > 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        borderRadius: '25px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        ⏰ Total: {operateur.tempsTotalFormate}
                      </div>
                    </div>

                    {/* Liste des lancements */}
                    <div style={{ padding: '10px' }}>
                      {operateur.lancementsArray.map((lancement, lanceIndex) => (
                        <div key={`${operateur.operateur}-${lancement.codeLancement}`} style={{
                          marginBottom: '15px',
                          border: '1px solid #e9ecef',
                          borderRadius: '6px',
                          backgroundColor: '#fcfcfc'
                        }}>
                          {/* En-tête lancement */}
                          <div style={{
                            padding: '10px 15px',
                            backgroundColor: '#f1f3f5',
                            borderBottom: '1px solid #e9ecef',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <strong style={{ color: '#495057', fontSize: '15px' }}>
                                🚀 {lancement.codeLancement}
                              </strong>
                              <span style={{ marginLeft: '10px', color: '#6c757d', fontSize: '13px' }}>
                                {lancement.phases.length} phase{lancement.phases.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div style={{
                              color: '#495057',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}>
                              ⏱️ {lancement.tempsTotalFormate}
                            </div>
                          </div>

                          {/* Liste des phases */}
                          <div style={{ padding: '5px 15px 10px 15px' }}>
                            {lancement.phases.map((phase, phaseIndex) => (
                              <div key={`${lancement.codeLancement}-${phase.phase}-${phaseIndex}`} style={{
                                padding: '5px 0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '13px'
                              }}>
                                <div style={{ flex: 1 }}>
                                  <span style={{ color: '#495057' }}>
                                    📋 Phase {phase.phase}
                                  </span>
                                  <span style={{ marginLeft: '8px', color: '#6c757d' }}>
                                    📍 {phase.poste}
                                  </span>
                                </div>
                                <div style={{ color: '#495057', fontWeight: 'bold' }}>
                                  {phase.duree}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPage; 