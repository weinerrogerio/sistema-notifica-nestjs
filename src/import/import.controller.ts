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

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  /* @Post()
  create(@Body() createImportDto: CreateImportDto) {
    return this.importService.create(createImportDto);
  } */

  @Get()
  findAll() {
    return this.importService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.importService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateImportDto: UpdateImportDto) {
    return this.importService.update(+id, updateImportDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.importService.remove(+id);
  }

  // upload do aquivo
  @Post('upload')
  @Roles(Role.USER, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    console.log(file.originalname);
    console.log(file.buffer.toString('utf-8').substring(0, 200));
    console.log(file);
    return this.importService.importFile(file, tokenPayload);
  }
}
