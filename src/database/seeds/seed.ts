// database/seeds/seed.ts

import { INestApplicationContext, Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "src/app.module";
import { PermissionSeed } from "./permission.seed";
import { RoleSeed } from "./role.seed";
import { UserSeed } from "./user.seed";

const bootstrap = async () => {
  const applicationContext: INestApplicationContext = await NestFactory.createApplicationContext(AppModule);

  await PermissionSeed.run(applicationContext);
  await RoleSeed.run(applicationContext);
  await UserSeed.run(applicationContext);

  await applicationContext.close();
};

const logger: Logger = new Logger(bootstrap.name);
bootstrap()
  .then(() => {
    logger.log(`Seeding Completed!`);
    process.exit(0);
  })
  .catch((error: Error) => {
    logger.error(error.message, error.stack);
    process.exit(1);
  });
