import { TokenPayloadDto } from '@app/auth/dto/token-payload.dto';

export interface ImportStrategy {
  canHandle(fileMimeType: string): boolean;
  import(fileBuffer: Buffer): Promise<Record<string, string>[]>;
  processFile(
    fileBuffer: Buffer,
    tokenPayload: TokenPayloadDto,
    logImportId: number,
  ): Promise<void>;
}
