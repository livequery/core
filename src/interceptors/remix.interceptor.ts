

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, UseInterceptors, applyDecorators } from '@nestjs/common';
import { Observable } from 'rxjs'; 
import { map } from 'rxjs/operators';
import { DecoratorBuilder } from '../decorators/DecoratorBuilder';
import { createLivequeryResponse, LivequeryResponse } from '../LivequeryResponse';

export type RemixFunction = (item: any) => any

export const [RemixListDecorator, getRemixList] = new DecoratorBuilder().createPropertyOrMethodDecorator<RemixFunction>()

@Injectable()
export class RemixInterceptor implements NestInterceptor {

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> { 
        const { constructorRef } = context as any
        const { name: method } = context.getHandler()
        const remixer = getRemixList(constructorRef).get(method)[0]

        return next.handle().pipe(map(data => {
            if (data?.data?.items && Array.isArray(data?.data?.items)) {
                const { data: { cursor, has_more, items } } = data as LivequeryResponse
                return createLivequeryResponse(items.map(remixer), cursor, has_more)
            }
            return remixer(data)
        }))

    }
}
