export interface ImportStrategy {
  canHandle(fileMimeType: string): boolean;
  //import(fileBuffer: Buffer): Promise<void>;
  //import(fileBuffer: Buffer): Promise<any[]>;
  import(fileBuffer: Buffer): Promise<Record<string, string>[]>;
}
