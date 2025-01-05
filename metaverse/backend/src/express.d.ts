import 'express';

declare global {
    namespace Express {
        interface Request {
            role?: "Admin" | "User";
            userId?: string;
        }
    }
}
