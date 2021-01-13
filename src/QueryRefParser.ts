import { Request } from 'express'



export const QueryRefParser = (request: Request & { _parsedUrl: { pathname: string } }) => {
    const parts = request._parsedUrl.pathname.split('/').slice(2, 100)
    const isCollection = parts.length % 2 == 1
    const collectionRef = parts.slice(0, parts.length - (isCollection ? 0 : 1)).join('/')
    const refs = new Array(Math.ceil(parts.length / 2)).fill(0).map((_, index) => ({
        collection: parts[index * 2],
        id: parts[index * 2 + 1],
    }))
    const target_id = refs[refs.length - 1].id
    const ref = parts.join('/')
    const params = request.params as { [key: string]: string | boolean | number }
    return { refs, ref, collectionRef, target_id, params, isCollection }
} 

export type LivequeryRef = ReturnType<typeof QueryRefParser>