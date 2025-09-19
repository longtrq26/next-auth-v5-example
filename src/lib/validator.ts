import { email, object, string } from "zod";

export const signInSchema = object({
  email: email("Invalid email"),
  password: string()
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must be at most 32 characters"),
});
