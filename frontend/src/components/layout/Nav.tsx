"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";

type NavProps = {
  active?: "map" | "wishlist" | "tasted";
};

export function Nav({ active }: NavProps) {
  const [open, setOpen] = useState(false);

  const closeMenu = () => {
    setOpen(false);
  };

  return (
    <nav className="nav">
      <Link href="/" className="brand" onClick={closeMenu}>
        <Logo size="mark" className="brand-mark" />
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
        <Link href="/map" className={active === "map" ? "active" : undefined} onClick={closeMenu}>
          Map
        </Link>
        <Link href="/list" className={active === "wishlist" ? "active" : undefined} onClick={closeMenu}>
          Wish List
        </Link>
        <Link href="/tasted" className={active === "tasted" ? "active" : undefined} onClick={closeMenu}>
          Tasted
        </Link>
      </div>

      <Link href="/map" className="btn btn-primary nav-cta" onClick={closeMenu}>
        Explore Map
      </Link>
    </nav>
  );
}
