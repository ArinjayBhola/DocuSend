import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Link2, 
  BarChart3, 
  Settings, 
  Users, 
  Briefcase, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  Bell,
  Wallet,
  Search,
  User,
  Video,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../notifications/NotificationBell';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Leads', path: '/leads' },
  { icon: Briefcase, label: 'Deals', path: '/deals' },
  { icon: BarChart3, label: 'Engagement', path: '/engagement' },
  { icon: Zap, label: 'Live', path: '/live' },
  { icon: Video, label: 'Sessions', path: '/sessions' },
];

const secondaryNavItems = [
  { icon: Wallet, label: 'Billing', path: '/billing' },
  { icon: Bell, label: 'Notifications', path: '/notifications/settings' },
  { icon: Settings, label: 'Settings', path: '/workspaces' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside 
      className={`sticky top-0 h-screen bg-white border-r border-neutral-200 transition-all duration-300 flex flex-col z-50 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Logo Section */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-neutral-100 flex-shrink-0">
        <div className="flex items-center">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-600/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="ml-3 font-black text-xl tracking-tight text-neutral-900">
              DocuSend
            </span>
          )}
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1">
            <NotificationBell />
          </div>
        )}
      </div>

      {/* Main Nav */}
      <div className="flex-1 overflow-y-auto py-8 px-4 space-y-1.5 custom-scrollbar">
        {!collapsed && (
          <p className="px-4 mb-3 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
            Overview
          </p>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-brand-50 text-brand-700 shadow-sm shadow-brand-600/5' 
                : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}
            `}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110`} />
            {!collapsed && <span className="ml-3.5 font-bold text-[13px] tracking-tight">{item.label}</span>}
          </NavLink>
        ))}

        <div className="my-8 border-t border-neutral-100 mx-4" />

        {!collapsed && (
          <p className="px-4 mb-3 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
            Management
          </p>
        )}
        {secondaryNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-brand-50 text-brand-700 shadow-sm shadow-brand-600/5' 
                : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}
            `}
          >
            <item.icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
            {!collapsed && <span className="ml-3.5 font-bold text-[13px] tracking-tight">{item.label}</span>}
          </NavLink>
        ))}
      </div>

      {/* User & Footer section */}
      <div className="p-4 border-t border-neutral-100 bg-neutral-50/30">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-3 mb-4'} transition-all`}>
          <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden group hover:border-brand-300 transition-all cursor-pointer">
            <User className="w-5 h-5 text-neutral-400 group-hover:text-brand-600 transition-colors" />
          </div>
          {!collapsed && (
            <div className="ml-3 min-w-0">
              <p className="text-[13px] font-bold text-neutral-900 truncate tracking-tight">{user?.name || 'User Account'}</p>
              <p className="text-[11px] font-semibold text-neutral-400 truncate tracking-tight">{user?.email || 'admin@docusend.sh'}</p>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'px-4'} py-3 rounded-xl text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-bold text-[13px] group`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 transition-transform group-hover:-translate-x-1" />
            {!collapsed && <span className="ml-3.5">Sign Out</span>}
          </button>
          
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'px-4'} py-3 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100/50 transition-all duration-200 font-bold text-[13px]`}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {!collapsed && <span className="ml-3.5">Minimize Sidebar</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
