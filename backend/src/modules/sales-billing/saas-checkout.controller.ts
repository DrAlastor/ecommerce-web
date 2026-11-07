/**
 * @file saas-checkout.controller.ts
 * @description Controlador público para generar sesiones oficiales de Stripe Checkout
 * para nuevas empresas que se suscriben a los planes del SaaS FashionStore.
 */

import { Body, Controller, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Stripe } from 'stripe';

export class CreateSaasCheckoutDto {
  @IsString()
  @IsNotEmpty()
  planId!: string;

  @IsString()
  @IsNotEmpty()
  planName!: string;

  @IsNumber()
  priceUSD!: number;

  @IsString()
  @IsOptional()
  currency!: 'bob' | 'usd';

  @IsString()
  @IsOptional()
  billingCycle!: 'monthly' | 'yearly';

  @IsString()
  @IsOptional()
  razonSocial!: string;

  @IsString()
  @IsOptional()
  nombreComercial!: string;

  @IsString()
  @IsOptional()
  codigoEmpresa!: string;

  @IsString()
  @IsOptional()
  adminEmail!: string;
}

@Controller('sales-billing/saas')
export class SaasCheckoutController {
  private stripe: Stripe | null = null;

  constructor(private readonly configService: ConfigService) {
    const secretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') || process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      this.stripe = new Stripe(secretKey);
    }
  }

  @Post('create-checkout-session')
  async createCheckoutSession(@Body() dto: CreateSaasCheckoutDto) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      'http://localhost:5173';

    // Tasa de cambio de referencia (1 USD = 12.3656 BOB)
    const rate = 12.3656;
    const isBob = dto.currency?.toLowerCase() === 'bob';
    const finalAmount = isBob
      ? Math.round(dto.priceUSD * rate * 100)
      : Math.round(dto.priceUSD * 100);

    // Mínimo de Stripe: equivalente a $0.50 USD
    const safeAmount = Math.max(50, finalAmount);

    if (this.stripe && safeAmount >= 50) {
      try {
        const session = await this.stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: isBob ? 'bob' : 'usd',
                product_data: {
                  name: `Suscripción ${dto.planName} — FashionStore SaaS`,
                  description: `Suscripción ${dto.billingCycle === 'monthly' ? 'Mensual' : 'Anual'} para ${dto.nombreComercial || dto.razonSocial}`,
                },
                unit_amount: safeAmount,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          customer_email: dto.adminEmail,
          success_url: `${frontendUrl}/?status=stripe_success&session_id={CHECKOUT_SESSION_ID}&plan=${dto.planId}&empresa=${dto.codigoEmpresa}`,
          cancel_url: `${frontendUrl}/#planes`,
        });

        return {
          url: session.url,
          sessionId: session.id,
          status: 'success',
        };
      } catch (err: any) {
        console.warn('Stripe checkout error:', err.message);
        return {
          url: null,
          sessionId: `cs_test_mock_${Date.now()}`,
          error: err.message,
        };
      }
    }

    return {
      url: null,
      sessionId: `cs_test_free_${Date.now()}`,
      status: 'free_trial',
    };
  }
}

