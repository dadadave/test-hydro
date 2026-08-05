import { pct, getMonthKey, getWeekKey } from "./format";

describe("pct", () => {
  test("calcule un pourcentage arrondi", () => {
    expect(pct(1, 4)).toBe(25);
    expect(pct(2, 3)).toBe(67);
  });
  test("renvoie 0 quand le dénominateur est nul ou négatif", () => {
    expect(pct(5, 0)).toBe(0);
    expect(pct(5, -1)).toBe(0);
  });
});

describe("getMonthKey", () => {
  test("extrait la clé année-mois d'une date ISO", () => {
    expect(getMonthKey("2026-08-05")).toBe("2026-08");
  });
});

describe("getWeekKey", () => {
  test("produit une clé de semaine au format AAAA-Sxx", () => {
    expect(getWeekKey("2026-08-05")).toMatch(/^2026-S\d{2}$/);
  });
});
