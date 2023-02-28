class Queue<T> {
	private queue: T[] = [];

	public enqueue(item: T) {
		this.queue.push(item);
	}

	public dequeue(): T | undefined {
		return this.queue.shift();
	}

	public peek(): T | undefined {
		return this.queue[0];
	}

	public size(): number {
		return this.queue.length;
	}
}

export default Queue;
