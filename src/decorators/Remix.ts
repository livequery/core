

import { UseInterceptors, applyDecorators } from '@nestjs/common';
import { RemixFunction, RemixInterceptor, RemixListDecorator } from '../interceptors/remix.interceptor';


export const Remix = (mapper: RemixFunction) => applyDecorators(
    RemixListDecorator(mapper),
    UseInterceptors(RemixInterceptor)
) 