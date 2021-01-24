import { applyDecorators } from "@nestjs/common"
import { Remix } from "./Remix"

export const HideFields = (fields: string[]) => applyDecorators(Remix(data => {
    const keys = Object.keys(data).filter(k => !fields.includes(k))
    return keys.reduce((p, c) => ({ ...p, [c]: data[c] }), {})
}))