import { Controller, Get, Logger } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";

@ApiTags("Home")
@Controller()
export class AppController {
	private readonly logger = new Logger(AppController.name);

	@Get("/hello")
	@ApiResponse({ status: 200, description: "Hello World" })
	@AllowAnonymous()
	getHello(): string {
		this.logger.log("Request to /hello");

		return "Hello World!";
	}
}
