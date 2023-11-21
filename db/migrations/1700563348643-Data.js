module.exports = class Data1700563348643 {
    name = 'Data1700563348643'

    async up(db) {
        await db.query(`ALTER TABLE "global_state" ADD "idle_worker_p_init" integer NOT NULL DEFAULT '0'`)
    }

    async down(db) {
        await db.query(`ALTER TABLE "global_state" DROP COLUMN "idle_worker_p_init"`)
    }
}
