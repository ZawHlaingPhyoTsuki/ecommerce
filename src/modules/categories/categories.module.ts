import { Module } from "@nestjs/common";
import { CategoriesService } from "./services/categories.service";
import { CategoriesController } from "./controllers/categories.controller";
import { CategoryRepository } from "./repositories/category.repository";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
	imports: [CloudinaryModule, PrismaModule],
	controllers: [CategoriesController],
	providers: [CategoriesService, CategoryRepository],
	exports: [CategoriesService],
})
export class CategoriesModule {}
