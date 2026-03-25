import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { AppDataSource } from './db';
import { User } from './entities/User';
import { System } from './entities/System';
import { SharedData } from './entities/SharedData';
import crypto from 'crypto';

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
    const { username, password, name, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = User.create({ username, password: hashedPassword, name, role: role || 'user' });
    await user.save();
    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    res.status(400).json({ error: 'Error creating user', details: (error as Error).message });
  }
});

app.get('/systems', async (_req: Request, res: Response) => {
  try {
    const systems = await System.find();
    res.json(systems);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch systems' });
  }
});

app.get('/dashboard-stats', async (_req: Request, res: Response) => {
  try {
    const providersCount = await System.count({ where: { status: 'active' } });
    const pendingCount = await System.count({ where: { status: 'pending' } });
    res.json({
      providersCount,
      pendingRegistrations: pendingCount,
      pendingDataRequests: 0,
      totalRecordsExchanged: 0,
      activityFeed: [],
      exchangeChartData: []
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/data-requests', (_req: Request, res: Response) => res.json([]));
app.get('/citizen-records', (_req: Request, res: Response) => res.json([]));

app.post('/systems', async (req: Request, res: Response) => {
  try {
    const { system_name, permissions } = req.body;
    if (!system_name) return res.status(400).json({ error: 'system_name is required' });

    const existing = await System.findOne({ where: { name: system_name } });
    if (existing) return res.status(409).json({ error: 'System name already registered' });

    const apiKey = crypto.randomBytes(32).toString('hex');
    const system = System.create({
      name: system_name,
      apiKey,
      status: 'pending',
      permissions: permissions || {},
    });
    await system.save();
    
    res.status(201).json({ system, apiKey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register system', details: (error as Error).message });
  }
});

app.patch('/systems/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, apiKey, permissions } = req.body;
    
    const system = await System.findOne({ where: { id: Number(id) } });
    if (!system) return res.status(404).json({ error: 'System not found' });

    if (status === 'active' && permissions !== undefined) {
      import('jsonwebtoken').then((jwt) => {
        const payload = {
          id: system.id,
          name: system.name,
          status: 'active',
          permissions: permissions,
          main_system_name: 'CDEMS'
        };
        system.apiKey = jwt.sign(payload, 'super-secret-shertified-key');
        system.permissions = permissions;
        system.status = status;
        system.save().then(() => res.json(system));
      });
      return;
    }

    system.status = status;
    if (permissions !== undefined) system.permissions = permissions;

    await system.save();
    res.json(system);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update system status' });
  }
});

// Middleware to authenticate external systems via API Key
export const authenticateSystem = async (req: Request, res: Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const apiKey = authHeader.split(' ')[1];
  try {
    const system = await System.findOne({ where: { apiKey } });
    if (!system) {
      return res.status(401).json({ error: 'Invalid API Key' });
    }
    
    // We can attach the system to the request for downstream handlers
    (req as any).system = system;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Endpoint for System B to discover its status and permissions
app.get('/api/system/status', authenticateSystem, (req: Request, res: Response) => {
  const system = (req as any).system as System;
  
  res.json({
    id: system.id,
    name: system.name,
    status: system.status,
    permissions: system.permissions || {},
    createdAt: system.createdAt,
    main_system_name: 'CDEMS'
  });
});

app.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (username || email || '').trim();
    console.log('Login attempt', { identifier, password: password ? '***' : null });

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const whereClause: any[] = [
      { username: identifier }
    ];
    
    if (identifier === 'superadmin') {
      whereClause.push({ role: 'superadmin' });
    }

    const user = await User.findOne({
      where: whereClause,
    });

    if (!user) {
      console.log('Login failed: user not found for', identifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Login user found', { id: user.id, username: user.username, name: user.name, role: user.role, isActive: user.isActive });

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

AppDataSource.initialize().then(async () => {
    console.log("Database connected successfully");
    
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS shared_data (
        id SERIAL PRIMARY KEY,
        system_id INTEGER REFERENCES systems(system_id) ON DELETE CASCADE,
        payload JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Endpoint for System B to POST shared data
    app.post('/api/data/share', authenticateSystem, async (req: Request, res: Response) => {
      try {
        const system = (req as any).system as System;
        const { payload } = req.body;
        
        const shared = SharedData.create({
          system_id: system.id,
          payload
        });
        await shared.save();
        
        res.json({ message: 'Data securely shared to CDEMS', id: shared.id });
      } catch (error) {
        res.status(500).json({ error: 'Failed to save shared data' });
      }
    });

    // Endpoint for System A Superadmin to GET shared data from a specific provider
    app.get('/api/systems/:id/shared-data', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const data = await SharedData.find({ where: { system_id: Number(id) }, order: { createdAt: 'DESC' } });
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch shared data' });
      }
    });

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
}).catch((error) => console.log("Database connection failed", error));
