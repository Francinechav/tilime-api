import { Injectable } from '@nestjs/common';

import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);
  private async sendEmail({
    to,
    subject,
    html,
  }: {
    to: string;

    subject: string;

    html: string;
  }) {
    return await this.resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',

      to,

      subject,

      html,
    });
  }

  async sendOtpEmail(email: string, otp: string) {
    return this.resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@tilime.com',

      to: email,

      subject: 'Your Login Verification Code',

      html: `
        <div style="font-family:sans-serif;">
          <h2>Tilime Honey Login Verification</h2>

          <p>Your verification code is:</p>

          <h1>${otp}</h1>

          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    });
  }

  async sendOrderConfirmation(
    email: string,

    customerName: string,

    orderNumber: string,
  ) {
    return this.resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@tilime.com',

      to: email,

      subject: `Order Confirmation - ${orderNumber}`,

      html: `
        <div style="font-family:sans-serif;">
          <h2>Thank you for your order!</h2>

          <p>Hello ${customerName},</p>

          <p>Your order has been received successfully.</p>

          <p>Order Number:</p>

          <h3>${orderNumber}</h3>

          <p>We will contact you shortly regarding delivery.</p>
        </div>
      `,
    });
  }

  async sendAdminOrderAlert(orderNumber: string) {
    return this.resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@tilime.com',

      to: process.env.ADMIN_EMAIL || '',

      subject: `New Website Order - ${orderNumber}`,

      html: `
        <div style="font-family:sans-serif;">
          <h2>New Website Order</h2>

          <p>A new order has been placed.</p>

          <h3>${orderNumber}</h3>
        </div>
      `,
    });
  }
  async sendWebsiteOrderCustomerEmail(
    email: string,

    orderNumber: string,

    totalAmount: number,
  ) {
    return this.sendEmail({
      to: email,

      subject: 'Your Tilime Honey Order',

      html: `
      <h2>Thank you for your order</h2>

      <p>Your order has been received successfully.</p>

      <p>
        Order Number:
        <strong>${orderNumber}</strong>
      </p>

      <p>
        Total Amount:
        <strong>
          MWK ${totalAmount}
        </strong>
      </p>

      <p>
        We will contact you shortly regarding delivery.
      </p>
    `,
    });
  }
  async sendAdminWebsiteOrderEmail(
    orderNumber: string,

    customerName: string,

    totalAmount: number,
  ) {
    return this.sendEmail({
      to: process.env.ADMIN_EMAIL!,

      subject: 'New Website Order',

      html: `
      <h2>New Website Order</h2>

      <p>
        Customer:
        <strong>${customerName}</strong>
      </p>

      <p>
        Order Number:
        <strong>${orderNumber}</strong>
      </p>

      <p>
        Total:
        <strong>
          MWK ${totalAmount}
        </strong>
      </p>
    `,
    });
  }
}
