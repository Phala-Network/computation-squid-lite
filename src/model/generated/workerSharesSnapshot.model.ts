import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class WorkerSharesSnapshot {
    constructor(props?: Partial<WorkerSharesSnapshot>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    /**
     * block time
     */
    @Column_("timestamp with time zone", {nullable: false})
    updatedTime!: Date

    @Column_("numeric", {transformer: marshal.bigdecimalTransformer, nullable: false})
    shares!: BigDecimal
}
