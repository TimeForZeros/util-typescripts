import { Worker, MessageChannel, MessagePort, isMainThread, parentPort } from 'node:worker_threads';
import type { WorkerOptions } from './types.js';

export default class WorkerQueue {
  workers: Worker[] = [];
  iterator: WorkerOptions['iterator'];
  constructor(opts: WorkerOptions) {
    this.iterator = opts.iterator;
    for (let i = 0; i < opts.count; i += 1) {
      const worker = new Worker(opts.workerFile, { name: `worker-${i}` });
      this.workers.push(worker);
      console.log(worker);
    }
  }

  start() {
    this.workers.forEach((worker) => {
      const result = this.iterator.next();
      worker.on('message', (value) => {
        if (value !== 0) return;
        const result = this.iterator.next();
        if (result.done) {
          // if (shouldQuit.every(Boolean)) {
          //   console.log('queue is empty');
          //   console.timeEnd();
          //   process.exit(0);
          // }
        }
        worker.postMessage(JSON.stringify(result.value));
      });
    });
  }
}
