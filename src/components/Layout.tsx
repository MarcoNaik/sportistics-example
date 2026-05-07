import { NavLink, Outlet } from "react-router";
import clsx from "clsx";
import { Users, Calendar, BarChart3, Volleyball } from "lucide-react";
import AgentPanel from "./AgentPanel";

const NAV = [
  { to: "/roster", label: "Team", icon: Users },
  { to: "/matches", label: "Matches", icon: Calendar },
  { to: "/stats", label: "Stats", icon: BarChart3 },
];

export default function Layout() {
  return (
    <div className="min-h-screen text-slate-900">
      <div className="lg:pr-[26rem]">
        <main className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6 md:py-6">
          <div className="rounded-3xl bg-white shadow-sm shadow-slate-200/60 overflow-hidden min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] flex flex-col">
            <header className="flex items-center justify-between border-b border-slate-200 px-4 md:px-6 h-14 shrink-0">
              <NavLink
                to="/dashboard"
                className="inline-flex items-center gap-2 text-brand font-semibold tracking-tight text-lg rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <Volleyball className="size-5" />
                Sportistics
              </NavLink>
              <nav className="flex items-center gap-1">
                {NAV.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      clsx(
                        "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                        isActive ? "bg-brand-50 text-brand" : "text-slate-600 hover:bg-slate-50",
                      )
                    }
                  >
                    <Icon className="size-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </NavLink>
                ))}
              </nav>
            </header>
            <div className="flex-1 p-4 md:p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <AgentPanel />
    </div>
  );
}
