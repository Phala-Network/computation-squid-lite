import assert from 'assert'
import {Chain, ChainContext, EventContext, Event, Result, Option} from './support'
import * as v1199 from './v1199'
import * as v1260 from './v1260'

export class PhalaComputationBenchmarkUpdatedEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'PhalaComputation.BenchmarkUpdated')
        this._chain = ctx._chain
        this.event = event
    }

    /**
     * Benchmark Updated
     */
    get isV1199(): boolean {
        return this._chain.getEventHash('PhalaComputation.BenchmarkUpdated') === 'bf11f26c57bc5a22fb034fbf2a7aeee05ab0bc45f2a8a333f9e31eae55391087'
    }

    /**
     * Benchmark Updated
     */
    get asV1199(): {session: Uint8Array, pInstant: number} {
        assert(this.isV1199)
        return this._chain.decodeEvent(this.event)
    }
}

export class PhalaComputationSessionBoundEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'PhalaComputation.SessionBound')
        this._chain = ctx._chain
        this.event = event
    }

    /**
     * Worker & session are bounded.
     * 
     * Affected states:
     * - [`SessionBindings`] for the session account is pointed to the worker
     * - [`WorkerBindings`] for the worker is pointed to the session account
     * - the worker info at [`Sessions`] is updated with `Ready` state
     */
    get isV1199(): boolean {
        return this._chain.getEventHash('PhalaComputation.SessionBound') === 'f46e4c120214de2ad267cd7a520409879e8f20c8fed92bda090ef495de03ca3d'
    }

    /**
     * Worker & session are bounded.
     * 
     * Affected states:
     * - [`SessionBindings`] for the session account is pointed to the worker
     * - [`WorkerBindings`] for the worker is pointed to the session account
     * - the worker info at [`Sessions`] is updated with `Ready` state
     */
    get asV1199(): {session: Uint8Array, worker: Uint8Array} {
        assert(this.isV1199)
        return this._chain.decodeEvent(this.event)
    }
}

export class PhalaComputationSessionSettledEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'PhalaComputation.SessionSettled')
        this._chain = ctx._chain
        this.event = event
    }

    /**
     * Worker settled successfully.
     * 
     * It results in the v in [`Sessions`] being updated. It also indicates the downstream
     * stake pool has received the computing reward (payout), and the treasury has received the
     * tax.
     */
    get isV1199(): boolean {
        return this._chain.getEventHash('PhalaComputation.SessionSettled') === 'ffc821674f60c9133eb49c3cf9ce9042e58fca0d906787401561ee8f598b62a4'
    }

    /**
     * Worker settled successfully.
     * 
     * It results in the v in [`Sessions`] being updated. It also indicates the downstream
     * stake pool has received the computing reward (payout), and the treasury has received the
     * tax.
     */
    get asV1199(): {session: Uint8Array, vBits: bigint, payoutBits: bigint} {
        assert(this.isV1199)
        return this._chain.decodeEvent(this.event)
    }
}

export class PhalaComputationSessionUnboundEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'PhalaComputation.SessionUnbound')
        this._chain = ctx._chain
        this.event = event
    }

    /**
     * Worker & worker are unbound.
     * 
     * Affected states:
     * - [`SessionBindings`] for the session account is removed
     * - [`WorkerBindings`] for the worker is removed
     */
    get isV1199(): boolean {
        return this._chain.getEventHash('PhalaComputation.SessionUnbound') === 'f46e4c120214de2ad267cd7a520409879e8f20c8fed92bda090ef495de03ca3d'
    }

    /**
     * Worker & worker are unbound.
     * 
     * Affected states:
     * - [`SessionBindings`] for the session account is removed
     * - [`WorkerBindings`] for the worker is removed
     */
    get asV1199(): {session: Uint8Array, worker: Uint8Array} {
        assert(this.isV1199)
        return this._chain.decodeEvent(this.event)
    }
}

export class PhalaComputationWorkerEnterUnresponsiveEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'PhalaComputation.WorkerEnterUnresponsive')
        this._chain = ctx._chain
        this.event = event
    }

    /**
     * Worker enters unresponsive state.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated from `WorkerIdle` to `WorkerUnresponsive`
     */
    get isV1199(): boolean {
        return this._chain.getEventHash('PhalaComputation.WorkerEnterUnresponsive') === 'da6fbbac52b4be480812462fce29bab263d644f64756e825d79ddc539a21abdb'
    }

    /**
     * Worker enters unresponsive state.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated from `WorkerIdle` to `WorkerUnresponsive`
     */
    get asV1199(): {session: Uint8Array} {
        assert(this.isV1199)
        return this._chain.decodeEvent(this.event)
    }
}

export class PhalaComputationWorkerExitUnresponsiveEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'PhalaComputation.WorkerExitUnresponsive')
        this._chain = ctx._chain
        this.event = event
    }

    /**
     * Worker returns to responsive state.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated from `WorkerUnresponsive` to `WorkerIdle`
     */
    get isV1199(): boolean {
        return this._chain.getEventHash('PhalaComputation.WorkerExitUnresponsive') === 'da6fbbac52b4be480812462fce29bab263d644f64756e825d79ddc539a21abdb'
    }

    /**
     * Worker returns to responsive state.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated from `WorkerUnresponsive` to `WorkerIdle`
     */
    get asV1199(): {session: Uint8Array} {
        assert(this.isV1199)
        return this._chain.decodeEvent(this.event)
    }
}

export class PhalaComputationWorkerReclaimedEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'PhalaComputation.WorkerReclaimed')
        this._chain = ctx._chain
        this.event = event
    }

    /**
     * Worker is reclaimed, with its slash settled.
     */
    get isV1199(): boolean {
        return this._chain.getEventHash('PhalaComputation.WorkerReclaimed') === '2acf61fd8096c1c9e960d99c92081c668a3e12bf02faf545a8412185ed26c1c3'
    }

    /**
     * Worker is reclaimed, with its slash settled.
     */
    get asV1199(): {session: Uint8Array, originalStake: bigint, slashed: bigint} {
        assert(this.isV1199)
        return this._chain.decodeEvent(this.event)
    }
}

export class PhalaComputationWorkerStartedEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'PhalaComputation.WorkerStarted')
        this._chain = ctx._chain
        this.event = event
    }

    /**
     * A worker starts computing.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated with `WorkerIdle` state
     * - [`NextSessionId`] for the session is incremented
     * - [`Stakes`] for the session is updated
     * - [`OnlineWorkers`] is incremented
     */
    get isV1199(): boolean {
        return this._chain.getEventHash('PhalaComputation.WorkerStarted') === '012bfc0408798da4d4b2bfbbc98beeb36833493fa36125d9ec82eedf5f1a8874'
    }

    /**
     * A worker starts computing.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated with `WorkerIdle` state
     * - [`NextSessionId`] for the session is incremented
     * - [`Stakes`] for the session is updated
     * - [`OnlineWorkers`] is incremented
     */
    get asV1199(): {session: Uint8Array, initV: bigint, initP: number} {
        assert(this.isV1199)
        return this._chain.decodeEvent(this.event)
    }
}

export class PhalaComputationWorkerStoppedEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'PhalaComputation.WorkerStopped')
        this._chain = ctx._chain
        this.event = event
    }

    /**
     * Worker stops computing.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated with `WorkerCoolingDown` state
     * - [`OnlineWorkers`] is decremented
     */
    get isV1199(): boolean {
        return this._chain.getEventHash('PhalaComputation.WorkerStopped') === 'da6fbbac52b4be480812462fce29bab263d644f64756e825d79ddc539a21abdb'
    }

    /**
     * Worker stops computing.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated with `WorkerCoolingDown` state
     * - [`OnlineWorkers`] is decremented
     */
    get asV1199(): {session: Uint8Array} {
        assert(this.isV1199)
        return this._chain.decodeEvent(this.event)
    }
}

export class PhalaRegistryInitialScoreSetEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'PhalaRegistry.InitialScoreSet')
        this._chain = ctx._chain
        this.event = event
    }

    get isV1182(): boolean {
        return this._chain.getEventHash('PhalaRegistry.InitialScoreSet') === '9178da6c60711edb6a539f26f333d754493f4e28ed8719c2f7892f1fe44e9b03'
    }

    get asV1182(): {pubkey: Uint8Array, initScore: number} {
        assert(this.isV1182)
        return this._chain.decodeEvent(this.event)
    }
}

export class PhalaRegistryWorkerAddedEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'PhalaRegistry.WorkerAdded')
        this._chain = ctx._chain
        this.event = event
    }

    get isV1160(): boolean {
        return this._chain.getEventHash('PhalaRegistry.WorkerAdded') === '98e1831cdc7afe0dd8966284b7cee8ea75fc4fd6863a6d40e24a40480576f3a2'
    }

    get asV1160(): {pubkey: Uint8Array} {
        assert(this.isV1160)
        return this._chain.decodeEvent(this.event)
    }

    get isV1182(): boolean {
        return this._chain.getEventHash('PhalaRegistry.WorkerAdded') === 'fece23d904013d68e6f2bcd30d560888a8f9ef5c1194a230ccfe4ebcd8fd8aaa'
    }

    get asV1182(): {pubkey: Uint8Array, confidenceLevel: number} {
        assert(this.isV1182)
        return this._chain.decodeEvent(this.event)
    }

    get isV1199(): boolean {
        return this._chain.getEventHash('PhalaRegistry.WorkerAdded') === '62aabfc3b7ad514db79224f111b8a77d10eec5bfb10570491e4ae9114115d90c'
    }

    get asV1199(): {pubkey: Uint8Array, attestationProvider: (v1199.AttestationProvider | undefined), confidenceLevel: number} {
        assert(this.isV1199)
        return this._chain.decodeEvent(this.event)
    }

    get isV1260(): boolean {
        return this._chain.getEventHash('PhalaRegistry.WorkerAdded') === '4dd51267274653ad03548966b7fc0142c3a3e84c792eeb734aa69b56dfdd3e5a'
    }

    get asV1260(): {pubkey: Uint8Array, attestationProvider: (v1260.AttestationProvider | undefined), confidenceLevel: number} {
        assert(this.isV1260)
        return this._chain.decodeEvent(this.event)
    }
}

export class PhalaRegistryWorkerUpdatedEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'PhalaRegistry.WorkerUpdated')
        this._chain = ctx._chain
        this.event = event
    }

    get isV1160(): boolean {
        return this._chain.getEventHash('PhalaRegistry.WorkerUpdated') === '98e1831cdc7afe0dd8966284b7cee8ea75fc4fd6863a6d40e24a40480576f3a2'
    }

    get asV1160(): {pubkey: Uint8Array} {
        assert(this.isV1160)
        return this._chain.decodeEvent(this.event)
    }

    get isV1182(): boolean {
        return this._chain.getEventHash('PhalaRegistry.WorkerUpdated') === 'fece23d904013d68e6f2bcd30d560888a8f9ef5c1194a230ccfe4ebcd8fd8aaa'
    }

    get asV1182(): {pubkey: Uint8Array, confidenceLevel: number} {
        assert(this.isV1182)
        return this._chain.decodeEvent(this.event)
    }

    get isV1199(): boolean {
        return this._chain.getEventHash('PhalaRegistry.WorkerUpdated') === '62aabfc3b7ad514db79224f111b8a77d10eec5bfb10570491e4ae9114115d90c'
    }

    get asV1199(): {pubkey: Uint8Array, attestationProvider: (v1199.AttestationProvider | undefined), confidenceLevel: number} {
        assert(this.isV1199)
        return this._chain.decodeEvent(this.event)
    }

    get isV1260(): boolean {
        return this._chain.getEventHash('PhalaRegistry.WorkerUpdated') === '4dd51267274653ad03548966b7fc0142c3a3e84c792eeb734aa69b56dfdd3e5a'
    }

    get asV1260(): {pubkey: Uint8Array, attestationProvider: (v1260.AttestationProvider | undefined), confidenceLevel: number} {
        assert(this.isV1260)
        return this._chain.decodeEvent(this.event)
    }
}
