import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { OrdersController } from "./controllers/orders.controller";
import { OrdersRepository } from "./repositories/orders.repository";
import { OrdersService } from "./services/orders.service";

@Module({
	imports: [PrismaModule],
	controllers: [OrdersController],
	providers: [OrdersService, OrdersRepository],
	exports: [OrdersService],
})
export class OrdersModule {}
