import { Nav } from "@/components/layout/Nav";
import { Topbar } from "@/components/layout/Topbar";

export default function ReviewsPage() {
  return (
    <>
      <Topbar />
      <main className="frame placeholder-page">
        <Nav active="reviews" />
        <h1 className="headline">Reviews</h1>
        <p className="lede">Community reviews and editorial picks coming soon.</p>
      </main>
    </>
  );
}
