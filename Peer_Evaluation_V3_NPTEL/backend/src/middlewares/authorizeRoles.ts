import type { Response, NextFunction } from "express";

export const authorizeRoles = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized: No user found in request" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Access denied!" });
      return;
    }

    next();
  };
};
