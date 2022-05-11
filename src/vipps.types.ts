export interface CustomerInfo {
    mobileNumber: string;
}

export interface StaticShippingDetail {
    isDefault: string;
    priority: number;
    shippingCost: number;
    shippingMethod: string;
    shippingMethodId: string;
}

export interface MerchantInfo {
    authToken?: string;
    callbackPrefix?: string;
    consentRemovalPrefix?: string;
    fallBack?: string;
    isApp?: boolean;
    merchantSerialNumber: string;
    paymentType?: string;
    shippingDetailsPrefix?: string;
    staticShippingDetails?: StaticShippingDetail[];
}

export interface Transaction {
    amount: number;
    orderId?: string;
    transactionText?: string;
    skipLandingPage?: boolean;
    scope?: string;
    additionalData?: {
        orderCode?: string;
        channelToken?: string;
    }
    useExplicitCheckoutFlow?: boolean;
}

export interface InitiatePaymentCommand {
    customerInfo: CustomerInfo;
    merchantInfo: MerchantInfo;
    transaction: Transaction;
}

export interface PaymentActionsRequest {
    merchantInfo: MerchantInfo;
    transaction: Transaction;
    shouldReleaseRemainingFunds?: boolean;
}