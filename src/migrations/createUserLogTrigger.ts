import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserLogTrigger implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION log_user_creation()
            RETURNS trigger AS $$
            BEGIN
                INSERT INTO "logUsers" ("log_in", "data_registro", "fk_user")
                VALUES (NOW(), NOW(), NEW.id);
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER after_user_insert
            AFTER INSERT ON "users"
            FOR EACH ROW
            EXECUTE FUNCTION log_user_creation();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TRIGGER IF EXISTS after_user_insert ON "users";
            DROP FUNCTION IF EXISTS log_user_creation;
        `);
  }
}
