import { Controller, Get, Param, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  private readonly logger = new Logger(TrackingController.name);

  constructor(private readonly trackingService: TrackingService) {}

  @Get('pixel/:token')
  async trackEmailOpen(@Param('token') token: string, @Res() res: Response) {
    try {
      await this.trackingService.registerEmailOpen(token);

      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64',
      );

      res.set({
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      });

      res.send(pixel);
    } catch (error) {
      this.logger.error(`Erro ao processar tracking pixel: ${error.message}`);

      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64',
      );

      res.set('Content-Type', 'image/png');
      res.send(pixel);
    }
  }
}
