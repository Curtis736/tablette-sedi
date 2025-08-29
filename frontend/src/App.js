import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminPage from './AdminPage';
import OperateurInterface from './OperateurInterface';

const appBg = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  fontFamily: 'Segoe UI, Arial, sans-serif',
};

const navStyle = {
  background: '#2c3e50',
  padding: '18px 0',
  marginBottom: 40,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: '0 2px 8px #0001',
};

const linkStyle = {
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 18,
  margin: '0 24px',
  letterSpacing: 1,
  padding: '6px 16px',
  borderRadius: 6,
  transition: 'background 0.2s',
};

const linkActive = {
  background: '#34495e',
};

function App() {
  return (
    <div style={appBg}>
      <Router>
        <nav style={navStyle}>
          <Link to="/operateur" style={linkStyle}>Opérateur</Link>
          <Link to="/admin" style={linkStyle}>Administration</Link>
        </nav>
        <div style={{ maxWidth: 900, margin: 'auto', padding: 24 }}>
          <Routes>
            <Route path="/operateur" element={<OperateurInterface />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<div style={{textAlign:'center',marginTop:80,fontSize:28,color:'#2c3e50'}}>Bienvenue !<br/>Choisissez votre interface.</div>} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App; 