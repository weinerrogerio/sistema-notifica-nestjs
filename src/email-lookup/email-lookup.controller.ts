import { Controller } from '@nestjs/common';
import { EmailLookupService } from './email-lookup.service';

@Controller('email-lookup')
export class EmailLookupController {
  constructor(private readonly emailLookupService: EmailLookupService) {}
}
