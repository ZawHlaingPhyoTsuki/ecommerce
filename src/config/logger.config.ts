import { LogLevel } from "@nestjs/common";

export const loggerOptions: LogLevel[] =
	process.env.NODE_ENV === "development"
		? ["log", "error", "warn", "verbose", "debug"]
		: ["log", "error", "warn"];
