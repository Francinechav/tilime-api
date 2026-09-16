import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';

import { createHmac, timingSafeEqual } from 'crypto';

import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

import type { Response } from 'express';
import type { RawBodyRequest } from '@nestjs/common';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  initiatePayment(@Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(dto);
  }

  @Post('verify/:txRef')
  verifyPayment(@Param('txRef') txRef: string) {
    return this.paymentsService.verifyPayment(txRef);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: { tx_ref?: string },
    @Headers('signature') signature?: string,
  ) {
    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new UnauthorizedException('Webhook secret is not configured');
    }

    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new UnauthorizedException('Raw webhook body is unavailable');
    }

    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const received = Buffer.from(signature, 'utf8');

    const expected = Buffer.from(expectedSignature, 'utf8');

    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const txRef = body.tx_ref;

    if (!txRef) {
      return {
        message: 'Invalid webhook payload',
      };
    }
    return this.paymentsService.verifyPayment(txRef);
  }

  @Get('callback')
  async paymentCallback(@Query('tx_ref') txRef: string, @Res() res: Response) {
    await this.paymentsService.verifyPayment(txRef);

    return res.redirect(
      `${process.env.FRONTEND_URL}/payments/verify?tx_ref=${txRef}`,
    );
  }
}
