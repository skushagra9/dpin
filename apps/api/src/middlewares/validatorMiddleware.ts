import prisma from "@repo/database";
import { NextFunction } from "express";

export const validateValidator = async (req: Request, res: Response, next: NextFunction) => {
    //verify signature.
    next();
    
};
