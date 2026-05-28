import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';

import { PaymentsService } from './payments.service';

import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import type { Response } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  initiatePayment(
    @Body()
    dto: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiatePayment(dto);
  }
  @Post('verify/:txRef')
  verifyPayment(@Param('txRef') txRef: string) {
    return this.paymentsService.verifyPayment(txRef);
  }
  @Post('webhook')
  async handleWebhook(
    @Body()
    body: {
      data?: {
        tx_ref?: string;
      };
    },
  ) {
    const txRef = body.data?.tx_ref;

    if (!txRef) {
      return {
        message: 'Invalid webhook payload',
      };
    }

    return this.paymentsService.verifyPayment(txRef);
  }

  @Get('callback')
  async paymentCallback(
    @Query('tx_ref')
    txRef: string,

    @Res() res: Response,
  ) {
    await this.paymentsService.verifyPayment(txRef);

    return res.redirect(
      `${process.env.FRONTEND_URL}/payments/success?tx_ref=${txRef}`,
    );
  }
}
