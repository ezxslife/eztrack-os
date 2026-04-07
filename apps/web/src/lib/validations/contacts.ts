import { z } from "zod";

export const createContactSchema = z.object({
  contactType: z.string().min(1, "Contact type is required"),
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
  organizationName: z.string().optional().default(""),
  category: z.string().min(1, "Category is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required"),
  secondaryPhone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  title: z.string().optional().default(""),
  idType: z.string().optional().default(""),
  idNumber: z.string().optional().default(""),
  notes: z.string().optional().default(""),
}).refine(
  (data) => {
    if (data.contactType === "individual") {
      return data.firstName.trim().length > 0;
    }
    return data.organizationName.trim().length > 0;
  },
  {
    message: "Name is required",
    path: ["firstName"],
  }
);

export type CreateContactValues = z.infer<typeof createContactSchema>;
