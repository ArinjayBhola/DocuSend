import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-neutral-50 selection:bg-brand-100 selection:text-brand-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12 w-full max-w-7xl mx-auto transition-all duration-300 custom-scrollbar">
          <Outlet />
          
          {/* Minimal Footer inside main to scroll with content */}
          <footer className="mt-20 py-10 border-t border-neutral-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400 font-bold uppercase tracking-widest">
              <p>© 2026 DocuSend Inc. All rights reserved.</p>
              <div className="flex items-center space-x-8">
                <a href="#" className="hover:text-brand-600 transition-colors">Privacy</a>
                <a href="#" className="hover:text-brand-600 transition-colors">Terms</a>
                <a href="#" className="hover:text-brand-600 transition-colors">Support</a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
