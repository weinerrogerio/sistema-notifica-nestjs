// src/common/filters/global-query-failed.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  debug?: string;
}

@Injectable()
@Catch(QueryFailedError)
export class GlobalQueryFailedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalQueryFailedExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isDevelopment =
      this.configService.get<string>('NODE_ENV') !== 'production';

    this.logger.error(`Database Error: ${exception.message}`, exception.stack);

    // Tratamento específico para cada tipo de erro
    if (this.isInvalidIntegerError(exception)) {
      this.handleInvalidInteger(response, request, isDevelopment, exception);
    } else if (this.isUniqueConstraintError(exception)) {
      this.handleUniqueConstraint(response, request, exception);
    } else if (this.isForeignKeyError(exception)) {
      this.handleForeignKey(response, request);
    } else if (this.isNotNullConstraintError(exception)) {
      this.handleNotNullConstraint(response, request, exception);
    } else {
      this.handleGenericError(response, request, isDevelopment, exception);
    }
  }

  private isInvalidIntegerError(exception: QueryFailedError): boolean {
    return (
      exception.message?.includes(
        'sintaxe de entrada é inválida para tipo integer',
      ) ?? false
    );
  }

  private isUniqueConstraintError(exception: QueryFailedError): boolean {
    return (
      exception.message?.includes(
        'duplicate key value violates unique constraint',
      ) ?? false
    );
  }

  private isForeignKeyError(exception: QueryFailedError): boolean {
    return (
      exception.message?.includes('violates foreign key constraint') ?? false
    );
  }

  private isNotNullConstraintError(exception: QueryFailedError): boolean {
    return exception.message?.includes('violates not-null constraint') ?? false;
  }

  private handleInvalidInteger(
    response: Response,
    request: Request,
    isDevelopment: boolean,
    exception: QueryFailedError,
  ): void {
    const errorResponse: ErrorResponse = {
      statusCode: 400,
      message: 'ID inválido. O ID deve ser um número inteiro positivo.',
      error: 'Bad Request',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (isDevelopment) {
      errorResponse.debug = exception.message;
    }

    response.status(400).json(errorResponse);
  }

  private handleUniqueConstraint(
    response: Response,
    request: Request,
    exception: QueryFailedError,
  ): void {
    const constraintMatch = exception.message.match(/Key \((.+?)\)=/);
    const field = constraintMatch ? constraintMatch[1] : 'campo';

    const errorResponse: ErrorResponse = {
      statusCode: 409,
      message: `Já existe um registro com este ${field}.`,
      error: 'Conflict',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(409).json(errorResponse);
  }

  private handleForeignKey(response: Response, request: Request): void {
    const errorResponse: ErrorResponse = {
      statusCode: 400,
      message:
        'Referência inválida. Verifique se os dados relacionados existem.',
      error: 'Bad Request',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(400).json(errorResponse);
  }

  private handleNotNullConstraint(
    response: Response,
    request: Request,
    exception: QueryFailedError,
  ): void {
    const columnMatch = exception.message.match(/column "(.+?)"/);
    const column = columnMatch ? columnMatch[1] : 'campo obrigatório';

    const errorResponse: ErrorResponse = {
      statusCode: 400,
      message: `O campo '${column}' é obrigatório e não pode estar vazio.`,
      error: 'Bad Request',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(400).json(errorResponse);
  }

  private handleGenericError(
    response: Response,
    request: Request,
    isDevelopment: boolean,
    exception: QueryFailedError,
  ): void {
    const errorResponse: ErrorResponse = {
      statusCode: 500,
      message: 'Erro interno do servidor.',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (isDevelopment) {
      errorResponse.debug = exception.message;
    }

    response.status(500).json(errorResponse);
  }
}
