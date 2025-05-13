import { Worker } from 'node:worker_threads';
import type { WorkerOptions, ConvertOptions } from './types.js';

function* arrayIterator(arr: ConvertOptions[]) {
  for (let i = 0; i < arr.length; i++) {
    yield arr[i];
  }
}

export default class WorkerQueue {
  workers: Worker[] = [];
  iterator: Generator<ConvertOptions, void, unknown>;
  workerCount: number;
  workerFile: string;
  remaining: number;

  constructor(opts: WorkerOptions) {
    this.workerFile = opts.workerFile;
    this.iterator = arrayIterator(opts.queue);
    this.workerCount = opts.count;
    this.remaining = opts.queue.length;
  }

  start() {
    for (let i = 0; i < this.workerCount; i += 1) {
      const result = this.iterator.next();
      if (!result.value || result.done) break;
      const worker = new Worker(this.workerFile, { name: `worker-${i}` });
      this.workers.push(worker);
      worker.postMessage(JSON.stringify(result.value));
      worker.on('message', async (value: number) => {
        this.remaining -= 1;
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
        console.log(`remaining: ${this.remaining}`);
        worker.postMessage(JSON.stringify(result.value));
      });
    }
  }
}
