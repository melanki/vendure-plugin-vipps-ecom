import { AxiosInstance, AxiosResponse } from 'axios';
// import { ChargeInput, ChargeResult } from './coinbase.types';
import { Logger } from '@vendure/core';
import { loggerCtx } from './constants';
import { InitiatePaymentCommand, PaymentActionsRequest } from './vipps.types';
const axios = require('axios').default;

export class VippsClient {
  private readonly client: AxiosInstance;

  constructor(private config: { host?: string, subscriptionKey: string; collectionVersion?: string }) {
    this.config.collectionVersion = this.config.collectionVersion || '2021-12-14';
    this.client = axios.create({
      baseURL: this.config.host ??= 'https://api.vipps.no',
    });
    this.client.defaults.headers.common['Content-Type'] = 'application/json';
    this.client.defaults.headers.common['Ocp-Apim-Subscription-Key'] = this.config.subscriptionKey
    this.client.defaults.headers.common['Merchant-Serial-Number'] = this.config.subscriptionKey
  }

  /**
   * Request a Acess Token from Vipps
   * @returns accessToken
   */
  async tokenRequest() {
    const result = await this.client.post('/accessToken/get')
    return result.data;
  }

  /**
   * Creates a initiate payment request to Vipps.
   * @param expressCheckout: Boolean for enabling express checkout.
   * @param orderId: ID for the transaction.
   * @param accessToken: A token for authorizing the request to Vipps.
   * @param transactionAmount: The amount to reserve for the transaction.
   * @param transactionText: The text attached to the transaction.
   * @param customerNumber:  The number for the Vipps account that will pay for the transaction.
   * @return: The response for the initiate payment request, as JSON.
   */
  async createPayment(input: InitiatePaymentCommand) {
    const response = await this.client.post('/ecomm/v2/payments', input)
    Logger.info(`createPayment response: ${response}`, loggerCtx)
    return this.validateResponse(response)
  }

  /**
   * Captures the reserved payment for the provided order id.
   * @param orderId: ID for the transaction.
   * @param accessToken: A token for authorizing the request to Vipps.
   * @param transactionAmount: The amount of the payment to capture, 0 for capturing all.
   * @param transactionText: The associated text for the capture.
   * @return: Response for the capture request, as JSON.
   */
  async capturePayment(input: PaymentActionsRequest) {
    const response = await this.client.post(`/ecomm/v2/payments/${input.transaction.orderId}/capture`, input)
    Logger.info(`capturePayment response: ${response}`, loggerCtx)
    return this.validateResponse(response)
  }

  /**
   * Sends a cancel order request for the provided order id.
   * @param order_id: ID for the transaction
   * @param access_token: A token for authorizing the request to Vipps.
   * @param transaction_text: Text describing the cancel request.
   * @return: Response for the cancel order request, as JSON.
 */
  async cancelOrder(input: PaymentActionsRequest) {
    const response = await this.client.put(`/ecomm/v2/payments/${input.transaction.orderId}/cancel`, input)
    Logger.info(`capturePayment response: ${response}`, loggerCtx)
    return this.validateResponse(response)
  }

  /**
   *  Requests the order details of a transaction.
   * @param order_id: ID for the transaction.
   * @param access_token: A token for authorizing the request to Vipps.
   * @return: Response for the status request, as JSON.
   */
  async orderDetails(input: PaymentActionsRequest) {
    const response = await this.client.get(`/ecomm/v2/payments/${input.transaction.orderId}/details`)
    Logger.info(`capturePayment response: ${response}`, loggerCtx)
    return this.validateResponse(response)
  }

  /**
   * Refunds a aƒlready captured payment.
   * @param order_id: ID for the transaction.
   * @param access_token: A token for authorizing the request to Vipps.
   * @param transaction_amount: The amount of the payment to capture, 0 for capturing all.
   * @param transaction_text: The associated text for the capture.
   * @return: Response for the refund request, as JSON.
   */
  async refundPayment(input: PaymentActionsRequest) {
    const response = await this.client.post(`/ecomm/v2/payments/${input.transaction.orderId}/refund`, input)
    Logger.info(`capturePayment response: ${response}`, loggerCtx)
    return this.validateResponse(response)
  }

  // async createCharge(input: ChargeInput): Promise<ChargeResult> {
  //   const result = await this.client.post('/charges', input);
  //   return this.validateResponse(result);
  // }

  // async getCharge(id: string): Promise<ChargeResult> {
  //   const result = await this.client.get(`/charges/${id}`);
  //   return this.validateResponse(result);
  // }

  private validateResponse(result: AxiosResponse): any {
    if (result.data.error) {
      Logger.error(
        `Vipps call failed: ${result.data.error?.message}`,
        loggerCtx
      );
      throw Error(result.data.error?.message);
    }
    return result.data;
  }
}