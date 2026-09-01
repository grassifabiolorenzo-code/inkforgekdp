import { describe, expect, it } from "vitest";

import { renderTemplate } from "./templates";

describe("renderTemplate — interpolazione {{variabile}} nei modelli email", () => {
  it("sostituisce una singola variabile", () => {
    expect(renderTemplate("Ciao {{name}}!", { name: "Fabio" })).toBe("Ciao Fabio!");
  });

  it("sostituisce più variabili distinte", () => {
    expect(
      renderTemplate("{{name}}, il tuo piano {{plan_name}} è attivo", {
        name: "Fabio",
        plan_name: "Pro",
      }),
    ).toBe("Fabio, il tuo piano Pro è attivo");
  });

  it("sostituisce la stessa variabile ripetuta più volte", () => {
    expect(renderTemplate("{{name}} {{name}}", { name: "X" })).toBe("X X");
  });

  it("tollera spazi dentro le doppie parentesi", () => {
    expect(renderTemplate("Ciao {{ name }}", { name: "Fabio" })).toBe("Ciao Fabio");
  });

  it("una variabile mancante diventa stringa vuota, mai un placeholder grezzo", () => {
    expect(renderTemplate("Ciao {{name}}!", {})).toBe("Ciao !");
  });

  it("una variabile null o undefined diventa stringa vuota", () => {
    expect(renderTemplate("{{a}}-{{b}}", { a: null, b: undefined })).toBe("-");
  });

  it("converte i numeri in stringa", () => {
    expect(renderTemplate("Hai {{count}} crediti", { count: 5 })).toBe("Hai 5 crediti");
  });

  it("non tocca il testo senza placeholder", () => {
    expect(renderTemplate("Nessuna variabile qui.", {})).toBe("Nessuna variabile qui.");
  });

  it("non va in crash su parentesi non chiuse", () => {
    expect(renderTemplate("Ciao {{name", { name: "Fabio" })).toBe("Ciao {{name");
  });
});
