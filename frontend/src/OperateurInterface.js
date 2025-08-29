import React, { useState, useEffect } from 'react';

const OperateurInterface = () => {
  const [operateurId, setOperateurId] = useState('');
  const [operateurNom, setOperateurNom] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Données du formulaire
  const [formData, setFormData] = useState({
    codeLancement: '',
    phase: '',
    codeRubrique: '',
    varNumUtil8: '',
    varNumUtil9: ''
  });

  // Données récupérées depuis LCTC
  const [ltcData, setLtcData] = useState(null);
  const [loadingLtc, setLoadingLtc] = useState(false);
  
  // Chronomètre automatique
  const [chronometre, setChronometre] = useState({ minutes: 0, secondes: 0 });
  const [chronometreActif, setChronometreActif] = useState(false);
  const [chronometreInterval, setChronometreInterval] = useState(null);
  
  // État du processus de travail
  const [etatTravail, setEtatTravail] = useState('en_attente'); // 'en_attente', 'en_cours', 'en_pause'
  
  // Données du LT en pause
  const [ltEnPause, setLtEnPause] = useState(null);

  // Nouveaux états pour l'historique et le dernier LT
  const [historiqueOperateur, setHistoriqueOperateur] = useState([]);
  const [dernierLT, setDernierLT] = useState(null);
  const [tempsTotalLancementActuel, setTempsTotalLancementActuel] = useState({ minutes: 0, secondes: 0 });
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  // Charger l'historique de l'opérateur
  const chargerHistoriqueOperateur = async (operateurId) => {
    if (!operateurId) return;
    
    setLoadingHistorique(true);
    try {
      const response = await fetch(`http://localhost:5000/api/historique-operateur/${operateurId}`);
      const data = await response.json();
      
      if (data.success) {
        setHistoriqueOperateur(data.enregistrements || []);
        
        // Récupérer le dernier LT (le plus récent)
        if (data.enregistrements && data.enregistrements.length > 0) {
          setDernierLT(data.enregistrements[0]);
        }
      } else {
        console.error('Erreur lors du chargement de l\'historique:', data.error);
      }
    } catch (err) {
      console.error('Erreur de connexion lors du chargement de l\'historique:', err);
    } finally {
      setLoadingHistorique(false);
    }
  };

  // Calculer le temps total passé sur un lancement spécifique
  const calculerTempsTotalLancement = (codeLancement) => {
    const enregistrements = historiqueOperateur.filter(
      enreg => enreg.codeLanctImprod === codeLancement
    );
    
    let totalMinutes = 0;
    let totalSecondes = 0;
    
    enregistrements.forEach(enreg => {
      totalMinutes += enreg.varNumUtil8 || 0;
      totalSecondes += enreg.varNumUtil9 || 0;
    });
    
    // Convertir les secondes en minutes si nécessaire
    totalMinutes += Math.floor(totalSecondes / 60);
    totalSecondes = totalSecondes % 60;
    
    return { minutes: totalMinutes, secondes: totalSecondes };
  };

  // Mettre à jour le temps total du lancement actuel
  useEffect(() => {
    if (formData.codeLancement && historiqueOperateur.length > 0) {
      const temps = calculerTempsTotalLancement(formData.codeLancement);
      setTempsTotalLancementActuel(temps);
    }
  }, [formData.codeLancement, historiqueOperateur]);

  // Vérifier si l'opérateur est déjà connecté (simulation d'une tablette)
  useEffect(() => {
    const savedOperateur = localStorage.getItem('operateur_connecte');
    if (savedOperateur) {
      const operateur = JSON.parse(savedOperateur);
      setOperateurId(operateur.id);
      setOperateurNom(operateur.nom);
      setIsConnected(true);
      // Charger l'historique dès la connexion
      chargerHistoriqueOperateur(operateur.id);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/operateurs');
      const data = await response.json();
      
      if (data.success) {
        const operateur = data.operateurs.find(op => op.operateur === operateurId);
        if (operateur) {
          setOperateurNom(operateur.nom);
          setIsConnected(true);
          // Sauvegarder en local (simulation tablette)
          localStorage.setItem('operateur_connecte', JSON.stringify({
            id: operateurId,
            nom: operateur.nom
          }));
          setSuccess(`Connecté en tant que ${operateur.nom}`);
          // Charger l'historique de l'opérateur
          chargerHistoriqueOperateur(operateurId);
        } else {
          setError('Code opérateur non reconnu');
        }
      } else {
        setError('Erreur de connexion au serveur');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsConnected(false);
    setOperateurId('');
    setOperateurNom('');
    localStorage.removeItem('operateur_connecte');
    setSuccess('');
    setError('');
  };

  const demarrerChronometre = () => {
    if (chronometreInterval) {
      clearInterval(chronometreInterval);
    }
    
    setChronometre({ minutes: 0, secondes: 0 });
    setChronometreActif(true);
    
    const interval = setInterval(() => {
      setChronometre(prev => {
        let newSecondes = prev.secondes + 1;
        let newMinutes = prev.minutes;
        
        if (newSecondes >= 60) {
          newSecondes = 0;
          newMinutes += 1;
        }
        
        return { minutes: newMinutes, secondes: newSecondes };
      });
    }, 1000);
    
    setChronometreInterval(interval);
  };

  const arreterChronometre = () => {
    if (chronometreInterval) {
      clearInterval(chronometreInterval);
      setChronometreInterval(null);
    }
    setChronometreActif(false);
  };

  const demarrerTravailAutomatique = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/demarrer-travail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operateurId: operateurId,
          operateurNom: operateurNom,
          codeLancement: formData.codeLancement,
          phase: formData.phase,
          codeRubrique: formData.codeRubrique,
          dateTravail: new Date().toISOString()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('🚀 Travail démarré automatiquement - Données enregistrées !');
      } else {
        setError(data.error || 'Erreur lors du démarrage automatique');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  const demarrerTravail = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/demarrer-travail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operateurId: operateurId,
          operateurNom: operateurNom,
          codeLancement: formData.codeLancement,
          phase: formData.phase,
          codeRubrique: formData.codeRubrique,
          dateTravail: new Date().toISOString()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setEtatTravail('en_cours');
        setSuccess('🚀 Travail démarré - Données enregistrées !');
      } else {
        setError(data.error || 'Erreur lors du démarrage');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const mettreEnPause = () => {
    setEtatTravail('en_pause');
    arreterChronometre();
    // Sauvegarder les données du LT en cours
    setLtEnPause({
      codeLancement: formData.codeLancement,
      phase: formData.phase,
      codeRubrique: formData.codeRubrique,
      ltcData: ltcData,
      chronometre: { ...chronometre }
    });
    setSuccess('⏸️ Travail mis en pause - Vous pouvez reprendre ou commencer un nouveau LT');
  };

  const reprendreTravail = () => {
    if (ltEnPause) {
      // Restaurer les données du LT en pause
      setFormData(prev => ({
        ...prev,
        codeLancement: ltEnPause.codeLancement,
        phase: ltEnPause.phase,
        codeRubrique: ltEnPause.codeRubrique
      }));
      setLtcData(ltEnPause.ltcData);
      setChronometre(ltEnPause.chronometre);
      setChronometreActif(true);
      
      // Redémarrer le chronomètre
      const interval = setInterval(() => {
        setChronometre(prev => {
          let newSecondes = prev.secondes + 1;
          let newMinutes = prev.minutes;
          
          if (newSecondes >= 60) {
            newSecondes = 0;
            newMinutes += 1;
          }
          
          return { minutes: newMinutes, secondes: newSecondes };
        });
      }, 1000);
      
      setChronometreInterval(interval);
    }
    
    setEtatTravail('en_cours');
    setSuccess('▶️ Travail repris avec le LT précédent !');
  };

  const annulerTravail = () => {
    setEtatTravail('en_attente');
    setFormData({
      codeLancement: '',
      phase: '',
      codeRubrique: '',
      varNumUtil8: '',
      varNumUtil9: ''
    });
    setLtcData(null);
    setLtEnPause(null);
    arreterChronometre();
    setChronometre({ minutes: 0, secondes: 0 });
    setSuccess('❌ Travail annulé');
  };

  const commencerNouveauLt = () => {
    setEtatTravail('en_attente');
    setFormData({
      codeLancement: '',
      phase: '',
      codeRubrique: '',
      varNumUtil8: '',
      varNumUtil9: ''
    });
    setLtcData(null);
    setLtEnPause(null);
    arreterChronometre();
    setChronometre({ minutes: 0, secondes: 0 });
    setSuccess('🆕 Prêt pour un nouveau LT');
  };

  const recupererLtcData = async (codeLancement) => {
    setLoadingLtc(true);
    setError('');
    
    // Si un autre LT est en cours avec chrono actif, le mettre en pause pour basculer
    if (
      etatTravail === 'en_cours' &&
      chronometreActif &&
      formData.codeLancement &&
      formData.codeLancement !== codeLancement
    ) {
      mettreEnPause();
    }
    
    // Normaliser l'état si un ancien 'en_cours' traine alors que le chrono est arrêté
    if (etatTravail === 'en_cours' && !chronometreActif) {
      setEtatTravail('en_attente');
    }
    
    // Vérifier si ce LT est déjà en cours ou en pause
    if (etatTravail === 'en_cours' && chronometreActif && formData.codeLancement === codeLancement) {
      setError('Ce LT est déjà en cours de travail !');
      setLoadingLtc(false);
      return;
    }
    
    if (etatTravail === 'en_pause' && ltEnPause && ltEnPause.codeLancement === codeLancement) {
      setError('Ce LT est déjà en pause ! Utilisez "Reprendre LT en cours" pour continuer.');
      setLoadingLtc(false);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/ltc-data/${codeLancement}`);
      const data = await response.json();
      
      if (data.success) {
        setLtcData(data.ltcData);
        setFormData(prev => ({
          ...prev,
          phase: data.ltcData.phase || '',
          codeRubrique: data.ltcData.codeRubrique || ''
        }));
        setSuccess('Informations LT récupérées avec succès !');
        
        // Démarrer automatiquement le chronomètre
        demarrerChronometre();
        
        // Passer directement en état "en cours" et démarrer le travail
        setEtatTravail('en_cours');
        
        // Démarrer automatiquement le travail dans la base
        demarrerTravailAutomatique();
      } else {
        setError(data.error || 'Code LT non trouvé');
        setLtcData(null);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      setLtcData(null);
    } finally {
      setLoadingLtc(false);
    }
  };

  const terminerTravail = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Remplacer par l'endpoint de la nouvelle table
      const response = await fetch('http://localhost:5000/api/terminer-travail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operateurId: operateurId,
          operateurNom: operateurNom,
          codeLancement: formData.codeLancement,
          phase: formData.phase,
          codeRubrique: formData.codeRubrique,
          tempsMinutes: chronometreActif ? chronometre.minutes : formData.varNumUtil8,
          tempsSecondes: chronometreActif ? chronometre.secondes : formData.varNumUtil9,
          dateTravail: new Date().toISOString()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('✅ Travail terminé - Données enregistrées !');
        setFormData({
          codeLancement: '',
          phase: '',
          codeRubrique: '',
          varNumUtil8: '',
          varNumUtil9: ''
        });
        setLtcData(null);
        arreterChronometre();
        setChronometre({ minutes: 0, secondes: 0 });
        setLtEnPause(null);
        setEtatTravail('en_attente');
        // Recharger l'historique après avoir terminé le travail
        chargerHistoriqueOperateur(operateurId);
      } else {
        setError(data.error || 'Erreur lors de la finalisation');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Styles
  const containerStyle = {
    maxWidth: 800,
    margin: '0 auto',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const titleStyle = {
    textAlign: 'center',
    color: '#2c3e50',
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '30px',
    borderBottom: '3px solid #3498db',
    paddingBottom: '10px',
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const inputGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const labelStyle = {
    fontWeight: 'bold',
    color: '#34495e',
    fontSize: '16px',
  };

  const inputStyle = {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '16px',
    backgroundColor: '#f8f9fa',
  };

  const buttonStyle = {
    padding: '12px 24px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#3498db',
    color: 'white',
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#e74c3c',
    color: 'white',
  };

  const successStyle = {
    padding: '12px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '6px',
    border: '1px solid #c3e6cb',
  };

  const errorStyle = {
    padding: '12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '6px',
    border: '1px solid #f5c6cb',
  };

  const infoStyle = {
    padding: '15px',
    backgroundColor: '#e3f2fd',
    color: '#0d47a1',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #bbdefb',
  };

  if (!isConnected) {
    return (
      <div style={containerStyle}>
        <h1 style={titleStyle}>🔐 Interface Opérateur</h1>
        
        {error && <div style={errorStyle}>❌ {error}</div>}
        {success && <div style={successStyle}>✅ {success}</div>}
        
        <div style={infoStyle}>
          <strong>📱 Connexion Tablette</strong><br/>
          Entrez votre code opérateur pour accéder à l'interface de saisie.
        </div>

        <form onSubmit={handleLogin} style={formStyle}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Code Opérateur :</label>
            <input
              type="text"
              value={operateurId}
              onChange={(e) => setOperateurId(e.target.value)}
              style={inputStyle}
              placeholder="Ex: OP001"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              ...primaryButtonStyle,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={titleStyle}>📝 Saisie Temps de Travail</h1>
        <button onClick={handleLogout} style={dangerButtonStyle}>
          Se déconnecter
        </button>
      </div>

              <div style={infoStyle}>
          <strong>👤 Opérateur connecté :</strong> {operateurNom} ({operateurId})<br/>
          <strong>📅 Date :</strong> {new Date().toLocaleDateString('fr-FR')}<br/>
          <strong>⏰ Heure :</strong> {new Date().toLocaleTimeString('fr-FR')}<br/>
          <strong>⏱️ Saisie temps de travail</strong>
          {chronometreActif && (
            <div style={{ 
              marginTop: '10px', 
              padding: '8px', 
              backgroundColor: '#fff3cd', 
              borderRadius: '4px',
              border: '1px solid #ffeaa7',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              ⏱️ Chronomètre : {String(chronometre.minutes).padStart(2, '0')}:{String(chronometre.secondes).padStart(2, '0')}
            </div>
          )}
        </div>

      {error && <div style={errorStyle}>❌ {error}</div>}
      {success && <div style={successStyle}>✅ {success}</div>}

      {/* Affichage du dernier LT */}
      {dernierLT && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #2196f3',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>📋 Dernier LT travaillé :</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div><strong>Code LT :</strong> {dernierLT.codeLanctImprod}</div>
            <div><strong>Phase :</strong> {dernierLT.phase || '-'}</div>
            <div><strong>Temps :</strong> {dernierLT.varNumUtil8 || 0}min {dernierLT.varNumUtil9 || 0}sec</div>
            <div><strong>Date :</strong> {dernierLT.dateTravail ? new Date(dernierLT.dateTravail).toLocaleDateString('fr-FR') : '-'}</div>
          </div>
        </div>
      )}

      {/* Affichage du temps total sur le lancement actuel désactivé */}
      {false && formData.codeLancement && (
        <div></div>
      )}

              <form style={formStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Code Lancement :</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              name="codeLancement"
              value={formData.codeLancement}
              onChange={handleInputChange}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Code LT"
              required
            />
            <button
              type="button"
              onClick={() => recupererLtcData(formData.codeLancement)}
              disabled={loadingLtc || !formData.codeLancement}
              style={{
                ...primaryButtonStyle,
                padding: '12px 16px',
                opacity: (loadingLtc || !formData.codeLancement) ? 0.7 : 1,
                cursor: (loadingLtc || !formData.codeLancement) ? 'not-allowed' : 'pointer'
              }}
            >
              {loadingLtc ? '🔄' : '🔍'}
            </button>
          </div>
        </div>

        {/* Affichage des données LTC récupérées */}
        {ltcData && (
          <div style={{
            padding: '15px',
            backgroundColor: '#e8f5e8',
            borderRadius: '8px',
            border: '1px solid #4caf50',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>📋 Informations LT récupérées :</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div><strong>Code LT :</strong> {formData.codeLancement}</div>
              <div><strong>Phase :</strong> {ltcData.phase || '-'}</div>
              <div><strong>Code Rubrique :</strong> {ltcData.codeRubrique || '-'}</div>
            </div>
          </div>
        )}

        {/* Affichage du LT en pause */}
        {etatTravail === 'en_pause' && ltEnPause && (
          <div style={{
            padding: '15px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
            border: '1px solid #ffeaa7',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>⏸️ LT en pause :</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div><strong>Code LT :</strong> {ltEnPause.codeLancement}</div>
              <div><strong>Phase :</strong> {ltEnPause.phase || '-'}</div>
              <div><strong>Temps écoulé :</strong> {ltEnPause.chronometre.minutes}:{String(ltEnPause.chronometre.secondes).padStart(2, '0')}</div>
            </div>
          </div>
        )}





        {/* Boutons de contrôle du travail */}
        {ltcData && (
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'center',
            marginTop: '20px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            {etatTravail === 'en_attente' && (
              <button
                type="button"
                onClick={demarrerTravail}
                disabled={loading}
                style={{
                  ...primaryButtonStyle,
                  backgroundColor: '#28a745',
                  fontSize: '18px',
                  padding: '15px 30px',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Démarrage...' : '🚀 Démarrer le Travail'}
              </button>
            )}
            
            {etatTravail === 'en_cours' && (
              <>
                <button
                  type="button"
                  onClick={mettreEnPause}
                  style={{
                    ...primaryButtonStyle,
                    backgroundColor: '#ffc107',
                    color: '#212529',
                    fontSize: '18px',
                    padding: '15px 30px'
                  }}
                >
                  ⏸️ Mettre en Pause
                </button>
                <button
                  type="button"
                  onClick={annulerTravail}
                  style={{
                    ...primaryButtonStyle,
                    backgroundColor: '#dc3545',
                    fontSize: '18px',
                    padding: '15px 30px'
                  }}
                >
                  ❌ Annuler
                </button>
              </>
            )}
            
            {etatTravail === 'en_pause' && (
              <>
                <button
                  type="button"
                  onClick={reprendreTravail}
                  style={{
                    ...primaryButtonStyle,
                    backgroundColor: '#17a2b8',
                    fontSize: '18px',
                    padding: '15px 30px'
                  }}
                >
                  ▶️ Reprendre LT en cours
                </button>
                <button
                  type="button"
                  onClick={commencerNouveauLt}
                  style={{
                    ...primaryButtonStyle,
                    backgroundColor: '#28a745',
                    fontSize: '18px',
                    padding: '15px 30px'
                  }}
                >
                  🆕 Nouveau LT
                </button>
                <button
                  type="button"
                  onClick={annulerTravail}
                  style={{
                    ...primaryButtonStyle,
                    backgroundColor: '#dc3545',
                    fontSize: '18px',
                    padding: '15px 30px'
                  }}
                >
                  ❌ Annuler
                </button>
              </>
            )}
          </div>
        )}

        {/* Bouton de finalisation du travail */}
        {etatTravail === 'en_cours' && (
          <button
            type="button"
            onClick={terminerTravail}
            style={{
              ...primaryButtonStyle,
              marginTop: '20px',
              fontSize: '18px',
              padding: '15px 30px',
              backgroundColor: '#6f42c1'
            }}
          >
            ✅ Terminer le Travail
          </button>
        )}
      </form>

      {/* Historique des LT de l'opérateur */}
      {historiqueOperateur.length > 0 && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
            📊 Historique de vos LT
          </h3>
          
          {loadingHistorique ? (
            <p style={{ textAlign: 'center', color: '#666' }}>Chargement...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 700 }}>
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
                  <div style={{ flex: '1 0 120px' }}>Phase</div>
                  <div style={{ flex: '0 0 140px' }}>Début (heure)</div>
                  <div style={{ flex: '0 0 140px' }}>Fin (heure)</div>
                </div>
                {(() => {
                  const sorted = [...historiqueOperateur].sort((a, b) => new Date(b.dateTravail) - new Date(a.dateTravail));
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
                        <div style={{ flex: '1 0 140px', fontWeight: index === 0 ? 'bold' : 'normal', color: '#2c3e50' }}>{enreg.codeLanctImprod}</div>
                        <div style={{ flex: '1 0 120px' }}>{enreg.phase || '-'}</div>
                        <div style={{ flex: '0 0 140px', color: '#2c3e50' }}>{debutHeure}</div>
                        <div style={{ flex: '0 0 140px', color: '#2c3e50' }}>{finHeure}</div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
          
          {/* Statistiques résumées */}
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '15px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>
                {new Set(historiqueOperateur.map(enreg => enreg.codeLanctImprod)).size}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>LT différents</div>
            </div>
            {false && (
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffc107' }}>
                  {historiqueOperateur.length}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Sessions totales</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperateurInterface; 