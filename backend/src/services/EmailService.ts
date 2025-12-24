/**
 * Serviço de envio de email
 * Por enquanto apenas loga o email, mas pode ser configurado para usar nodemailer, sendgrid, etc.
 */
export class EmailService {
  /**
   * Envia email de recuperação de senha
   * @param email Email do destinatário
   * @param token Token de recuperação
   * @param frontendUrl URL do frontend para montar o link
   */
  static async enviarEmailRecuperacaoSenha(
    email: string,
    token: string,
    frontendUrl: string = process.env.FRONTEND_URL || 'http://localhost:5173'
  ): Promise<void> {
    const resetUrl = `${frontendUrl}/resetar-senha?token=${token}`;
    
    // Por enquanto apenas loga (em produção, usar serviço de email real)
    console.log('='.repeat(60));
    console.log('EMAIL DE RECUPERAÇÃO DE SENHA');
    console.log('='.repeat(60));
    console.log(`Para: ${email}`);
    console.log(`Assunto: Recuperação de Senha - Rachid`);
    console.log('');
    console.log('Olá,');
    console.log('');
    console.log('Você solicitou a recuperação de senha. Clique no link abaixo para redefinir sua senha:');
    console.log('');
    console.log(resetUrl);
    console.log('');
    console.log('Este link expira em 1 hora.');
    console.log('');
    console.log('Se você não solicitou esta recuperação, ignore este email.');
    console.log('='.repeat(60));
    
    // TODO: Implementar envio real de email usando nodemailer, sendgrid, etc.
    // Exemplo com nodemailer:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //   from: process.env.EMAIL_FROM,
    //   to: email,
    //   subject: 'Recuperação de Senha - Rachid',
    //   html: `...`
    // });
  }
}

