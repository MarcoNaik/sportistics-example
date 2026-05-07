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

export default function App() {
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
