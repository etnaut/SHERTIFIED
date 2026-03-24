import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { connectDatabase } from './db';
import { User } from './entities/User';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('SHERTIFIED server is running');
});

app.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch users' });
  }
});

app.post('/users', async (req: Request, res: Response) => {
  try {
    const user = User.create(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Error creating user' });
  }
});

const port = Number(process.env.PORT || 4000);

connectDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
});
