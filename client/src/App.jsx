import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import RunHistory from './pages/RunHistory';
import RunDetail from './pages/RunDetail';
import TestDetail from './pages/TestDetail';
import Registry from './pages/Registry';
import RegionRegistry from './pages/RegionRegistry';
import TestCaseDetail from './pages/TestCaseDetail';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/"                     element={<Home />} />
            <Route path="/runs"                 element={<RunHistory />} />
            <Route path="/runs/:id"             element={<RunDetail />} />
            <Route path="/tests/:id"            element={<TestDetail />} />
            <Route path="/registry"             element={<Registry />} />
            <Route path="/registry/:region"     element={<RegionRegistry />} />
            <Route path="/registry/cases/:id"   element={<TestCaseDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
