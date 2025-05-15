export abstract class HashingService {
  //recebe uma senha e retorna uma senha em hash (hash de senha)
  abstract hash(password: string): Promise<string>;
  // copara as 2 coisas (password e hash) e retorna true ou false (iguais ou não)
  abstract compare(password: string, hash: string): Promise<boolean>;
}
