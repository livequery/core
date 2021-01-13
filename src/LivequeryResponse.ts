
export function createLivequeryResponse(
    items: any[],
    cursor: string = null,
    has_more: boolean = false
) {
    return {
        data: {
            has_more,
            count: items.length,
            cursor,
            items
        }
    }
}


export type LivequeryResponse = ReturnType<typeof createLivequeryResponse>