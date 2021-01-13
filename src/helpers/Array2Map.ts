export class Array2Map {
    private static group_array_by_key<T, K extends keyof T>(
        items: T[],
        ...keys: K[]
    ) {

        const map = new Map()
        for (const item of items) {
            let cursor: Map<string, any> = map

            for (const [index, key_name] of keys.entries()) {
                const key = item[key_name as string]
                if (!cursor.has(key)) cursor.set(key, index + 1 < keys.length ? new Map() : item)
                cursor = cursor.get(key)
            }
        }
        return map
    }

    static groupByKey<T>(items: T[], group_key: keyof T) {
        return this.group_array_by_key(items, group_key) as Map<string, T>
    }

    static groupBy2Key<T>(items: T[], group_key: keyof T, id_key: keyof T) {
        return this.group_array_by_key(items, group_key, id_key) as Map<string, Map<string, T>>
    }

    static groupBy3Key<T>(items: T[], group_key1: keyof T, group_key2: keyof T, id_key: keyof T) {
        return this.group_array_by_key(items, group_key1, group_key2, id_key) as Map<string, Map<string, Map<string, T>>>
    }
}



