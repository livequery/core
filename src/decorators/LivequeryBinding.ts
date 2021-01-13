import { applyDecorators, Get, UseInterceptors } from "@nestjs/common";
import { LivequeryInterceptor } from "../interceptors/livequery.interceptor"

export const LivequeryBinding = () => applyDecorators(
    UseInterceptors(LivequeryInterceptor)
) 