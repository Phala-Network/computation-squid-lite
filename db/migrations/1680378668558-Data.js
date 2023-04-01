module.exports = class Data1680378668558 {
    name = 'Data1680378668558'

    async up(db) {
        await db.query(`CREATE TABLE "global_state" ("id" character varying NOT NULL, "idle_worker_shares" numeric NOT NULL, CONSTRAINT "PK_8b4db1150cf49bfd067e2572c74" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "session" ("id" character varying NOT NULL, "is_bound" boolean NOT NULL, "stake" numeric NOT NULL, "state" character varying(18) NOT NULL, "v" numeric NOT NULL, "ve" numeric NOT NULL, "p_init" integer NOT NULL, "p_instant" integer NOT NULL, "total_reward" numeric NOT NULL, "cooling_down_start_time" TIMESTAMP WITH TIME ZONE, "worker_id" character varying, CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_30db46e58a0ae3fbc408179de8" ON "session" ("worker_id") `)
        await db.query(`CREATE TABLE "worker" ("id" character varying NOT NULL, "confidence_level" integer NOT NULL, "initial_score" integer, "shares" numeric, "session_id" character varying, CONSTRAINT "PK_dc8175fa0e34ce7a39e4ec73b94" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_9d35228a135aa08da0b546b58a" ON "worker" ("session_id") `)
        await db.query(`CREATE TABLE "worker_shares_snapshot" ("id" character varying NOT NULL, "updated_time" TIMESTAMP WITH TIME ZONE NOT NULL, "shares" numeric, CONSTRAINT "PK_7278f433c0c7fa5d42fb9357ddb" PRIMARY KEY ("id"))`)
        await db.query(`ALTER TABLE "session" ADD CONSTRAINT "FK_30db46e58a0ae3fbc408179de88" FOREIGN KEY ("worker_id") REFERENCES "worker"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "worker" ADD CONSTRAINT "FK_9d35228a135aa08da0b546b58ab" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    async down(db) {
        await db.query(`DROP TABLE "global_state"`)
        await db.query(`DROP TABLE "session"`)
        await db.query(`DROP INDEX "public"."IDX_30db46e58a0ae3fbc408179de8"`)
        await db.query(`DROP TABLE "worker"`)
        await db.query(`DROP INDEX "public"."IDX_9d35228a135aa08da0b546b58a"`)
        await db.query(`DROP TABLE "worker_shares_snapshot"`)
        await db.query(`ALTER TABLE "session" DROP CONSTRAINT "FK_30db46e58a0ae3fbc408179de88"`)
        await db.query(`ALTER TABLE "worker" DROP CONSTRAINT "FK_9d35228a135aa08da0b546b58ab"`)
    }
}
