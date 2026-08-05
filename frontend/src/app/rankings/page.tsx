import { Nav } from "@/components/layout/Nav";
import { Topbar } from "@/components/layout/Topbar";

export default function RankingsPage() {
  return (
    <>
      <Topbar />
      <main className="frame placeholder-page">
        <Nav active="rankings" />
        <h1 className="headline">Rankings</h1>
        <p className="lede">Category leaderboards coming soon — best ceremonial, best latte, best value, and more.</p>
      </main>
    </>
  );
}
