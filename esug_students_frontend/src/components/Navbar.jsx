import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../utils/avatar';
import Icon from './Icons';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b-2 border-surface-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={student ? '/dashboard' : '/'} className="flex items-center gap-2">
          <div className="w-9 h-9 bg-duo-blue rounded-xl flex items-center justify-center">
            <Icon.AcademicCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-black text-lg text-text-dark hidden sm:block">
            Midweek Maze
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/leaderboard" active={isActive('/leaderboard')} icon={<Icon.Trophy className="w-4 h-4" />} label="Leaderboard" />

          {student ? (
            <>
              <NavLink to="/challenge" active={isActive('/challenge')} icon={<Icon.Lightning className="w-4 h-4" />} label="Challenge" />
              <NavLink to="/dashboard" active={isActive('/dashboard')} icon={<Icon.Home className="w-4 h-4" />} label="Home" />

              {/* Avatar + dropdown */}
              <div className="relative group ml-1">
                <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl hover:bg-surface-off transition-colors">
                  <img
                    src={getAvatarUrl(student.avatar_seed, 'adventurer', 32)}
                    alt={student.display_name}
                    className="w-8 h-8 rounded-xl border-2 border-surface-border"
                  />
                  <span className="font-display font-bold text-sm text-text-dark hidden sm:block max-w-[80px] truncate">
                    {student.display_name}
                  </span>
                </button>

                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border-2 border-surface-border shadow-card-hover
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-body font-semibold text-text-dark hover:bg-surface-off rounded-t-2xl transition-colors"
                  >
                    <Icon.User className="w-4 h-4 text-text-mid" />
                    My Profile
                  </Link>
                  <div className="border-t border-surface-border" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-body font-semibold text-duo-red hover:bg-red-50 rounded-b-2xl transition-colors"
                  >
                    <Icon.Logout className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-display font-bold text-sm text-text-mid hover:text-duo-blue px-3 py-2 rounded-xl transition-colors"
              >
                Log In
              </Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">
                Join Now
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 font-display font-bold text-sm px-3 py-2 rounded-xl transition-colors ${
        active
          ? 'bg-duo-blue/10 text-duo-blue'
          : 'text-text-mid hover:text-text-dark hover:bg-surface-off'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
