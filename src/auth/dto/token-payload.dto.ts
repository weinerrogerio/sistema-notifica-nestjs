export class TokenPayloadDto {
  sub: number; //nome do usuário
  email: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  role: string;
  sessionId: number; // ID da sessão
}
