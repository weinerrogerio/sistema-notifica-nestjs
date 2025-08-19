import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { ImportService } from './import.service';
//import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportDto } from './dto/update-import.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { TokenPayloadParam } from '@app/auth/params/token-payload.param';
import { TokenPayloadDto } from '@app/auth/dto/token-payload.dto';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';
import { ImportOptionsDto } from '@app/common/interfaces/import-oprions.interface';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  /* @Post()
  create(@Body() createImportDto: CreateImportDto) {
    return this.importService.create(createImportDto);
  } */

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  findAll() {
    return this.importService.findAll();
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.importService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.USER, Role.ADMIN)
  update(@Param('id') id: string, @Body() updateImportDto: UpdateImportDto) {
    return this.importService.update(+id, updateImportDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.importService.remove(+id);
  }

  // upload do aquivo
  /*  @Post('upload')
  @Roles(Role.USER, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() importOptions: ImportOptionsDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    console.log(file.originalname);
    console.log(file.buffer.toString('utf-8').substring(0, 200));
    console.log(file);
    return this.importService.importFile(
      file,
      tokenPayload,
      tokenPayload.sessionId,
      importOptions,
    );
  } */

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.ADMIN)
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() importOptions: ImportOptionsDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    /*     const tokenPayload = req.user; // Assumindo que você tem um guard de autenticação
    const sessionId = body.sessionId || 1; // Ou como você obtém o sessionId
    const options = { allowPartialImport: body.allowPartialImport || false };
 */
    // Agora retorna o logId imediatamente
    const result = await this.importService.importFile(
      file,
      tokenPayload,
      tokenPayload.sessionId,
      importOptions,
    );

    return {
      message: 'Upload iniciado com sucesso',
      logId: result.logId,
      statusUrl: `/import/status/${result.logId}`,
    };
  }
}
