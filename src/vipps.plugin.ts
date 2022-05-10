import {
  PluginCommonModule,
  RuntimeVendureConfig,
  VendurePlugin,
} from '@vendure/core';
import gql from 'graphql-tag';
import { VippsResolver } from './vipps.controller';
import { vippsPaymentMethodHandler } from './vipps.handler';
import { VippsService } from './vipps.service';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [VippsService],
  shopApiExtensions: {
    schema: gql`
      extend type Mutation {
        createVippsPaymentIntent: String!
      }
    `,
    resolvers: [VippsResolver],
  },
  configuration: (config: RuntimeVendureConfig) => {
    config.paymentOptions.paymentMethodHandlers.push(vippsPaymentMethodHandler);
    return config;
  },
})
export class VippsPlugin {}