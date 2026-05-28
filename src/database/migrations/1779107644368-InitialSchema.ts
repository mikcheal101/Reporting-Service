import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1779107644368 implements MigrationInterface {
  name = 'InitialSchema1779107644368';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "connection" ADD "userId" int`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "connection" DROP COLUMN "userId"`);
  }
}
