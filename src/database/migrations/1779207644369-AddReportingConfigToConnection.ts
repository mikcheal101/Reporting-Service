import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReportingConfigToConnection1779207644369 implements MigrationInterface {
    name = 'AddReportingConfigToConnection1779207644369'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "connection" ADD "queryTimeout" int NOT NULL DEFAULT 60000`);
        await queryRunner.query(`ALTER TABLE "connection" ADD "cacheEnabled" bit NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "connection" ADD "cacheTtl" int NOT NULL DEFAULT 300`);
        await queryRunner.query(`ALTER TABLE "connection" ADD "streamEnabled" bit NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "connection" DROP COLUMN "streamEnabled"`);
        await queryRunner.query(`ALTER TABLE "connection" DROP COLUMN "cacheTtl"`);
        await queryRunner.query(`ALTER TABLE "connection" DROP COLUMN "cacheEnabled"`);
        await queryRunner.query(`ALTER TABLE "connection" DROP COLUMN "queryTimeout"`);
    }
}
