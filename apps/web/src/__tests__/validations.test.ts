import { describe, it, expect } from "vitest";
import { addNarrativeSchema, addFinancialEntrySchema } from "@/lib/validations/incidents";
import { createContactSchema } from "@/lib/validations/contacts";
import { createDispatchSchema } from "@/lib/validations/dispatches";

describe("addNarrativeSchema", () => {
  it("validates with content provided", () => {
    const result = addNarrativeSchema.safeParse({ content: "Officer observed suspicious activity" });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = addNarrativeSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.content).toBeDefined();
    }
  });

  it("defaults title to empty string when omitted", () => {
    const result = addNarrativeSchema.safeParse({ content: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("");
    }
  });
});

describe("addFinancialEntrySchema", () => {
  it("validates a complete financial entry", () => {
    const result = addFinancialEntrySchema.safeParse({
      kind: "loss",
      type: "Property Damage",
      amount: "1500",
      description: "Broken barrier",
    });
    expect(result.success).toBe(true);
  });

  it("requires kind and type", () => {
    const result = addFinancialEntrySchema.safeParse({ amount: "100" });
    expect(result.success).toBe(false);
  });
});

describe("createContactSchema", () => {
  it("validates an individual contact", () => {
    const result = createContactSchema.safeParse({
      contactType: "individual",
      firstName: "John",
      lastName: "Doe",
      category: "vendor",
      email: "john@example.com",
      phone: "555-0123",
    });
    expect(result.success).toBe(true);
  });

  it("validates an organization contact", () => {
    const result = createContactSchema.safeParse({
      contactType: "organization",
      organizationName: "Acme Security",
      category: "vendor",
      email: "info@acme.com",
      phone: "555-0100",
    });
    expect(result.success).toBe(true);
  });

  it("rejects individual without first name", () => {
    const result = createContactSchema.safeParse({
      contactType: "individual",
      firstName: "",
      lastName: "Doe",
      category: "vendor",
    });
    expect(result.success).toBe(false);
  });
});

describe("createDispatchSchema", () => {
  it("validates a complete dispatch", () => {
    const result = createDispatchSchema.safeParse({
      dispatchCode: "medical",
      priority: "high",
      location: "Main Stage",
      synopsis: "Patron collapsed near barrier",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = createDispatchSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.dispatchCode).toBeDefined();
      expect(errors.priority).toBeDefined();
      expect(errors.location).toBeDefined();
      expect(errors.synopsis).toBeDefined();
    }
  });
});
