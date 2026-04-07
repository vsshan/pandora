import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CompanyProfile from './pages/CompanyProfile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/company/:id" element={<CompanyProfile />} />
      </Routes>
    </BrowserRouter>
  );
}
