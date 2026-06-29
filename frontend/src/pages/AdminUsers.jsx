import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDate } from "../lib/constants";
import { StatusBadge } from "../components/StatusBadge";

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);

  const load = async () => {
    const [{ data: u }, { data: t }] = await Promise.all([api.get("/users"), api.get("/teams")]);
    setUsers(u);
    setTeams(t);
  };

  useEffect(() => { load(); }, []);

  const assign = async (uid, payload) => {
    await api.put(`/users/${uid}/assign`, payload);
    await load();
  };

  return (
    <div data-testid="admin-users" className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Users & Roles</h1>
        <p className="text-sm text-zinc-500 mt-1">Assign roles, teams, and access for every account.</p>
      </header>

      <div className="bg-[#121212] border border-zinc-800/80 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60">
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Team</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} data-testid={`user-row-${u.user_id}`} className="border-t border-zinc-800/60 hover:bg-zinc-900/30 transition-colors">
                <td className="px-5 py-4">
                  <div className="text-white font-medium">{u.name}</div>
                  <div className="text-[11px] text-zinc-500">{formatDate(u.created_at)}</div>
                </td>
                <td className="px-5 py-4 text-zinc-400">{u.email}</td>
                <td className="px-5 py-4">
                  <select
                    data-testid={`role-select-${u.user_id}`}
                    value={u.role}
                    onChange={(e) => {
                      const r = e.target.value;
                      assign(u.user_id, { role: r, business_team_id: r === "bd" ? (u.business_team_id || teams[0]?.team_id) : null, active: u.active !== false });
                    }}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                  >
                    <option value="pending">pending</option>
                    <option value="admin">admin</option>
                    <option value="bd">bd</option>
                    <option value="fulfillment">fulfillment</option>
                  </select>
                </td>
                <td className="px-5 py-4">
                  {u.role === "bd" ? (
                    <select
                      data-testid={`team-select-${u.user_id}`}
                      value={u.business_team_id || ""}
                      onChange={(e) => assign(u.user_id, { role: "bd", business_team_id: e.target.value, active: u.active !== false })}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                    >
                      {teams.map((t) => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
                    </select>
                  ) : <span className="text-xs text-zinc-600">—</span>}
                </td>
                <td className="px-5 py-4"><StatusBadge status={u.active === false ? "Inactive" : "Active"} /></td>
                <td className="px-5 py-4 text-right">
                  <button
                    data-testid={`toggle-active-${u.user_id}`}
                    onClick={() => assign(u.user_id, { role: u.role, business_team_id: u.business_team_id, active: !(u.active !== false) })}
                    className="text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    {u.active === false ? "Activate" : "Deactivate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
