import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  return {
    secret: process.env.JWT_SECRET,
    audience: process.env.JWT_TOKEN_AUDIENCE,
    issuer: process.env.JWT_TOKEN_ISSUER,
    accessTokenTtl: Number(process.env.JWT_ACCESS_TTL ?? '3600'), // 1 hora
    refreshTokenTtl: Number(process.env.JWT_REFRESH_TTL ?? '86400'), // 24 horas
    sessionTtl: Number(process.env.JWT_INACTIVITY_TTL ?? '14000'), // 1 hora
  };
});
