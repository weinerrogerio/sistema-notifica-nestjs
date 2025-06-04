import { BaseTemplate } from './base.template';
import {
  ContatoCartorio,
  IntimacaoData,
} from '../../common/interfaces/notification-data.interface';

export class NotificationTemplate extends BaseTemplate {
  static gerar(
    dados: IntimacaoData,
    contatoCartorio: ContatoCartorio,
    trackingPixelUrl?: string,
  ): string {
    /* const trackingPixel = trackingPixelUrl
      ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`
      : ''; */
    /*  const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`; */
    const teste = trackingPixelUrl;
    const trackingPixel = `<img src="${trackingPixelUrl}" width="100" height="100" style="background-color: red;border: 5px solid #27ae60; padding: 5px;" alt="" />`;
    return `
    <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Intimação de Protesto</title>
        ${this.getHeader()}
      </head>
      <body>
          
        <div class="header">
            <h1>Intimação de Cobrança</h1>
        </div>

        <div class="content">
            <h2>Olá, ${dados.nomeDevedor}!</h2>

            <p>
                Esta é uma intimação automática de protesto enviada pelo 3º Distribuidor
                de Curitiba.
            </p>
            <p>
                A partir da data dessa notificação, é iniciado o prazo de 48 horas para
                pagamento em cartorio.
            </p>
            <h3>Detalhes do titulo:</h3>

            <div class="titulo-box">
                <p><strong>Devedor:</strong> R$ ${dados.nomeDevedor}</p>
                <p><strong>Valor:</strong> R$ ${dados.valorTotal}</p>
                <p><strong>Data de Vencimento:</strong> ${dados.dataVencimento}</p>
                <p>
                <strong>Distribuição:</strong> ${dados.dataDistribuicao} de
                ${dados.dataDistribuicao} para o ${dados.tabelionato}
                </p>
                <p><strong>Portador:</strong> R$ ${dados.portador}</p>
                <p><strong>Credor:</strong> R$ ${dados.credor}</p>
            </div>

            <p>
                Em caso de duvida e/ou interesse do pagamento em cartorio, entrar em
                contao diretamente com o ${dados.tabelionato} com os dadoss abaixo:
            </p>
            <div class="contato-box">
                <p><strong>Nome:</strong> ${contatoCartorio.nomeTabelionato}</p>
                <p><strong>Telefone:</strong> ${contatoCartorio.telefone}</p>
                <p><strong>Email:</strong> ${contatoCartorio.email}</p>
                <p><strong>Endereço:</strong> ${contatoCartorio.endereco}</p>
            </div>

            <p>
                <strong>Importante:</strong> Pagamentos de titulos são feitos diretamente ao tabelionato de protesto. 
                Apos o prazo de pagamento em cartorio o titulo vai a protesto e o pgamento so pode ser feito diretamente ao credor.    
            </p>
            <p>Após o pagamento ao tabelionato, o processamento pode levar até 48 horas úteis.</p>
        </div>
        ${this.getFooter()}
        <p>${teste}</p>
        ${trackingPixel}
      </body>
    </html>
    `;
  }
}
