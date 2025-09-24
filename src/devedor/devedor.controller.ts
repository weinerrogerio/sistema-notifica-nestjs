import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpException,
  Res,
} from '@nestjs/common';
import { DevedorService } from './devedor.service';
import { CreateDevedorDto } from './dto/create-devedor.dto';
import { UpdateDevedorDto } from './dto/update-devedor.dto';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';
import { Response } from 'express';
import { LogMessage } from '@app/email-lookup/email-lookup.service';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('devedor')
export class DevedorController {
  constructor(private readonly devedorService: DevedorService) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  create(@Body() createDevedorDto: CreateDevedorDto) {
    return this.devedorService.create(createDevedorDto);
  }

  @Get('teste-update-email')
  @Roles(Role.USER, Role.ADMIN)
  findAllWithEmailNull() {
    return this.devedorService.updateAllEmailTeste();
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get('pj')
  findAll() {
    return this.devedorService.findOneAllByPj();
  }

  // VERSÃO CORRIGIDA: Apenas cria a sessão, não inicia a busca
  @Get('email-search/start')
  @Roles(Role.USER, Role.ADMIN)
  async iniciarBuscaEmails() {
    try {
      // Apenas cria uma nova sessão de busca (não inicia a busca ainda)
      const sessionId = this.devedorService.createSearchSession();
      console.log(`Nova sessão de busca criada: ${sessionId}`);

      return {
        success: true,
        sessionId,
        message: 'Sessão criada. Conecte-se aos logs e depois inicie a busca.',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao criar sessão de busca',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // NOVO ENDPOINT: Para iniciar a busca depois que o SSE já está conectado
  @Post('email-search/start/:sessionId')
  @Roles(Role.USER, Role.ADMIN)
  async iniciarBuscaEmailsPorSessao(@Param('sessionId') sessionId: string) {
    try {
      console.log(`Iniciando busca para sessão: ${sessionId}`);

      // Verifica se a sessão existe
      const sessions = this.devedorService.getActiveSessions();
      const sessionExists = sessions.some((s) => s.id === sessionId);

      if (!sessionExists) {
        throw new HttpException(
          {
            success: false,
            message: 'Sessão não encontrada',
            sessionId,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // Inicia a busca de forma assíncrona (agora o SSE já está conectado)
      this.devedorService
        .buscarEmailsDevedores(sessionId)
        .then((resultado) => {
          console.log(`Busca concluída para sessão ${sessionId}:`, {
            total: resultado.estatisticas.total,
            encontrados: resultado.estatisticas.encontrados,
            cancelled: resultado.cancelled,
          });
        })
        .catch((error) => {
          console.error(`Erro na busca da sessão ${sessionId}:`, error.message);
        });

      return {
        success: true,
        sessionId,
        message: 'Busca iniciada com sucesso',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao iniciar busca de emails',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoint para obter o progresso de uma sessão específica
  @Get('email-search/progress/:sessionId')
  @Roles(Role.USER, Role.ADMIN)
  async obterProgressoBusca(@Param('sessionId') sessionId: string) {
    try {
      const progress = this.devedorService.getSessionProgress(sessionId);

      if (!progress) {
        return {
          success: false,
          message: 'Sessão não encontrada ou já concluída',
          sessionId,
        };
      }

      return {
        success: true,
        sessionId,
        progress,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao obter progresso da busca',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoint para cancelar uma sessão de busca específica
  @Post('email-search/cancel/:sessionId')
  @Roles(Role.USER, Role.ADMIN)
  async cancelarBuscaEmails(@Param('sessionId') sessionId: string) {
    try {
      const cancelled = this.devedorService.cancelSearchSession(sessionId);

      if (!cancelled) {
        return {
          success: false,
          message: 'Sessão não encontrada',
          sessionId,
        };
      }

      return {
        success: true,
        message: 'Busca cancelada com sucesso',
        sessionId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao cancelar busca de emails',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoint para listar todas as sessões ativas
  @Get('email-search/sessions')
  @Roles(Role.USER, Role.ADMIN)
  async listarSessoesAtivas() {
    try {
      const sessions = this.devedorService.getActiveSessions();

      return {
        success: true,
        sessions: sessions.map((session) => ({
          id: session.id,
          startTime: session.startTime,
          cancelled: session.cancelled,
          progress: session.progress
            ? {
                currentBatch: session.progress.currentBatch,
                totalBatches: session.progress.totalBatches,
                processedCount: session.progress.processedCount,
                totalCount: session.progress.totalCount,
                message: session.progress.message,
                percentage:
                  session.progress.processedCount > 0 &&
                  session.progress.totalCount > 0
                    ? Math.round(
                        (session.progress.processedCount /
                          session.progress.totalCount) *
                          100,
                      )
                    : 0,
              }
            : null,
        })),
        total: sessions.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao listar sessões ativas',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoint para obter resultado final de uma busca (após conclusão)
  @Get('email-search/result/:sessionId')
  @Roles(Role.USER, Role.ADMIN)
  async obterResultadoBusca(@Param('sessionId') sessionId: string) {
    try {
      return {
        success: false,
        message:
          'Endpoint para resultados salvos - implementar conforme necessidade',
        sessionId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao obter resultado da busca',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // VERSÃO CORRIGIDA: Endpoint SSE para acompanhar LOGS EM TEMPO REAL
  @Get('email-search/logs/:sessionId')
  @Roles(Role.USER, Role.ADMIN)
  async emailSearchLogs(
    @Param('sessionId') sessionId: string,
    @Res() response: Response,
  ) {
    // Configurar headers para SSE
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Função para enviar dados via SSE
    const sendSSE = (data: any, eventType: string = 'message') => {
      try {
        response.write(`event: ${eventType}\n`);
        response.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error('Erro ao enviar SSE:', error);
      }
    };

    // Enviar confirmação de conexão
    sendSSE(
      {
        type: 'connection',
        sessionId,
        message: '//@Roles(Role.USER, Role.ADMIN)',
        timestamp: new Date().toISOString(),
      },
      'connection',
    );

    // Verificar se a sessão existe
    const sessions = this.devedorService.getActiveSessions();
    const sessionExists = sessions.some((s) => s.id === sessionId);

    if (!sessionExists) {
      sendSSE(
        {
          type: 'error',
          sessionId,
          message: 'Sessão não encontrada',
          timestamp: new Date().toISOString(),
        },
        'error',
      );

      setTimeout(() => response.end(), 1000);
      return;
    }

    // Registrar callback para logs da sessão
    const logCallback = (log: LogMessage) => {
      sendSSE(
        {
          type: 'log',
          sessionId,
          log: {
            level: log.level,
            message: log.message,
            cnpj: log.cnpj,
            fonte: log.fonte,
            email: log.email,
            timestamp: log.timestamp.toISOString(),
          },
        },
        'log',
      );
    };

    // Registra o callback na sessão
    this.devedorService.setSessionLogCallback(sessionId, logCallback);

    // Enviar mensagem informando que está pronto para receber logs
    sendSSE(
      {
        type: 'ready',
        sessionId,
        message: 'Pronto para receber logs. Você pode iniciar a busca agora.',
        timestamp: new Date().toISOString(),
      },
      'ready',
    );

    // Heartbeat para manter conexão viva
    const heartbeatInterval = setInterval(() => {
      try {
        sendSSE(
          {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          },
          'heartbeat',
        );
      } catch (error) {
        clearInterval(heartbeatInterval);
        console.error(`Erro ao enviar heartbeat: ${error}`);
      }
    }, 30000); // A cada 30 segundos

    // Verificar se sessão ainda está ativa
    const checkSessionInterval = setInterval(() => {
      const activeSessions = this.devedorService.getActiveSessions();
      const isActive = activeSessions.some((s) => s.id === sessionId);

      if (!isActive) {
        sendSSE(
          {
            type: 'session_ended',
            sessionId,
            message: 'Sessão finalizada',
            timestamp: new Date().toISOString(),
          },
          'session_ended',
        );

        clearInterval(checkSessionInterval);
        clearInterval(heartbeatInterval);
        setTimeout(() => response.end(), 1000);
      }
    }, 2000); // Verifica a cada 2 segundos

    // Cleanup quando cliente desconectar
    response.on('close', () => {
      clearInterval(heartbeatInterval);
      clearInterval(checkSessionInterval);
      console.log(
        `Cliente desconectado do SSE de logs da sessão: ${sessionId}`,
      );
    });

    response.on('error', (error) => {
      clearInterval(heartbeatInterval);
      clearInterval(checkSessionInterval);
      console.log(`Erro na conexão SSE da sessão: ${sessionId}`, error);
    });
  }

  // Endpoint SSE para acompanhar PROGRESSO EM TEMPO REAL (mantido como estava)
  @Get('email-search/progress-stream/:sessionId')
  @Roles(Role.USER, Role.ADMIN)
  async emailSearchProgressStream(
    @Param('sessionId') sessionId: string,
    @Res() response: Response,
  ) {
    // Configurar headers para SSE
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Função para enviar dados via SSE
    const sendSSE = (data: any, eventType: string = 'message') => {
      try {
        response.write(`event: ${eventType}\n`);
        response.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error('Erro ao enviar SSE:', error);
      }
    };

    // Enviar confirmação de conexão
    sendSSE(
      {
        type: 'connection',
        sessionId,
        message: 'Conectado ao stream de progresso',
        timestamp: new Date().toISOString(),
      },
      'connection',
    );

    // Intervalo para verificar progresso
    const progressInterval = setInterval(() => {
      const progress = this.devedorService.getSessionProgress(sessionId);

      if (!progress) {
        // Sessão não encontrada ou finalizada
        sendSSE(
          {
            type: 'session_ended',
            sessionId,
            message: 'Sessão finalizada ou não encontrada',
            timestamp: new Date().toISOString(),
          },
          'session_ended',
        );

        clearInterval(progressInterval);
        setTimeout(() => response.end(), 1000);
        return;
      }

      // Enviar progresso atual
      sendSSE(
        {
          type: 'progress',
          sessionId,
          progress: {
            currentBatch: progress.currentBatch,
            totalBatches: progress.totalBatches,
            currentCnpj: progress.currentCnpj,
            processedCount: progress.processedCount,
            totalCount: progress.totalCount,
            message: progress.message,
            timestamp: progress.timestamp,
            percentage: Math.round(
              (progress.processedCount / progress.totalCount) * 100,
            ),
          },
        },
        'progress',
      );
    }, 1000); // Atualiza a cada 1 segundo

    // Cleanup quando cliente desconectar
    response.on('close', () => {
      clearInterval(progressInterval);
      console.log(
        `Cliente desconectado do SSE de progresso da sessão: ${sessionId}`,
      );
    });

    // Heartbeat para manter conexão viva
    const heartbeatInterval = setInterval(() => {
      try {
        sendSSE(
          {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          },
          'heartbeat',
        );
      } catch (error) {
        clearInterval(progressInterval);
        clearInterval(heartbeatInterval);
        console.error(`Erro ao enviar heartbeat: ${error}`);
      }
    }, 30000); // A cada 30 segundos

    response.on('close', () => {
      clearInterval(heartbeatInterval);
    });
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.devedorService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateDevedorDto: UpdateDevedorDto) {
    return this.devedorService.update(+id, updateDevedorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.devedorService.remove(+id);
  }
}
