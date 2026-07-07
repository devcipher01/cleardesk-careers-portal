declare module "nodemailer" {
  export interface SendMailOptions {
    from?: string;
    to?: string;
    subject?: string;
    html?: string;
    text?: string;
  }

  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<unknown>;
  }

  export function createTransport(options: unknown): Transporter;

  const nodemailer: {
    createTransport(options: unknown): Transporter;
  };

  export default nodemailer;
}
