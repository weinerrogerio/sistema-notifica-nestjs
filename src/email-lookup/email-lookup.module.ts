import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EmailLookupService } from './email-lookup.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 segundos de timeout
      maxRedirects: 3,
    }),
  ],
  providers: [EmailLookupService],
  exports: [EmailLookupService],
})
export class EmailLookupModule {}
