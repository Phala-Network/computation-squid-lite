import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import {Session} from "./session.model"

@Entity_()
export class Worker {
    constructor(props?: Partial<Worker>) {
        Object.assign(this, props)
    }

    /**
     * worker public key
     */
    @PrimaryColumn_()
    id!: string


    @Column_("int4", {nullable: false})
    confidenceLevel!: number

    @Column_("int4", {nullable: true})
    initialScore!: number | undefined | null
}
