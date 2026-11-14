import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { Navbar } from "@/components/layout/Navbar";

describe("Navbar layout component", () => {
  it("renders Kept brand title and commitment ledger tagline", () => {
    const html = renderToString(<Navbar currentPath="/" />);
    expect(html).toContain("Kept");
    expect(html).toContain("Commitment Ledger");
  });

  it("renders all navigation links", () => {
    const html = renderToString(<Navbar currentPath="/" />);
    expect(html).toContain("Ledger");
    expect(html).toContain("Daily Review");
    expect(html).toContain("History");
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/review"');
    expect(html).toContain('href="/history"');
  });

  it("highlights the active route", () => {
    const html = renderToString(<Navbar currentPath="/review" />);
    // /review should have active styling
    expect(html).toContain("Daily Review");
  });

  it("renders sync status pill and new commitment button", () => {
    const html = renderToString(<Navbar currentPath="/" />);
    expect(html).toContain("Local-First");
    expect(html).toContain("New Commitment");
  });
});
