export interface ImportStrategy {
  canHandle(fileMimeType: string): boolean;
  import(fileBuffer: Buffer): Promise<void>;
  //import(fileBuffer: Buffer): Promise<any[]>;
}
