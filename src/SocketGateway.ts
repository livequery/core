import { Inject, Optional, Provider } from "@nestjs/common";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, } from "@nestjs/websockets";
import { v4 } from 'uuid'
import { Array2Map } from "./helpers/Array2Map";
import { Livequery } from "./QueryFilterParser";

export const REALTIME_DATA_EVENT = 'realtime-update'

export type SocketEvent<T> = T & {
    event: string
}

export type RealtimeUpdateItem<T> = {
    id: string
    type: 'INSERT' | 'UPDATE' | 'DELETE',
    data: T
    ref: string
}

export type RealtimeUpdate<T extends { id: string }> = SocketEvent<{
    items: RealtimeUpdateItem<T>[]
    ref: string
}>

export const REF_ALIASES = Symbol.for('REF_ALIAS')
export type REF_ALIASES = { [ref: string]: string[] } 

@WebSocketGateway({ path: process.env.REALTIME_UPDATE_SOCKET_PATH || '/livequery/realtime-updates' })
export class SocketGateway {

    private refs = new Map<string, Set<string>>()
    private connections = new Map<string, { socket: WebSocket, refs: Set<string> }>()
    private changes: RealtimeUpdateItem<{ id: string }>[] = []
    private refs_aliases = new Map<string, Set<string>>()

    // Can not be private
    constructor(@Optional() @Inject(REF_ALIASES) ref_aliases: REF_ALIASES = {}) {
        this.loop()
        for (const ref in ref_aliases) {
            this.refs_aliases.set(ref, new Set([
                ...ref_aliases[ref],
                ... this.refs_aliases.get(ref) || []
            ]))
        }
    }

    private async handleConnection(socket: WebSocket & { id: string }) {
        const id = v4()
        this.connections.set(id, { refs: new Set(), socket })
        socket.id = id
        socket.send(JSON.stringify({ event: 'info', id }))
    }

    private async handleDisconnect(socket: WebSocket & { id: string }) {
        for (const ref of this.connections.get(socket.id)?.refs || []) {
            this.refs.get(ref).delete(socket.id)
        }
        this.connections.delete(socket.id)

    }

    subscribe(req: Livequery) {
        const { ref } = req
        if (this.connections.has(req.live_session)) {
            if (!this.refs.has(ref)) this.refs.set(ref, new Set())
            this.refs.get(ref).add(req.live_session)
            this.connections.get(req.live_session)?.refs.add(ref)
        }

    }

    broadcast<T extends { id: string }>(change: RealtimeUpdateItem<T>) {
        this.changes.push(change)
    }

    @SubscribeMessage('unsubscribe')
    unsubscribe(
        @MessageBody() data: { ref: string },
        @ConnectedSocket() socket: WebSocket & { id: string }
    ) {
        if (!this.connections.has(socket.id)) return
        const refs = [... this.connections.get(socket.id).refs]
        for (const ref of refs) this.refs.get(ref)?.delete(socket.id)
    }

    private async loop() {
        while (true) {
            await new Promise(s => setTimeout(s, 500))
            try {
                for (const [ref, list] of Array2Map.groupBy2Key(this.changes.splice(0, 500), 'ref', 'id')) {
                    await this.send_broadcast(ref, [...list.values()])
                }
            } catch (e) {
                console.log(e)
            }
        }
    }

    private remap(ref: string, from: string, to: string) {
        const a = ref.split('/')
        const b = from.split('/')
        const keys = b.reduce((p, c, i) => {
            if (c.includes(':')) p[c] = a[i]
            return p
        }, {})
        return to
            .split('/')
            .map((item: string) => item.includes(':') ? keys[item] : item)
            .join('/')
    }

    private async send_broadcast<T extends { id: string }>(ref: string, changes: RealtimeUpdateItem<T>[]) {

        changes = Array.isArray(changes) ? changes : [changes]

        // Broadcast to ref
        this.sync(ref, changes)

        // Broadcast to collection
        const refs = ref.split('/')
        const is_document = refs.length % 2 == 0
        if (is_document) {
            const collection_ref = refs.slice(0, refs.length - 1).join('/')
            this.sync(collection_ref, changes)
        }

        // Broadcast to alias  
        const get_collections_ref = path => path.split('/').filter((_, i) => i % 2 == 1).join('/')
        const collections = get_collections_ref(ref)
        for (const [real_path, aliases] of this.refs_aliases) {
            for (const alias of aliases) {
                if (get_collections_ref(real_path) == collections) {
                    const mapped_ref = this.remap(ref, real_path, alias)
                    this.send_broadcast(mapped_ref, changes)
                }
            }
        }
    }

    private sync(ref: string, changes: RealtimeUpdateItem<any>[]) {
        const event: RealtimeUpdate<any> = {
            event: REALTIME_DATA_EVENT,
            items: changes.map(item => ({ ...item, ref })),
            ref
        }
        for (const connection_id of this.refs.get(ref) || []) {
            const socket = this.connections.get(connection_id)?.socket as WebSocket
            socket.send(JSON.stringify(event))
        }
    }


}