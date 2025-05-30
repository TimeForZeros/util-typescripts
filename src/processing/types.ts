export type Options = {
  format: string;
  extensions: string[];
  quality: number;
  scalePercentage: number;
  outputDir: string;
  bitDepth: 8 | 10 | 12;
  threads: number;
};

export type ConvertOptions = {
  sourcePath: string;
  outputPath: string;
  options: Options;
};

export type WorkerOptions = {
  count: number;
  workerFile: string;
  queue: ConvertOptions[];
};