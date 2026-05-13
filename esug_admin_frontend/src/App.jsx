import { Routes, Route, Navigate } from 'react-router-dom';
import Admin from './pages/Admin';

// Admin app — only one route: the admin panel itself.
// The Admin component handles its own lock screen (secret key entry).
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
