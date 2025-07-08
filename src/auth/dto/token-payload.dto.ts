export class TokenPayloadDto {
  sub: number; //nome do usuário
  name: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  role: string;
  sessionId: number; // ID da sessão
}
