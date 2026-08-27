"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSavedCafes } from "@/components/providers/SavedCafesProvider";
import { useTriedCafes } from "@/components/providers/TriedCafesProvider";

export function FloatingNav() {
  const pathname = usePathname();
  const { count: wishlistCount } = useSavedCafes();
  const { count: tastedCount } = useTriedCafes();

  const onWishlist = pathname === "/list";
  const onTasted = pathname === "/tasted";
  const onMap = pathname === "/map";

  return (
    <nav className="floating-nav" aria-label="Quick navigation">
      <Link href="/list" className={`floating-nav-item${onWishlist ? " floating-nav-item--active" : ""}`}>
        Wish List{wishlistCount > 0 ? ` · ${wishlistCount}` : ""}
      </Link>
      <span className="floating-nav-sep" aria-hidden="true" />
      <Link href="/tasted" className={`floating-nav-item${onTasted ? " floating-nav-item--active" : ""}`}>
        Tasted{tastedCount > 0 ? ` · ${tastedCount}` : ""}
      </Link>
      <span className="floating-nav-sep" aria-hidden="true" />
      <Link href="/map" className={`floating-nav-item${onMap ? " floating-nav-item--active" : ""}`}>
        Map
      </Link>
    </nav>
  );
}
