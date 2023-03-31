import assert from 'assert'
import {Chain, ChainContext, EventContext, Event, Result, Option} from './support'

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
    get isV1225(): boolean {
        return this._chain.getEventHash('PhalaComputation.BenchmarkUpdated') === 'bf11f26c57bc5a22fb034fbf2a7aeee05ab0bc45f2a8a333f9e31eae55391087'
    }

    /**
     * Benchmark Updated
     */
    get asV1225(): {session: Uint8Array, pInstant: number} {
        assert(this.isV1225)
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
    get isV1225(): boolean {
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
    get asV1225(): {session: Uint8Array, worker: Uint8Array} {
        assert(this.isV1225)
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
    get isV1225(): boolean {
        return this._chain.getEventHash('PhalaComputation.SessionSettled') === 'ffc821674f60c9133eb49c3cf9ce9042e58fca0d906787401561ee8f598b62a4'
    }

    /**
     * Worker settled successfully.
     * 
     * It results in the v in [`Sessions`] being updated. It also indicates the downstream
     * stake pool has received the computing reward (payout), and the treasury has received the
     * tax.
     */
    get asV1225(): {session: Uint8Array, vBits: bigint, payoutBits: bigint} {
        assert(this.isV1225)
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
    get isV1225(): boolean {
        return this._chain.getEventHash('PhalaComputation.SessionUnbound') === 'f46e4c120214de2ad267cd7a520409879e8f20c8fed92bda090ef495de03ca3d'
    }

    /**
     * Worker & worker are unbound.
     * 
     * Affected states:
     * - [`SessionBindings`] for the session account is removed
     * - [`WorkerBindings`] for the worker is removed
     */
    get asV1225(): {session: Uint8Array, worker: Uint8Array} {
        assert(this.isV1225)
        return this._chain.decodeEvent(this.event)
    }
}

export class PhalaComputationTokenomicParametersChangedEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'PhalaComputation.TokenomicParametersChanged')
        this._chain = ctx._chain
        this.event = event
    }

    /**
     * Tokenomic parameter changed.
     * 
     * Affected states:
     * - [`TokenomicParameters`] is updated.
     */
    get isV1225(): boolean {
        return this._chain.getEventHash('PhalaComputation.TokenomicParametersChanged') === '01f2f9c28aa1d4d36a81ff042620b6677d25bf07c2bf4acc37b58658778a4fca'
    }

    /**
     * Tokenomic parameter changed.
     * 
     * Affected states:
     * - [`TokenomicParameters`] is updated.
     */
    get asV1225(): null {
        assert(this.isV1225)
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
    get isV1225(): boolean {
        return this._chain.getEventHash('PhalaComputation.WorkerEnterUnresponsive') === 'da6fbbac52b4be480812462fce29bab263d644f64756e825d79ddc539a21abdb'
    }

    /**
     * Worker enters unresponsive state.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated from `WorkerIdle` to `WorkerUnresponsive`
     */
    get asV1225(): {session: Uint8Array} {
        assert(this.isV1225)
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
    get isV1225(): boolean {
        return this._chain.getEventHash('PhalaComputation.WorkerExitUnresponsive') === 'da6fbbac52b4be480812462fce29bab263d644f64756e825d79ddc539a21abdb'
    }

    /**
     * Worker returns to responsive state.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated from `WorkerUnresponsive` to `WorkerIdle`
     */
    get asV1225(): {session: Uint8Array} {
        assert(this.isV1225)
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
    get isV1225(): boolean {
        return this._chain.getEventHash('PhalaComputation.WorkerReclaimed') === '2acf61fd8096c1c9e960d99c92081c668a3e12bf02faf545a8412185ed26c1c3'
    }

    /**
     * Worker is reclaimed, with its slash settled.
     */
    get asV1225(): {session: Uint8Array, originalStake: bigint, slashed: bigint} {
        assert(this.isV1225)
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
    get isV1225(): boolean {
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
    get asV1225(): {session: Uint8Array, initV: bigint, initP: number} {
        assert(this.isV1225)
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
    get isV1225(): boolean {
        return this._chain.getEventHash('PhalaComputation.WorkerStopped') === 'da6fbbac52b4be480812462fce29bab263d644f64756e825d79ddc539a21abdb'
    }

    /**
     * Worker stops computing.
     * 
     * Affected states:
     * - the worker info at [`Sessions`] is updated with `WorkerCoolingDown` state
     * - [`OnlineWorkers`] is decremented
     */
    get asV1225(): {session: Uint8Array} {
        assert(this.isV1225)
        return this._chain.decodeEvent(this.event)
    }
}
