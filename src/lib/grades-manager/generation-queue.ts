type Task = () => Promise<void>;

class GenerationQueue {
  private readonly queue: Task[] = [];
  private running = false;

  enqueue(task: Task): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.queue.push(() => task().then(resolve).catch(reject));
      if (!this.running) {
        this.drain();
      }
    });
  }

  get size(): number {
    return this.queue.length;
  }

  get isRunning(): boolean {
    return this.running;
  }

  private async drain(): Promise<void> {
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task().catch(console.error);
      }
    }
    this.running = false;
  }
}

export const generationQueue = new GenerationQueue();
