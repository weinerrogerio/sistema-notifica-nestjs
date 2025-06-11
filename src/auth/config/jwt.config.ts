import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  return {
    secret: process.env.JWT_SECRET,
    audience: process.env.JWT_TOKEN_AUDIENCE,
    issuer: process.env.JWT_TOKEN_ISSUER,
    accessTokenTtl: Number(process.env.JWT_ACCESS_TTL ?? '900'), // 15 min
    refreshTokenTtl: Number(process.env.JWT_REFRESH_TTL ?? '604800'), // 7 dias
  };
});
