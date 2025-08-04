import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import MasterFiles from './pages/MasterFiles';
import Suppliers from './pages/Suppliers';
import Orders from './pages/Orders';
import CoordinateViewer from './components/masterfiles/CoordinateViewer';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        {/* Main application with layout */}
        <Route path="/" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        <Route path="/master-files" element={
          <Layout>
            <MasterFiles />
          </Layout>
        } />
        <Route path="/suppliers" element={
          <Layout>
            <Suppliers />
          </Layout>
        } />
        <Route path="/orders" element={
          <Layout>
            <Orders />
          </Layout>
        } />

        {/* Coordinate viewer - full screen without layout */}
        <Route path="/coordinate-viewer" element={<CoordinateViewer />} />
      </Routes>
    </Router>
  </React.StrictMode>
);

reportWebVitals();






