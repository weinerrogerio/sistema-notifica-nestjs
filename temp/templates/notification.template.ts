// templates/notification.template.ts - VERSÃO OTIMIZADA
import { BaseTemplate } from './base.template';
import {
  ContatoCartorio,
  IntimacaoData,
} from '../../src/common/interfaces/notification-data.interface';

export class NotificationTemplate extends BaseTemplate {
  static gerar(
    dados: IntimacaoData,
    contatoCartorio: ContatoCartorio,
    trackingPixelUrl?: string,
  ): string {
    // Múltiplos pixels para aumentar chance de carregamento
    const trackingPixels = trackingPixelUrl
      ? `
      <!-- Tracking Pixels - Múltiplas tentativas -->
      <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
      <img src="${trackingPixelUrl}" width="1" height="1" style="position:absolute;top:-1000px;left:-1000px;" alt="" />
      <div style="background-image: url('${trackingPixelUrl}'); width: 1px; height: 1px; overflow: hidden;"></div>
      
      <!-- Pixel visível como "loading indicator" -->
      <div style="text-align: center; margin: 20px 0; color: #666; font-size: 11px;">
        <img src="${trackingPixelUrl}" width="16" height="16" style="opacity: 0.3;" alt="📊" title="Email tracking" />
        Email ID: ${dados.logNotificacaoId || 'N/A'}
      </div>
    `
      : '';

    // Link de confirmação adicional
    const confirmationLink = trackingPixelUrl
      ? trackingPixelUrl.replace('/pixel/', '/confirm/')
      : '';

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Intimação de Protesto</title>
        
        <!--[if mso]>
        <style type="text/css">
        table {border-collapse: collapse; border-spacing: 0; margin: 0;}
        div, td {padding: 0;}
        div {margin: 0 !important;}
        </style>
        <![endif]-->
        
        <style type="text/css">
        /* Reset styles */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        
        /* Email styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #f4f4f4;
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #2c3e50, #3498db);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        
        .content {
            padding: 30px 20px;
        }
        
        .titulo-box, .contato-box {
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .titulo-box {
            border-left-color: #e74c3c;
        }
        
        .alert-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        
        .footer {
            background-color: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 12px;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3498db;
            color: white !important;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .btn:hover {
            background-color: #2980b9;
        }
        
        /* Força carregamento de imagens */
        img[src*="tracking"] {
            display: block !important;
            width: 1px !important;
            height: 1px !important;
            border: none !important;
            outline: none !important;
        }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>⚖️ Intimação de Cobrança</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Documento Oficial</p>
            </div>

            <div class="content">
                <h2 style="color: #2c3e50;">Prezado(a) ${dados.nomeDevedor},</h2>

                <div class="alert-box">
                    <strong>⚠️ ATENÇÃO:</strong> Esta é uma intimação oficial de protesto. 
                    O prazo para pagamento é de <strong>48 horas</strong> a partir do recebimento desta notificação.
                </div>

                <p>
                    Esta intimação foi enviada automaticamente pelo <strong>3º Distribuidor de Curitiba</strong> 
                    referente ao título em seu nome.
                </p>

                <h3 style="color: #e74c3c;">📋 Detalhes do Título:</h3>
                <div class="titulo-box">
                    <p><strong>Devedor:</strong> ${dados.nomeDevedor}</p>
                    <p><strong>Documento:</strong> ${dados.docDevedor || 'N/A'}</p>
                    <p><strong>Valor Total:</strong> <span style="color: #e74c3c; font-size: 18px; font-weight: bold;">R$ ${dados.valorTotal}</span></p>
                    <p><strong>Data de Vencimento:</strong> ${dados.dataVencimento}</p>
                    <p><strong>Distribuição:</strong> ${dados.dataDistribuicao}</p>
                    <p><strong>Tabelionato:</strong> ${dados.tabelionato}</p>
                    <p><strong>Credor:</strong> ${dados.credor}</p>
                    <p><strong>Portador:</strong> ${dados.portador}</p>
                </div>

                <h3 style="color: #3498db;">📞 Informações para Contato:</h3>
                <div class="contato-box">
                    <p><strong>Nome:</strong> ${contatoCartorio.nomeTabelionato}</p>
                    <p><strong>Telefone:</strong> <a href="tel:${contatoCartorio.telefone}">${contatoCartorio.telefone}</a></p>
                    <p><strong>Email:</strong> <a href="mailto:${contatoCartorio.email}">${contatoCartorio.email}</a></p>
                    <p><strong>Endereço:</strong> ${contatoCartorio.endereco}</p>
                </div>

                ${
                  confirmationLink
                    ? `
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${confirmationLink}" class="btn">📋 Confirmar Recebimento</a>
                    <br><small style="color: #666;">Clique para confirmar que recebeu esta intimação</small>
                </div>
                `
                    : ''
                }

                <div class="alert-box">
                    <p><strong>📌 IMPORTANTE:</strong></p>
                    <ul>
                        <li>Pagamentos devem ser feitos <strong>diretamente ao tabelionato</strong></li>
                        <li>Após o prazo, o título será protestado automaticamente</li>
                        <li>Após o protesto, o pagamento só poderá ser feito diretamente ao credor</li>
                        <li>O processamento pode levar até 48 horas úteis após o pagamento</li>
                    </ul>
                </div>

                <p style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
                    Este é um email automático. Em caso de dúvidas, entre em contato pelos canais informados acima.
                </p>
            </div>

            <div class="footer">
                <p>&copy; 2025 ${contatoCartorio.nomeTabelionato}</p>
                <p>Sistema Automatizado de Notificações</p>
            </div>
        </div>

        ${trackingPixels}

        <!-- Script para forçar carregamento -->
        <script type="text/javascript">
        // Força carregamento de imagens após carregamento da página
        if (typeof window !== 'undefined') {
            window.addEventListener('load', function() {
                var trackingImages = document.querySelectorAll('img[src*="tracking"]');
                trackingImages.forEach(function(img) {
                    var newImg = new Image();
                    newImg.src = img.src + '?t=' + Date.now();
                });
            });
        }
        </script>
    </body>
    </html>
    `;
  }
}
