import { Worker } from 'node:worker_threads';
import type { WorkerOptions } from './types.js';

export default class WorkerQueue {
  workers: Worker[] = [];
  iterator: WorkerOptions['iterator'];
  workerCount: number;
  workerFile: string;
  constructor(opts: WorkerOptions) {
    this.workerFile = opts.workerFile;
    this.iterator = opts.iterator;
    this.workerCount = opts.count;
  }

  start() {
    for (let i = 0; i < this.workerCount; i += 1) {
      const result = this.iterator.next();
      if (!result.value || result.done) break;
      const worker = new Worker(this.workerFile, { name: `worker-${i}` });
      this.workers.push(worker);
      worker.postMessage(JSON.stringify(result));
      worker.on('message', async (value: number) => {
        if (value !== 0) return;
        const result = this.iterator.next();
        if (result.done) {
          console.log(`terminating worker thread ${worker.threadId}`);
          await worker.terminate();
          this.workers.splice(
            this.workers.findIndex((w) => w.threadId === worker.threadId),
            1,
          );
          if (this.workers.length) return;
          console.log('queue is empty');
          console.timeEnd();
          process.exit(0);
        }
        worker.postMessage(JSON.stringify(result.value));
      });
    }
  }
}
