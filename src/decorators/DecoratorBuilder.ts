import 'reflect-metadata'

export class DecoratorBuilder<T> {

    static createMetadataStorage = <T>() => {
        const token = Symbol()
        const decorator = (options: T) => target => {
            const list: T[] = Reflect.getMetadata(token, target) || []
            list.push(options)
            Reflect.defineMetadata(token, list, target)
        }
        const list_metadata = target => (Reflect.getMetadata(token, target) || []) as T[]
        return [decorator, list_metadata] as [typeof decorator, typeof list_metadata]
    }

    private hooks: Function[] = []

    constructor(private classWrapper: (target, options: T) => any = () => { }) { }

    createPropertyOrMethodDecorator<T>(methodWrapper?: (target: any, method: string, options: T) => any) {
        const token = Symbol()

        const decorator = (options?: T) => (target, method, descriptor) => {
            const map = Reflect.getMetadata(token, target) || new Map<string, T[]>()
            map.set(method, [...map.get(method) || [], options])
            Reflect.defineMetadata(token, map, target)
        }
        methodWrapper && this.hooks.push(target => {
            const map = Reflect.getMetadata(token, target) as Map<string, T[]>
            for (const [method, list] of map) {
                list.map(options => methodWrapper(target, method, options))
            }
        })
        const list_metadata = target => (Reflect.getMetadata(token, typeof target == 'object' ? target : new target) || new Map()) as Map<string, T[]>
        return [decorator, list_metadata] as [typeof decorator, typeof list_metadata]
    }

    getClassDecorator() {
        const hooks = this.hooks
        const classWrapper = this.classWrapper
        return (options?: T) => C => {
            return class extends C {
                constructor(...args) {
                    super(...args)
                    for (const hook of hooks) hook(this)
                    classWrapper(this, options)
                }
            } as any
        }
    }

    getExtendableClass() {
        const hooks = this.hooks
        const classWrapper = this.classWrapper
        return (options: T = {} as any, C: { new(...args: any[]): any } = class { }) => new class extends C {
            constructor(...args) {
                super(...args)
                for (const hook of hooks) hook(this)
                classWrapper(this, options)
            }
        }
    }


    getActivatorFunction() {
        const hooks = this.hooks
        const classWrapper = this.classWrapper
        return (target, options?: T) => {
            for (const hook of hooks) hook(target)
            classWrapper(target, options)
        }
    }
}