import { FilterExpressionsList } from "./FilterExpressions"
import { QueryRefParser } from "./QueryRefParser"
import { Request } from 'express'

export type QueryFilter = {
    key: string,
    expression: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'nin' | 'array_contains'
    value: number | string | boolean | null
}


export const QueryFilterParser = (request: Request) => {

    const { refs, ref, isCollection, collectionRef, target_id } = QueryRefParser(request as any)

    const live_session = request.headers.ws_connection_id as string
    const limit = Math.min(Number(request.query._limit), 20) || 20
    const cursor = (request.headers.cursor || request.query._cursor) as string
    const query = request.query as { [key: string]: string }
    const order_by = query._order_by || 'created_at'
    const search = query._q
    const select = query._fields?.split(',')


    const filters = Object
        .entries(query)
        .filter(item => item[0][0] != '_')
        .map(([key, c]) => {
            const condition = c.includes('|') ? c : `eq|${JSON.stringify(c)}`
            const [expression, value] = condition.trim().split('|') as [string, string]
            if (!FilterExpressionsList.includes(expression)) throw 'INVAILD_FUNCTION'
            return { key, expression, value: JSON.parse(value) }
        }) as QueryFilter[]


    return {
        live_session,
        limit,
        filters,
        order_by,
        cursor,
        refs,
        ref,
        sort: request.query.sort == 'asc' ? 'asc' : 'desc',
        target_id,
        params: request.params,
        isCollection,
        collectionRef,
        select,
        search
    }

}


export type Livequery = ReturnType<typeof QueryFilterParser>

export type LivequeryRequest = Request & { livequery: Livequery }