import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(e.message);
    });

    return res.status(400).json({
      message: 'שגיאת ולידציה',
      errors,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'טוקן לא תקין' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'הטוקן פג תוקף' });
  }

  // MySQL errors
  if ((err as any).code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'הרשומה כבר קיימת במערכת' });
  }

  res.status(500).json({ message: 'שגיאת שרת פנימית' });
}
