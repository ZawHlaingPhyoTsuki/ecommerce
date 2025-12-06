import { PrismaService } from "src/modules/prisma/prisma.service";
import { auth } from "src/lib/auth";
import { USER_ROLE } from "src/common/constants/role";
import slugify from "slugify";
import { SellerApplicationStatus } from "generated/prisma/client";

const prismaService = new PrismaService();

async function main() {
	console.log(`Start seeding ...`);

	const authInstance = auth(prismaService);

	if (process.env.NODE_ENV !== "production") {
		// Clear existing data in non-production only
		console.log("Clearing database...");
		await prismaService.cartItem.deleteMany();
		await prismaService.cart.deleteMany();
		await prismaService.productImage.deleteMany();
		await prismaService.product.deleteMany();
		await prismaService.category.deleteMany();
		await prismaService.account.deleteMany();
		await prismaService.session.deleteMany();
		await prismaService.user.deleteMany();
	}

	const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
	const adminPassword = process.env.SEED_ADMIN_PASSWORD || "password123";

	// 1. Create Admin User
	console.log("Creating Admin User...");
	const adminRes = await authInstance.api.signUpEmail({
		body: {
			email: adminEmail,
			password: adminPassword,
			name: "Administrator",
		},
	});

	if (adminRes.user) {
		await prismaService.user.update({
			where: { id: adminRes.user.id },
			data: { role: USER_ROLE.ADMIN },
		});
		console.log(`Admin created: ${adminEmail}`);
	}

	// 2. Create Seller User
	console.log("Creating Seller User...");
	const sellerEmail = "seller@example.com";
	const sellerPassword = "password123";

	const sellerRes = await authInstance.api.signUpEmail({
		body: {
			email: sellerEmail,
			password: sellerPassword,
			name: "Official Seller",
		},
	});

	if (sellerRes.user) {
		await prismaService.user.update({
			where: { id: sellerRes.user.id },
			data: {
				role: USER_ROLE.SELLER,
				sellerApplicationStatus: SellerApplicationStatus.APPROVED,
				sellerApprovedAt: new Date(),
				sellerBio: "We provide top quality electronics and gadgets.",
				businessName: "TechStore Inc.",
				phone: "+1-555-0101",
				address: "123 Tech Avenue, Silicon Valley",
			},
		});
		console.log(`Seller created: ${sellerEmail}`);
	}

	// 3. Create Buyer User
	console.log("Creating Buyer User...");
	const buyerEmail = "buyer@example.com";
	const buyerPassword = "password123";

	const buyerRes = await authInstance.api.signUpEmail({
		body: {
			email: buyerEmail,
			password: buyerPassword,
			name: "John Buyer",
		},
	});

	if (buyerRes.user) {
		// Role defaults to BUYER
		console.log(`Buyer created: ${buyerEmail}`);
	}

	// 4. Create Categories
	console.log("Creating Categories...");
	const categories = [
		{ name: "Electronics", description: "Gadgets, phones, and computers" },
		{ name: "Fashion", description: "Clothing, shoes, and accessories" },
		{ name: "Home & Garden", description: "Furniture, decor, and gardening" },
		{ name: "Books", description: "Fiction, non-fiction, and educational" },
	];

	const categoryMap = new Map();

	for (const cat of categories) {
		const slug = slugify(cat.name, { lower: true });
		const category = await prismaService.category.upsert({
			where: { slug },
			update: {},
			create: {
				name: cat.name,
				slug,
			},
		});
		categoryMap.set(cat.name, category);
		console.log(`Category created: ${cat.name}`);
	}

	// 5. Create Products
	if (sellerRes.user) {
		console.log("Creating Products...");

		const products = [
			{
				name: "Smartphone X Pro",
				category: "Electronics",
				price: 999.99,
				stock: 50,
				description: "Latest flagship smartphone with amazing camera.",
				images: ["https://placehold.co/600x400/png?text=Smartphone+X"],
			},
			{
				name: "Wireless Noise Cancelling Headphones",
				category: "Electronics",
				price: 249.5,
				stock: 100,
				description:
					"Immersive sound experience with active noise cancellation.",
				images: ["https://placehold.co/600x400/png?text=Headphones"],
			},
			{
				name: "Cotton T-Shirt",
				category: "Fashion",
				price: 19.99,
				stock: 200,
				description: "Comfortable 100% cotton t-shirt in various sizes.",
				images: ["https://placehold.co/600x400/png?text=T-Shirt"],
			},
			{
				name: "Ergonomic Office Chair",
				category: "Home & Garden",
				price: 159.0,
				stock: 15,
				description: "Work in comfort with this adjustable ergonomic chair.",
				images: ["https://placehold.co/600x400/png?text=Office+Chair"],
			},
		];

		for (const prod of products) {
			const category = categoryMap.get(prod.category);
			if (!category) continue;

			const slug =
				slugify(prod.name, { lower: true }) +
				"-" +
				Math.random().toString(36).substring(7);

			await prismaService.product.create({
				data: {
					name: prod.name,
					slug,
					description: prod.description,
					price: prod.price,
					stock: prod.stock,
					categoryId: category.id,
					sellerId: sellerRes.user.id,
					isAvailable: true,
				},
			});
			console.log(`Product created: ${prod.name}`);
		}
	}

	console.log(`Seeding finished.`);
}

main()
	.then(async () => {
		await prismaService.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prismaService.$disconnect();
		process.exit(1);
	});
