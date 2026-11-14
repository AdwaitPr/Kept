import { describe, it, expect } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogCloseButton,
} from "@/components/ui/dialog";

describe("Button UI component", () => {
  it("renders default button with text", () => {
    const html = renderToString(<Button>Click me</Button>);
    expect(html).toContain("Click me");
    expect(html).toContain("bg-slate-900");
    expect(html).toContain("type=\"button\"");
  });

  it("renders button variants correctly", () => {
    const variants = [
      { variant: "secondary" as const, expectedClass: "bg-slate-100" },
      { variant: "destructive" as const, expectedClass: "bg-rose-600" },
      { variant: "outline" as const, expectedClass: "border-slate-300" },
      { variant: "ghost" as const, expectedClass: "hover:bg-slate-100" },
      { variant: "success" as const, expectedClass: "bg-emerald-600" },
      { variant: "warning" as const, expectedClass: "bg-amber-600" },
    ];

    for (const { variant, expectedClass } of variants) {
      const html = renderToString(<Button variant={variant}>Action</Button>);
      expect(html).toContain(expectedClass);
    }
  });

  it("renders button sizes correctly", () => {
    const smHtml = renderToString(<Button size="sm">Small</Button>);
    expect(smHtml).toContain("h-8");

    const lgHtml = renderToString(<Button size="lg">Large</Button>);
    expect(lgHtml).toContain("h-11");

    const iconHtml = renderToString(<Button size="icon">Icon</Button>);
    expect(iconHtml).toContain("w-9");
  });

  it("handles disabled state", () => {
    const html = renderToString(<Button disabled>Disabled</Button>);
    expect(html).toContain("disabled");
  });
});

describe("Badge UI component", () => {
  it("renders default badge", () => {
    const html = renderToString(<Badge>Status</Badge>);
    expect(html).toContain("Status");
    expect(html).toContain("bg-slate-900");
  });

  it("renders overdue, kept, and renegotiated badge variants", () => {
    const overdueHtml = renderToString(<Badge variant="overdue">Overdue</Badge>);
    expect(overdueHtml).toContain("bg-rose-50");
    expect(overdueHtml).toContain("text-rose-700");

    const keptHtml = renderToString(<Badge variant="kept">Kept</Badge>);
    expect(keptHtml).toContain("bg-emerald-50");
    expect(keptHtml).toContain("text-emerald-700");

    const renegHtml = renderToString(<Badge variant="renegotiated">Renegotiated</Badge>);
    expect(renegHtml).toContain("bg-amber-50");
    expect(renegHtml).toContain("text-amber-700");

    const releasedHtml = renderToString(<Badge variant="released">Released</Badge>);
    expect(releasedHtml).toContain("bg-slate-100");
  });
});

describe("Dialog UI component", () => {
  it("renders modal structure when isOpen is true", () => {
    const html = renderToString(
      <Dialog isOpen={true} onClose={() => {}}>
        <DialogCloseButton onClose={() => {}} />
        <DialogHeader>
          <DialogTitle>Modal Title</DialogTitle>
          <DialogDescription>Modal Description</DialogDescription>
        </DialogHeader>
        <p>Modal Body Content</p>
        <DialogFooter>
          <Button>OK</Button>
        </DialogFooter>
      </Dialog>
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("Modal Title");
    expect(html).toContain("Modal Description");
    expect(html).toContain("Modal Body Content");
    expect(html).toContain("OK");
  });

  it("does not render modal markup when isOpen is false", () => {
    const html = renderToString(
      <Dialog isOpen={false} onClose={() => {}}>
        <p>Hidden Content</p>
      </Dialog>
    );

    expect(html).toBe("");
  });
});
