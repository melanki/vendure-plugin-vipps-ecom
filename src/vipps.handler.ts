import { LanguageCode } from '@vendure/common/lib/generated-types';
import {
    Api,
    CreatePaymentErrorResult,
    CreatePaymentResult,
    CreateRefundResult,
    Logger,
    PaymentMethodHandler,
    SettlePaymentResult,
} from '@vendure/core';
import { loggerCtx } from './constants';
import { VippsService } from './vipps.service';

let vippsService: VippsService

export const vippsPaymentMethodHandler = new PaymentMethodHandler({
    code: 'vipps',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'Vipps payment',
        },
        {
            languageCode: LanguageCode.nb,
            value: 'Vipps betaling'
        }
    ],
    args: {
        host: {
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'Vendure API host' }
            ],
            defaultValue: 'ww.vipps.no'
        },
        apiHost: {
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'Vipps API Host' }
            ],
            defaultValue: 'api.vipps.no'
        },
        merchantSerialNumber: {
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'Merchant Serial Number' }
            ],
        },
        clientId: {
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'Client id' }
            ],
        },
        clientSecret: {
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'Client secret' }
            ],
        },
        subscriptionKey: {
            type: 'string',
            label: [
                { languageCode: LanguageCode.en, value: 'Subscription Key' }
            ],
        }
    },
    createPayment: async (
        ctx,
        order,
        amount,
        args,
        metadata
    ): Promise<CreatePaymentResult | CreatePaymentErrorResult> => {
        // Creating a payment immediately settles the payment, so only Admins and internal calls should be allowed to do this
        if (ctx.apiType !== 'admin') {
            throw Error(`CreatePayment is not allowed for apiType '${ctx.apiType}'`);
        }
        return {
            amount,
            state: 'Settled' as const,
            transactionId: metadata.paymentId,
            metadata, // Store all given metadata on a payment
        };
    },
    settlePayment: async (): Promise<SettlePaymentResult> => {
        return { success: true };
    },
    createRefund: async (
        ctx,
        input,
        amount,
        order,
        payment
    ): Promise<CreateRefundResult> => {
        // const result = await vippsService.createRefund(ctx, order)

        // if (result?.data?.transaction) {
        //     return {
        //         state: 'Settled' as const,
        //         transactionId: payment.transactionId
        //     };
        // }

        return {
            state: 'Failed'
        };
    },
});