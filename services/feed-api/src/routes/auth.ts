import { Router, Request, Response } from 'express';
import { DataService } from '../services/firestore.js';

export const authRouter = Router();

authRouter.get('/users', async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await DataService.getUsers();
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

authRouter.get('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await DataService.getUser(req.params.id as string);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
