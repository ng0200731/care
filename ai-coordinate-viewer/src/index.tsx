import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import MasterFiles from './pages/MasterFiles';
import Projects from './pages/Projects';
import ProjectReport from './pages/ProjectReport';
import ProjectDetail from './pages/ProjectDetail';
import Suppliers from './pages/Suppliers';
import Orders from './pages/Orders';
import CanvasOnly from './components/masterfiles/CanvasOnly';

import CreateCustomer from './components/customers/CreateCustomer';
import EditCustomer from './components/customers/EditCustomer';
import Customers from './pages/Customers';
import SelectCustomer from './pages/SelectCustomer';
import CreateMethod from './pages/CreateMethod';
import MasterFilesManagement from './pages/MasterFilesManagement';
import Settings from './pages/Settings';

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
        <Route path="/master-files-management" element={
          <Layout>
            <MasterFilesManagement />
          </Layout>
        } />
        <Route path="/projects" element={
          <Layout>
            <Projects />
          </Layout>
        } />
        <Route path="/projects/report" element={
          <Layout>
            <ProjectReport />
          </Layout>
        } />
        <Route path="/projects/:slug" element={
          <Layout>
            <ProjectDetail />
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
        <Route path="/settings" element={
          <Layout>
            <Settings />
          </Layout>
        } />

        {/* Coordinate viewer - now shows Create Method page */}
        <Route path="/coordinate-viewer" element={
          <Layout>
            <CreateMethod />
          </Layout>
        } />

        {/* Create Zero - canvas-only mode for web creation */}
        <Route path="/create_zero" element={
          <Layout>
            <CanvasOnly />
          </Layout>
        } />
      </Routes>
    </Router>
  </React.StrictMode>
);

reportWebVitals();






