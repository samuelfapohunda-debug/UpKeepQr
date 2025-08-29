import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setup/:token" element={<Onboarding />} />
          <Route path="/agent" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
