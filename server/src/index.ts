import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { AppDataSource } from './db';
import { User } from './entities/User';
import { System } from './entities/System';
import { SharedData } from './entities/SharedData';
import { DataRequest } from './entities/DataRequest';
import { SystemLog } from './entities/SystemLog';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const sanitizeUser = (user: User) => {
  const { password, ...safeUser } = user as any;
  return safeUser;
};

app.get('/', (_req: Request, res: Response) => {
  res.send('SHERTIFIED server is running');
});

const logAction = async (actor: string, action: string, target: string) => {
  try {
    const log = SystemLog.create({ actor, action, target });
    await log.save();
  } catch (e) {
    console.error('Failed to log action', e);
  }
};

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

app.get('/data-requests', async (_req: Request, res: Response) => {
  try {
    const requests = await DataRequest.find({
      relations: ['requester', 'target'],
      order: { createdAt: 'DESC' }
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data requests' });
  }
});
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
    
    await logAction(system.name, 'Registered', 'System Integration');
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
        system.save().then(async () => {
          await logAction('Superadmin', `Set System Status to ${status}`, `System ${system.name}`);
          res.json(system);
        });
      });
      return;
    }

    system.status = status;
    if (permissions !== undefined) system.permissions = permissions;

    await system.save();
    await logAction('Superadmin', `Set System Status to ${status}`, `System ${system.name}`);
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

    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS data_request (
        id SERIAL PRIMARY KEY,
        requester_system_id INTEGER REFERENCES systems(system_id) ON DELETE CASCADE,
        target_system_id INTEGER REFERENCES systems(system_id) ON DELETE CASCADE,
        requested_columns JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT NOT NULL,
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
        await logAction(system.name, 'Shared Data', `To CDEMS`);
        
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

    // Endpoint for System B to request data from another system
    app.post('/api/data-requests', authenticateSystem, async (req: Request, res: Response) => {
      try {
        const system = (req as any).system as System;
        const { target_system_id, requested_columns } = req.body;
        
        if (!target_system_id || !requested_columns) {
          return res.status(400).json({ error: 'Missing target_system_id or requested_columns' });
        }

        const newReq = DataRequest.create({
          requester_system_id: system.id,
          target_system_id,
          requested_columns,
          status: 'pending'
        });
        await newReq.save();

        const targetSys = await System.findOne({ where: { id: target_system_id } });
        await logAction(system.name, 'Requested Data', `From ${targetSys?.name || 'Unknown'} (Columns: ${requested_columns.length})`);
        
        res.status(201).json(newReq);
      } catch (err) {
        res.status(500).json({ error: 'Failed to create request' });
      }
    });

    // Endpoint for Superadmin to approve/reject data requests
    app.patch('/api/data-requests/:id/status', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        const dReq = await DataRequest.findOne({ where: { id: Number(id) } });
        if (!dReq) return res.status(404).json({ error: 'Data request not found' });
        
        dReq.status = status;
        await dReq.save();
        await logAction('Superadmin', `Request ${status === 'approved' ? 'Approved' : 'Rejected'}`, `Request ID ${dReq.id}`);
        res.json(dReq);
      } catch (err) {
        res.status(500).json({ error: 'Failed to patch request' });
      }
    });

    // Endpoint for System B to retrieve its APPROVED request data
    app.get('/api/system/approved-data', authenticateSystem, async (req: Request, res: Response) => {
      try {
        const system = (req as any).system as System;
        const approvedRequests = await DataRequest.find({ 
          where: { requester_system_id: system.id, status: 'approved' },
          relations: ['target']
        });

        const results = [];
        for (const dreq of approvedRequests) {
          const sharedDocs = await SharedData.find({ where: { system_id: dreq.target_system_id } });
          const filteredCitizens = [];
          
          for (const doc of sharedDocs) {
            if (doc.payload?.citizens && Array.isArray(doc.payload.citizens)) {
              const citizensFiltered = doc.payload.citizens.map((citizen: any) => {
                const compiled: any = { _docId: doc.id, _originalId: citizen.id || `${citizen.firstName}-${citizen.lastName}` };
                for (const col of dreq.requested_columns) {
                  if (citizen[col] !== undefined) {
                    compiled[col] = citizen[col];
                  }
                }
                return compiled;
              });
              filteredCitizens.push(...citizensFiltered);
            }
          }
          results.push({
            requestId: dreq.id,
            providerName: dreq.target.name,
            requestedColumns: dreq.requested_columns,
            citizens: filteredCitizens
          });
        }
        res.json(results);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch authorized data' });
      }
    });

    // Endpoint for external systems to sync back modifications
    app.patch('/api/data/update-citizen', authenticateSystem, async (req: Request, res: Response) => {
      try {
        const system = (req as any).system as System;
        const { docId, originalId, updates } = req.body;
        
        if (!docId || !originalId || !updates) {
          return res.status(400).json({ error: 'Missing required sync parameters' });
        }

        const sharedDoc = await SharedData.findOne({ where: { id: docId } });
        if (!sharedDoc) return res.status(404).json({ error: 'Source document not found' });
        
        if (sharedDoc.payload?.citizens && Array.isArray(sharedDoc.payload.citizens)) {
          const cIndex = sharedDoc.payload.citizens.findIndex((c: any) => 
            String(c.id) === String(originalId) || `${c.firstName}-${c.lastName}` === originalId
          );
          
          if (cIndex > -1) {
             sharedDoc.payload.citizens[cIndex] = { ...sharedDoc.payload.citizens[cIndex], ...updates };
             await AppDataSource.createQueryBuilder().update(SharedData).set({ payload: sharedDoc.payload }).where("id = :id", { id: sharedDoc.id }).execute();
             await logAction(system.name, 'Synced Edit to CDEMS', `Updated record natively anchored to Document ${docId}`);
             return res.json({ success: true });
          }
        }
        res.status(404).json({ error: 'Citizen not found in document' });
      } catch (e) {
        res.status(500).json({ error: 'Update failed' });
      }
    });

    // Endpoint for Superadmin InfoTracker unified search
    app.get('/api/info-tracker/search', async (req: Request, res: Response) => {
      try {
        const query = (req.query.q as string || '').toLowerCase();
        if (!query) return res.json(null);

        // Fetch all shared records from all systems ascending by created_at 
        const sharedDocs = await SharedData.find({ order: { createdAt: 'ASC' } });
        const systems = await System.find();
        
        const systemMap = new Map();
        systems.forEach((s: System) => systemMap.set(s.id, s.name));
        
        let combinedData: any = {};
        const sources: string[] = [];
        const systemRecords: any = {};
        let found = false;

        for (const doc of sharedDocs) {
          if (doc.payload?.citizens && Array.isArray(doc.payload.citizens)) {
            const citizen = doc.payload.citizens.find((c: any) => {
              const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
              return fullName.includes(query) || (c.citizenId && c.citizenId.toLowerCase().includes(query));
            });

            if (citizen) {
              found = true;
              combinedData = { ...combinedData, ...citizen };
              
              const sysName = systemMap.get(doc.system_id) || `System ${doc.system_id}`;
              if (!sources.includes(sysName)) sources.push(sysName);
              
              // Keep the latest record from this specific system
              systemRecords[sysName] = { ...(systemRecords[sysName] || {}), ...citizen };
            }
          }
        }

        if (!found) {
          return res.json(null);
        }

        res.json({
          record: combinedData,
          sources,
          systemRecords
        });
      } catch (err) {
        res.status(500).json({ error: 'Search failed' });
      }
    });

    app.get('/api/system-logs', async (req: Request, res: Response) => {
      try {
        const logs = await SystemLog.find({ order: { createdAt: 'DESC' }, take: 500 });
        res.json(logs);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch logs' });
      }
    });

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
}).catch((error) => console.log("Database connection failed", error));
