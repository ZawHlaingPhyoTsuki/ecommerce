import "tsconfig-paths/register";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { setupMiddlewares } from "./config/middleware.config";
import { loggerOptions } from "./config/logger.config";
import { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		// Don't worry, the library will automatically re-add the default body parsers.
		bodyParser: false,
		logger: loggerOptions,
	});
	setupMiddlewares(app);
	app.enableShutdownHooks();
	await app.listen(process.env.PORT ?? 3000);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
