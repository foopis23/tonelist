import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
	_id: { type: String, required: true },
	queue: { type: Array, required: true },
	queuePosition: { type: Number, required: true },
	channelID: { type: String, required: true },
});

const QueueModel = mongoose.model('Queue', queueSchema);

export default QueueModel;