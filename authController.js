import { z } from "zod";
import { User } from "../models/User.js";
import { signToken } from "../services/tokenService.js";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function authResponse(user) {
  return {
    token: signToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  };
}

export async function register(req, res, next) {
  try {
    const input = registerSchema.parse(req.body);
    const user = await User.createWithPassword(input);
    res.status(201).json(authResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const input = loginSchema.parse(req.body);
    const user = await User.findOne({ email: input.email.toLowerCase() });

    if (!user || !(await user.comparePassword(input.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json(authResponse(user));
  } catch (error) {
    next(error);
  }
}

export function me(req, res) {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
}
