import * as z from "zod";

export const createWebsiteSchema = z.object({
  businessName: z.string().min(2, {
    message: "Business name must be at least 2 characters.",
  }),
  slug: z
    .string()
    .min(3, { message: "URL slug must be at least 3 characters." })
    .max(50, { message: "URL slug cannot exceed 50 characters." })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain lowercase letters, numbers, and dashes.",
    }),
});

export type CreateWebsiteInput = z.infer<typeof createWebsiteSchema>;
