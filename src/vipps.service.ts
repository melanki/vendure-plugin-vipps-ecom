import { Injectable } from '@nestjs/common';
import {
    ActiveOrderService,
    ChannelService,
    EntityHydrator,
    ErrorResult,
    Logger,
    Order,
    OrderService,
    OrderStateTransitionError,
    PaymentMethodService,
    RequestContext,
} from '@vendure/core';
import { vippsPaymentMethodHandler } from './vipps.handler';
import { loggerCtx } from './constants';
import { VippsClient } from './vipps.client';

@Injectable()
export class VippsService {
    constructor(
        private activeOrderService: ActiveOrderService,
        private orderService: OrderService,
        private channelService: ChannelService,
        private paymentMethodService: PaymentMethodService,
        private entityHydrator: EntityHydrator
    ) { }

    async createPaymentIntent(ctx: RequestContext): Promise<string> {
        const order = await this.activeOrderService.getOrderFromContext(ctx);
        if (!order) {
            throw Error('No active order found for session');
        }
        await this.entityHydrator.hydrate(ctx, order, {
            relations: ['lines', 'customer', 'shippingLines'],
        });
        if (!order.lines?.length) {
            throw Error('Cannot create payment intent for empty order');
        }
        if (!order.customer) {
            throw Error('Cannot create payment intent for order without customer');
        }
        if (!order.shippingLines?.length) {
            throw Error(
                'Cannot create payment intent for order without shippingMethod'
            );
        }
        const { host, merchantSerialNumber, subscriptionKey } = await this.getVippsPaymentMethod(ctx);
        const client = new VippsClient({ host, subscriptionKey });
        const result = await client.createPayment({
            customerInfo: { mobileNumber: order.customer?.phoneNumber },
            merchantInfo: {
                authToken: "",
                callbackPrefix: host + '/vipps/callbacks-for-payment-updates',
                fallBack: host + '/vipps/fallback-order-result-page/acme-shop-123-order123abc',
                consentRemovalPrefix: host + '/vipps/consent-removal',
                isApp: false,
                merchantSerialNumber: merchantSerialNumber,
                paymentType: "eComm Regular Payment",
                staticShippingDetails: [],
            },
            transaction: {
                amount: order.totalWithTax,
                orderId: order.id.toString(),
                skipLandingPage: false,
                scope: "name address email",
                useExplicitCheckoutFlow: true,
                additionalData: {
                    orderCode: order.code,
                    channelToken: ctx.channel.token
                }
            }
        });
        return result.data.url;
    }

    async settlePayment(ctx: RequestContext): Promise<void> {
        const { host, subscriptionKey, merchantSerialNumber } = await this.getVippsPaymentMethod(ctx);
        const client = new VippsClient({ host, subscriptionKey });
        const order = await this.activeOrderService.getOrderFromContext(ctx);
        if (!order) {
            throw Error('No active order found for session');
        }
        const result = await client.capturePayment({
            merchantInfo: {
                merchantSerialNumber: merchantSerialNumber
            },
            transaction: {
                amount: order.totalWithTax,
            }
        });
        Logger.info(`Payment for order ${order.code} settled`, loggerCtx);
    }

    async createRefund(ctx: RequestContext, order: Order): Promise<any> {
        const { host, subscriptionKey, merchantSerialNumber } = await this.getVippsPaymentMethod(ctx);
        const client = new VippsClient({ host, subscriptionKey });
        if (!order) {
            throw Error('No active order found for session');
        }
        const result = await client.refundPayment({
            merchantInfo: {
                merchantSerialNumber: merchantSerialNumber
            },
            transaction: {
                amount: order.totalWithTax,
            }
        });
        Logger.info(`Payment for order ${order.code} settled`, loggerCtx);
        return result
    }

    private async getVippsPaymentMethod(ctx: RequestContext) {
        let { items } = await this.paymentMethodService.findAll(ctx);
        const method = items.find(
            (item) => item.handler.code === vippsPaymentMethodHandler.code
        );
        if (!method) {
            throw Error(
                `No paymentMethod configured with handler ${vippsPaymentMethodHandler.code}`
            );
        }
        //Get args from VippsPaymentMethodHandler
        const host = method.handler.args.find((arg) => arg.name === 'host');
        if (!host) {
            Logger.error(
                `CreatePaymentIntent failed, because no host is configured for ${method.code}`,
                loggerCtx
            );
            throw Error(
                `Paymentmethod ${method.code} has no host configured`
            );
        }
        const apiHost = method.handler.args.find((arg) => arg.name === 'apiHost');
        if (!apiHost) {
            Logger.error(
                `CreatePaymentIntent failed, because no apiHost is configured for ${method.code}`,
                loggerCtx
            );
            throw Error(
                `Paymentmethod ${method.code} has no apiHost configured`
            );
        }
        const merchantSerialNumber = method.handler.args.find((arg) => arg.name === 'merchantSerialNumber');
        if (!merchantSerialNumber) {
            Logger.error(
                `CreatePaymentIntent failed, because no merchantSerialNumber is configured for ${method.code}`,
                loggerCtx
            );
            throw Error(
                `Paymentmethod ${method.code} has no merchantSerialNumber configured`
            );
        }
        const clientId = method.handler.args.find((arg) => arg.name === 'clientId');
        if (!clientId) {
            Logger.error(
                `CreatePaymentIntent failed, because no clientId is configured for ${method.code}`,
                loggerCtx
            );
            throw Error(
                `Paymentmethod ${method.code} has no clientId configured`
            );
        }
        const clientSecret = method.handler.args.find((arg) => arg.name === 'clientSecret');
        if (!clientSecret) {
            Logger.error(
                `CreatePaymentIntent failed, because no clientSecret is configured for ${method.code}`,
                loggerCtx
            );
            throw Error(
                `Paymentmethod ${method.code} has no clientSecret configured`
            );
        }
        const subscriptionKey = method.handler.args.find((arg) => arg.name === 'subscriptionKey');
        if (!subscriptionKey) {
            Logger.error(
                `CreatePaymentIntent failed, because no subscriptionKey is configured for ${method.code}`,
                loggerCtx
            );
            throw Error(
                `Paymentmethod ${method.code} has no subscriptionKey configured`
            );
        }
        return {
            host: host.value,
            apiHost: apiHost.value,
            merchantSerialNumber: merchantSerialNumber.value,
            clientId: clientId.value,
            clientSecret: clientSecret.value,
            subscriptionKey: subscriptionKey.value,
            method,
        };
    }
}