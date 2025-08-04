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
import CreateMasterFile from './components/masterfiles/CreateMasterFile';
import CreateCustomer from './components/customers/CreateCustomer';
import EditCustomer from './components/customers/EditCustomer';
import Customers from './pages/Customers';
import SelectCustomer from './pages/SelectCustomer';
import CreateMethod from './pages/CreateMethod';
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
        <Route path="/master-files/create" element={
          <Layout>
            <CreateMasterFile />
          </Layout>
        } />
        <Route path="/customers" element={
          <Layout>
            <Customers />
          </Layout>
        } />
        <Route path="/customers/create" element={
          <Layout>
            <CreateCustomer />
          </Layout>
        } />
        <Route path="/customers/edit/:id" element={
          <Layout>
            <EditCustomer />
          </Layout>
        } />
        <Route path="/master-files/select-customer" element={
          <Layout>
            <SelectCustomer />
          </Layout>
        } />
        <Route path="/master-files/create-method" element={
          <Layout>
            <CreateMethod />
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

        {/* Coordinate viewer - with layout to keep left menu */}
        <Route path="/coordinate-viewer" element={
          <Layout>
            <CoordinateViewer />
          </Layout>
        } />
      </Routes>
    </Router>
  </React.StrictMode>
);

reportWebVitals();






