import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SkeletonLoader from './SkeletonLoader';

export default function ProtectedRoute({ children }) {
  const { student, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-off flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <SkeletonLoader lines={4} />
        </div>
      </div>
    );
  }

  if (!student) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
