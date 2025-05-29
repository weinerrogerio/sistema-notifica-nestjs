export class BaseTemplate {
  static getHeader(): string {
    return `
      <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 700px;
        margin: 0 auto;
        padding: 20px;
        
      }
      .header {
        background:  #f9f9f9;
        color: rgb(0, 0, 0);
        padding: 30px;
        text-align: center;
        border-radius: 10px 10px 0 0;
        border: 1px solid #ddd;
      }
      .content {
        background: #f9f9f9;
        padding: 30px;
        border: 1px solid #ddd;
      }
      .footer {
        background: #333;
        color: white;
        padding: 01px;
        text-align: center;
        border-radius: 0 0 10px 10px;
      }
      .valor-destaque {
        background: #e74c3c;
        color: white;
        padding: 15px;
        border-radius: 5px;
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        margin: 20px 0;
      }     
      .contato-box {
        background: #f9f9f9;
        border: 0.2px solid #0d1120;
        border-radius: 8px;
        padding: 10px;
        margin: 0.5px 0;
      }
      .titulo-box {
        background: #f9f9f9;
        border: 0.2px solid #0d1120;
        border-radius: 8px;
        padding: 10px;
        margin: 0.5px 0;
      }
      .btn {
        display: inline-block;
        background: #27ae60;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 5px;
        margin: 10px 0;
      }
    </style>
    `;
  }

  static getFooter() {
    return `
      <div class="footer">
      <h3>3º Distribuidor de Protesto de Curitiba</h3>
      <p>(41) 3053-4360 | (41) 3053-4361 | (41) 3053-4362</p>
      <p>Rua Visconde do Rio branco, 1341 Centro, Curitiba, PR</p>
      <link href="https://www.3distrib.com.br">www.3distrib.com.br</link>
      </br>
      <p><small>Este é um email automático, não responda.</small></p>
    </div>
    `;
  }
}
