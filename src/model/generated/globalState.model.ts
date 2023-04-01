import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class GlobalState {
    constructor(props?: Partial<GlobalState>) {
        Object.assign(this, props)
    }

    /**
     * constant 0
     */
    @PrimaryColumn_()
    id!: string

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    idleWorkerShares!: BigDecimal
}
