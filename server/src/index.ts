import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDatabase } from './db';
import { User } from './entities/User';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:8080' }));
app.use(express.json());

const sanitizeUser = (user: User) => {
  const { password, ...safeUser } = user as any;
  return safeUser;
};

app.get('/', (_req: Request, res: Response) => {
  res.send('SHERTIFIED server is running');
});

app.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users.map(sanitizeUser));
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch users' });
  }
});

app.post('/users', async (req: Request, res: Response) => {
  try {
    const { username, password, email, name, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = User.create({ username, password: hashedPassword, email, name, role: role || 'user' });
    await user.save();
    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    res.status(400).json({ error: 'Error creating user', details: (error as Error).message });
  }
});

app.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (username || email || '').trim();
    console.log('Login attempt', { identifier, password: password ? '***' : null });

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const user = await User.findOne({
      where: [
        { username: identifier },
        { email: identifier },
      ],
    });

    if (!user) {
      console.log('Login failed: user not found for', identifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Login user found', { id: user.id, username: user.username, email: user.email, role: user.role, isActive: user.isActive });

    let isValid = false;
    if (user.password) {
      try {
        isValid = await bcrypt.compare(password, user.password);
      } catch (compareError) {
        console.error('bcrypt compare error', compareError);
        isValid = false;
      }
    }

    if (!isValid) {
      isValid = user.password === password;
    }

    if (!isValid) {
      console.log('Login failed: wrong password for', identifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'User is inactive' });
    }

    res.json({
      ...sanitizeUser(user),
      isSuperadmin: user.role === 'superadmin',
    });
  } catch (error) {
    console.error('Login Error', error);
    res.status(500).json({ error: 'Unable to login', details: (error as Error).message });
  }
});

const port = Number(process.env.PORT || 4000);

connectDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
});
