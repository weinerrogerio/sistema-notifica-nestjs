import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app/app.module';
import { UserService } from '../user/user.service';
import { Role } from '@app/common/enums/role.enum';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userService = app.get(UserService);
  const configService = app.get(ConfigService);

  // Obtém credenciais do ambiente (variáveis de ambiente)
  const adminName = configService.get<string>('ADMIN_NAME');
  const adminEmail = configService.get<string>('ADMIN_EMAIL');
  const adminPassword = configService.get<string>('ADMIN_PASSWORD');
  const adminContato = configService.get<string>('ADMIN_CONTATO');

  if (!adminEmail || !adminPassword || !adminName) {
    console.error(
      'Variáveis de ambiente para criação do admin não encontradas',
    );
    await app.close();
    return;
  }

  try {
    // Verifica se já existe algum usuário admin
    const existingAdmins = await userService.findByRole(Role.ADMIN);

    if (existingAdmins.length === 0) {
      // Cria o usuário admin
      await userService.create({
        nome: adminName,
        email: adminEmail,
        password: adminPassword,
        contato: adminContato,
        role: Role.ADMIN,
      });

      console.log('Usuário admin criado com sucesso!');
      console.log(`
    =============================================
    SISTEMA INICIALIZADO - CREDENCIAIS ADMIN
    Nome: ${adminName}
    Email: ${process.env.ADMIN_EMAIL || 'admin@sistema.com'}
    Senha temporária: ${adminPassword}
    IMPORTANTE: Faça login e altere esta senha imediatamente!
    =============================================
      `);
    } else {
      console.log('Usuário admin já existe, pulando criação');
    }
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error.message);
  } finally {
    await app.close();
  }
}

bootstrap();
