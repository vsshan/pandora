import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CompanyProfile from './pages/CompanyProfile';
import ChatWidget from './components/ChatWidget';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/company/:id" element={<CompanyProfile />} />
      </Routes>
      <ChatWidget />
    </BrowserRouter>
  );
}
