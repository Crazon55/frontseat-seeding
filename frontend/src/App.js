import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AuthCallback } from "@/components/AuthCallback";
import { Layout } from "@/components/Layout";
import Login from "@/pages/Login";
import PendingApproval from "@/pages/PendingApproval";
import AdminOverview from "@/pages/AdminOverview";
import AdminApprovalQueue from "@/pages/AdminApprovalQueue";
import AdminUsers from "@/pages/AdminUsers";
import AdminPages from "@/pages/AdminPages";
import BDDashboard from "@/pages/BDDashboard";
import SubmitBrief from "@/pages/SubmitBrief";
import DealDetail from "@/pages/DealDetail";
import FulfillmentDashboard from "@/pages/FulfillmentDashboard";
import AllDeals from "@/pages/AllDeals";
import TeamwiseDeals from "@/pages/TeamwiseDeals";
import { PreviewBanner } from "@/components/PreviewMode";

const Loading = () => (
  <div className="min-h-screen grid place-items-center bg-[#09090b]">
    <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
  </div>
);

const Protected = ({ children, allow }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "pending") return <Navigate to="/pending" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
};

const RoleHome = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "pending") return <Navigate to="/pending" replace />;
  if (user.role === "admin") return <Layout><AdminOverview /></Layout>;
  if (user.role === "bd") return <Layout><BDDashboard /></Layout>;
  if (user.role === "fulfillment") return <Layout><FulfillmentDashboard /></Layout>;
  return <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const location = useLocation();
  // Detect OAuth callback synchronously during render
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <>
      <PreviewBanner />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/pending" element={<PendingApproval />} />

        <Route path="/" element={<RoleHome />} />

        <Route path="/approvals" element={<Protected allow={["admin"]}><AdminApprovalQueue /></Protected>} />
        <Route path="/admin/users" element={<Protected allow={["admin"]}><AdminUsers /></Protected>} />
        <Route path="/admin/pages" element={<Protected allow={["admin"]}><AdminPages /></Protected>} />
        <Route path="/fulfillment" element={<Protected allow={["admin","fulfillment"]}><FulfillmentDashboard /></Protected>} />

        <Route path="/submit" element={<Protected allow={["bd","admin"]}><SubmitBrief /></Protected>} />
        <Route path="/admin/teams" element={<Protected allow={["admin"]}><TeamwiseDeals /></Protected>} />
        <Route path="/deals" element={<Protected allow={["admin","bd","fulfillment"]}><AllDeals /></Protected>} />
        <Route path="/deals/:dealId" element={<Protected allow={["admin","bd","fulfillment"]}><DealDetail /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
