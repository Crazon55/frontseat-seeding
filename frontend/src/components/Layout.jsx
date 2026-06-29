import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { LayoutDashboard, Inbox, ListTodo, KanbanSquare, Users, Layers, LogOut, FileText, Plus, Building2 } from "lucide-react";
import { PreviewLauncher } from "./PreviewMode";

const NavItem = ({ to, icon: Icon, label, testId }) => {
  const location = useLocation();
  const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
  return (
    <Link
      to={to}
      data-testid={testId}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
        active ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
      }`}
    >
      <Icon size={16} strokeWidth={1.5} />
      <span>{label}</span>
    </Link>
  );
};

export const Layout = ({ children }) => {
  const { user, team, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  return (
    <div className="min-h-screen flex bg-[#09090b] text-zinc-100">
      <aside className="w-60 shrink-0 border-r border-zinc-800/80 bg-[#09090b] flex flex-col p-4 sticky top-0 h-screen">
        <div className="px-2 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-white text-black grid place-items-center font-semibold" style={{fontFamily: "'Outfit', sans-serif"}}>F</div>
            <div>
              <div className="text-sm font-semibold text-white tracking-tight" style={{fontFamily: "'Outfit', sans-serif"}}>Frontseat</div>
              <div className="text-[11px] text-zinc-500">Seeding ops</div>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {role === "admin" && (
            <>
              <NavItem to="/" icon={LayoutDashboard} label="Overview" testId="nav-overview" />
              <NavItem to="/approvals" icon={Inbox} label="Approval Queue" testId="nav-approvals" />
              <NavItem to="/submit" icon={Plus} label="Create Brief" testId="nav-admin-submit" />
              <NavItem to="/deals" icon={ListTodo} label="All Deals" testId="nav-deals" />
              <NavItem to="/admin/teams" icon={Building2} label="Teamwise Deals" testId="nav-teamwise" />
              <NavItem to="/fulfillment" icon={KanbanSquare} label="Fulfillment Board" testId="nav-fulfillment" />
              <div className="mt-3 mb-1 px-3 text-[10px] uppercase tracking-wider text-zinc-600">Admin</div>
              <NavItem to="/admin/users" icon={Users} label="Users & Roles" testId="nav-users" />
              <NavItem to="/admin/pages" icon={Layers} label="Monetisable Pages" testId="nav-pages" />
              <PreviewLauncher />
            </>
          )}
          {role === "bd" && (
            <>
              <NavItem to="/" icon={LayoutDashboard} label="My Dashboard" testId="nav-bd-dashboard" />
              <NavItem to="/submit" icon={Plus} label="Submit Brief" testId="nav-submit" />
              <NavItem to="/deals" icon={FileText} label="My Briefs & Deals" testId="nav-bd-deals" />
            </>
          )}
          {role === "fulfillment" && (
            <>
              <NavItem to="/" icon={KanbanSquare} label="Fulfillment Board" testId="nav-ff-board" />
              <NavItem to="/deals" icon={ListTodo} label="All Approved Deals" testId="nav-ff-deals" />
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-zinc-800/80 pt-4 px-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 grid place-items-center text-xs font-semibold text-white">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-white truncate" data-testid="user-name">{user?.name}</div>
              <div className="text-[10px] text-zinc-500 truncate" data-testid="user-role">
                {role}{team ? ` · ${team.team_name}` : ""}
              </div>
            </div>
          </div>
          <button
            data-testid="logout-button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-colors"
          >
            <LogOut size={14} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="p-8 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
};
