// tracking/tracking.controller.ts - VERSÃO CORRIGIDA
import { Controller, Get, Param, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  private readonly logger = new Logger(TrackingController.name);

  constructor(private readonly trackingService: TrackingService) {}

  @Get('pixel/:token')
  async trackEmailOpen(@Param('token') token: string, @Res() res: Response) {
    this.logger.log(`📧 Tracking pixel acessado com token: ${token}`);

    try {
      await this.trackingService.registerEmailOpen(token);
      this.logger.log(
        `✅ Tracking registrado com sucesso para token: ${token}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erro ao processar tracking pixel: ${error.message}`,
        error.stack,
      );
    }

    // Pixel 1x1 transparente
    const pixelBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const pixelBuffer = Buffer.from(pixelBase64, 'base64');

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixelBuffer.length.toString(),
      'Cache-Control':
        'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
      'Last-Modified': new Date().toUTCString(),
      ETag: `"${Date.now()}"`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'ngrok-skip-browser-warning': 'true',
    });

    res.status(200).end(pixelBuffer);
  }

  // Endpoint para confirmação manual (link clicável)
  @Get('confirm/:token')
  async confirmEmailReceipt(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    this.logger.log(`📬 Confirmação manual acessada com token: ${token}`);

    try {
      await this.trackingService.registerEmailOpen(token);

      // Página de confirmação
      const confirmationHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmação de Recebimento</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 50px auto;
                    padding: 20px;
                    text-align: center;
                    background-color: #f4f4f4;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .success {
                    color: #27ae60;
                    font-size: 24px;
                    margin-bottom: 20px;
                }
                .info {
                    color: #666;
                    line-height: 1.6;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success">✅ Confirmação Registrada</div>
                <div class="info">
                    <p>Obrigado por confirmar o recebimento da intimação.</p>
                    <p>Seu recebimento foi registrado em nosso sistema.</p>
                    <p><strong>Lembre-se:</strong> O prazo para pagamento é de 48 horas.</p>
                </div>
            </div>
        </body>
        </html>
      `;

      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send(confirmationHtml);
    } catch (error) {
      this.logger.error(
        `❌ Erro ao processar confirmação: ${error.message}`,
        error.stack,
      );

      const errorHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Erro na Confirmação</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #e74c3c;">❌ Erro na Confirmação</h2>
            <p>Não foi possível processar sua confirmação. Tente novamente.</p>
        </body>
        </html>
      `;

      res.status(500).send(errorHtml);
    }
  }

  // Endpoint para debug - REMOVER EM PRODUÇÃO
  @Get('debug/:logId')
  async debugTracking(@Param('logId') logId: string) {
    const token = this.trackingService.generateTrackingToken(parseInt(logId));
    return {
      logId: parseInt(logId),
      generatedToken: token,
      pixelUrl: `/tracking/pixel/${token}`,
    };
  }
}
