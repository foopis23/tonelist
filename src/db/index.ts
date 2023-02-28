import mongoose from 'mongoose';
import { TonelistConfig } from '../types';

async function initDB(config: TonelistConfig) {
	const { mongoUri } = config;
	await mongoose.connect(mongoUri);
}

export default initDB;