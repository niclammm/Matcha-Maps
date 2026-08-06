"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSavedCafes } from "@/components/providers/SavedCafesProvider";

export function FloatingNav() {
  const pathname = usePathname();
  const { count } = useSavedCafes();

  const onList = pathname === "/list";
  const onMap = pathname === "/map";

  return (
    <nav className="floating-nav" aria-label="Quick navigation">
      <Link href="/list" className={`floating-nav-item${onList ? " floating-nav-item--active" : ""}`}>
        My List{count > 0 ? ` · ${count}` : ""}
      </Link>
      <span className="floating-nav-sep" aria-hidden="true" />
      <Link href="/map" className={`floating-nav-item${onMap ? " floating-nav-item--active" : ""}`}>
        Full Map
      </Link>
      <span className="floating-nav-sep" aria-hidden="true" />
      <Link href="/map" className="floating-nav-item">
        Search
      </Link>
    </nav>
  );
}
