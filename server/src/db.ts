import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { System } from './entities/System';
import { SharedData } from './entities/SharedData';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgre',
  database: process.env.DB_DATABASE || 'CDEMS_DB',
  synchronize: false,
  logging: false,
  entities: [User, System, SharedData],
  migrations: [],
  subscribers: [],
});

export async function connectDatabase(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection established.');
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
}
