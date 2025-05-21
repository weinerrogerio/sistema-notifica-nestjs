export class TokenPayloadDto {
  sub: number;
  email: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  role: string;
}
