import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseAndValidate } from "./parseAndValidate.js";

describe("parseAndValidate", () => {
  const schema = z.object({ id: z.number() });

  it("returns the parsed data for a valid payload", () => {
    expect(parseAndValidate(schema, { id: 1 }, "thing")).toEqual({ id: 1 });
  });

  it("strips unknown keys through the schema", () => {
    expect(parseAndValidate(schema, { id: 1, extra: true }, "thing")).toEqual({
      id: 1,
    });
  });

  it("throws a labelled error for invalid shapes", () => {
    expect(() => parseAndValidate(schema, { id: "nope" }, "thing")).toThrow(
      /^Invalid thing:/,
    );
  });
});
