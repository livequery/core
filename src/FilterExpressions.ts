
export const FilterExpressions = {
    eq: (a, b) => a == b,
    ne: (a, b) => a != b,
    lt: (a, b) => a < b,
    lte: (a, b) => a <= b,
    gt: (a, b) => a > b,
    gte: (a, b) => a >= b,
    in: (a, b: any[]) => b.includes(a),
    nin: (a, b: any[]) => !b.includes(a),
    array_contains: (a: any[], b: any[]) => a.some(i => b.includes(i))
}
 
export const FilterExpressionsList = Object.keys(FilterExpressions) 