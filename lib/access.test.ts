import { describe, expect, it } from "vitest";
import { canEdit, canManageShares, canRead, type AccessLevel } from "./access";

describe("document access helpers", () => {
  const cases: Array<{
    access: AccessLevel;
    read: boolean;
    edit: boolean;
    manage: boolean;
  }> = [
    { access: "owner", read: true, edit: true, manage: true },
    { access: "editor", read: true, edit: true, manage: false },
    { access: "viewer", read: true, edit: false, manage: false },
    { access: null, read: false, edit: false, manage: false },
  ];

  for (const c of cases) {
    it(`maps ${String(c.access)} correctly`, () => {
      expect(canRead(c.access)).toBe(c.read);
      expect(canEdit(c.access)).toBe(c.edit);
      expect(canManageShares(c.access)).toBe(c.manage);
    });
  }
});
