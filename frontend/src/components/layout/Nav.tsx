"use client";

import Link from "next/link";
import { useState } from "react";

type NavProps = {
  active?: "cafes" | "rankings" | "reviews" | "list";
};

export function Nav({ active }: NavProps) {
  const [open, setOpen] = useState(false);

  const closeMenu = () => {
    setOpen(false);
  };

  return (
    <nav className="nav">
      <Link href="/" className="brand" onClick={closeMenu}>
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">Matcha Maps</span>
      </Link>

      <button
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="navLinks"
        aria-label="Toggle menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`nav-links${open ? " open" : ""}`} id="navLinks">
        <Link href="/map" className={active === "cafes" ? "active" : undefined} onClick={closeMenu}>
          Cafes
        </Link>
        <Link href="/list" className={active === "list" ? "active" : undefined} onClick={closeMenu}>
          My List
        </Link>
        <Link href="/rankings" className={active === "rankings" ? "active" : undefined} onClick={closeMenu}>
          Rankings
        </Link>
        <Link href="/reviews" className={active === "reviews" ? "active" : undefined} onClick={closeMenu}>
          Reviews
        </Link>
      </div>

      <Link href="/map" className="btn btn-primary nav-cta" onClick={closeMenu}>
        Explore Map
      </Link>
    </nav>
  );
}
