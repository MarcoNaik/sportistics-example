import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Roster from "./pages/Roster";
import MatchesList from "./pages/MatchesList";
import MatchDetail from "./pages/MatchDetail";
import MatchOverview from "./pages/MatchOverview";
import MatchCallup from "./pages/MatchCallup";
import MatchLive from "./pages/MatchLive";
import MatchStats from "./pages/MatchStats";
import Training from "./pages/Training";
import Stats from "./pages/Stats";
import { useStore } from "./store/useStore";

export default function App() {
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);

  useEffect(() => {
    useStore.getState().loadAll();
  }, []);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand" />
          <p className="text-sm font-medium text-slate-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Could not load data</h2>
          <p className="mt-2 text-sm text-rose-600">{error}</p>
          <button
            type="button"
            onClick={() => useStore.getState().loadAll()}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Landing />} />
        <Route element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="roster" element={<Roster />} />
          <Route path="matches" element={<MatchesList />} />
          <Route path="matches/:matchId" element={<MatchDetail />}>
            <Route index element={<MatchOverview />} />
            <Route path="callup" element={<MatchCallup />} />
            <Route path="live" element={<MatchLive />} />
            <Route path="stats" element={<MatchStats />} />
          </Route>
          <Route path="training" element={<Training />} />
          <Route path="stats" element={<Stats />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
