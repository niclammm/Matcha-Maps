import { HeroStage } from "@/components/home/HeroStage";
import { TopRankedStack } from "@/components/home/TopRankedStack";
import { Nav } from "@/components/layout/Nav";
import { Topbar } from "@/components/layout/Topbar";
import { ShapeGridBackground } from "@/components/effects/ShapeGridBackground";
import { getTopRanked } from "@/data/cafes";

export default function HomePage() {
  const topRanked = getTopRanked(3);

  return (
    <>
      <Topbar />
      <main className="frame frame-home">
        <ShapeGridBackground />
        <Nav />

        <div className="hero-home">
          <div className="hero-copy">
            <h1 className="headline">
              Singapore&apos;s
              <br />
              <span className="headline-dim">Best Matcha,</span>
              <br />
              Found.
            </h1>
            <p className="lede">
              Singapore's best specialty matcha, 
              tasted, rated, and mapped 
              so you never waste a sip.
            </p>
            <div className="stats">
              <span>★ 4.8 average rating</span>
              <span className="stat-sep" aria-hidden="true" />
              <span>120+ cafes reviewed</span>
            </div>
          </div>

          <HeroStage />

          <TopRankedStack shops={topRanked} />
        </div>
      </main>
    </>
  );
}
