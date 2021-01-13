import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { QueryFilterParser } from '../QueryFilterParser';
import { SocketGateway } from '../SocketGateway';

@Injectable()
export class LivequeryInterceptor implements NestInterceptor {

    constructor(
        private SocketGateway: SocketGateway
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest()
        const livequery = await QueryFilterParser(req)
        req.livequery = livequery
        if (req.method == 'GET' && livequery.live_session) {
            this.SocketGateway.subscribe(livequery)
        }
        return next.handle()

    }
}