import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { User } from "../models/User.ts";

const JWT_SECRET = process.env.JWT_SECRET || "pes-secret";

// Extend req to include user
export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Token missing" });
    return;
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded._id || decoded.id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Invalid token" });
  }
};
