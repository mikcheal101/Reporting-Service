import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDescriptionToConnection1779307644370 implements MigrationInterface {
    name = 'AddDescriptionToConnection1779307644370'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "connection" ADD "description" nvarchar(500) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "connection" DROP COLUMN "description"`);
    }
}
