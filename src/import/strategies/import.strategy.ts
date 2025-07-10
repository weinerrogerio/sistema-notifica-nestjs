import { TokenPayloadDto } from '@app/auth/dto/token-payload.dto';
import { ImportOptionsDto } from '@app/common/interfaces/import-oprions.interface';

export interface ImportStrategy {
  canHandle(fileMimeType: string): boolean;
  import(fileBuffer: Buffer): Promise<Record<string, string>[]>;
  processFile(
    fileBuffer: Buffer,
    tokenPayload: TokenPayloadDto,
    logImportId: number,
    options?: ImportOptionsDto,
  ): Promise<void>;
}
