const { z } = require("zod");

const emailSchema = z.object({
  email: z.string().email(),
});

const validateEmail = (email) => {
  try {
    emailSchema.parse({ email });
    return true;
  } catch (e) {
    console.error("Invalid email:", e.errors);
    return false;
  }
};

const userValidation = z.object({
  name: z.string().min(1, { message: "Name is required" }),  
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(8, "Password must be at least 8 characters long").regex(/^\S.*$/, "Password cannot start with spaces").regex(/^\S*$/, "Password cannot contain spaces"),
  place: z.string().min(1, { message: "Place is required" }),
  // region: z.string().min(1, { message: "Region is required" }),
  // institution: z.string().min(1, { message: "Institution is required" })
});

const adminValidation = z.object({
  name: z.string().min(1, { message: "Name is required" }),  
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(8, "Password must be at least 8 characters long").regex(/^\S.*$/, "Password cannot start with spaces").regex(/^\S*$/, "Password cannot contain spaces"),
});

const passwordValidation = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long").regex(/^\S.*$/, "Password cannot start with spaces").regex(/^\S*$/, "Password cannot contain spaces"),
})

const loginValidation = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(8, "Password must be at least 8 characters long").regex(/^\S.*$/, "Password cannot start with spaces").regex(/^\S*$/, "Password cannot contain spaces"),
})

const editProfileValidation = z.object({ 
  email: z.string().email({ message: "Invalid email format" }),
});

const searchSchema = z.object({
  keyword: z.string().max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  latitude: z.string().optional(),  // Accepts latitude as a string (convert later)
  longitude: z.string().optional(),
  country: z.string().optional(),
});

module.exports = { 
  validateEmail, 
  userValidation, 
  adminValidation, 
  loginValidation,
  passwordValidation, 
  editProfileValidation, 
  searchSchema };
