import { LiveMap } from "./components/LiveMap/LiveMap.js";
import { useLiveAssets } from "./lib/hooks/useLiveAssets.js";

export function App() {
  const { assets, connected, lastUpdatedAt } = useLiveAssets();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Dominion Dynamics</h1>
        <div className="app-status">
          <span className={connected ? "status-dot connected" : "status-dot"} />
          <span>{connected ? "Live" : "Reconnecting…"}</span>
          <span>{assets.length} assets</span>
          {lastUpdatedAt !== null && (
            <span className="app-status-muted">
              updated {new Date(lastUpdatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>
      <main className="app-main">
        <LiveMap assets={assets} />
      </main>
    </div>
  );
}
