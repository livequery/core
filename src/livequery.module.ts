import { Global, Module } from '@nestjs/common';
import { RemixInterceptor } from './interceptors/remix.interceptor';
import { SocketGateway } from './SocketGateway';

@Global()
@Module({
    providers: [
        SocketGateway,
        RemixInterceptor
    ],
    exports: [
        SocketGateway
    ],
})
export class LivequeryModule { }