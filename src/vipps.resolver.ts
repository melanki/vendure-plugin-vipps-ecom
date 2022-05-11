import { Resolver, Mutation } from '@nestjs/graphql';
import { VippsService } from './vipps.service';
import { Ctx, RequestContext } from '@vendure/core';

@Resolver()
export class VippsResolver {
  constructor(private service: VippsService) {}

  @Mutation()
  createVippsPaymentIntent(@Ctx() ctx: RequestContext): Promise<string> {
    return this.service.createPaymentIntent(ctx);
  }
}