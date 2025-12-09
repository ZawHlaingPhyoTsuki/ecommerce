import { PrismaService } from "src/modules/prisma/prisma.service";
import { auth } from "src/lib/auth";
import { USER_ROLE } from "src/common/constants/role";
import slugify from "slugify";
import {
	SellerApplicationStatus,
	Category,
	Product,
} from "generated/prisma/client";
import { faker } from "@faker-js/faker";

const prismaService = new PrismaService();

// Type definitions
interface SellerData {
	id: string;
	name: string;
	businessName: string;
}

interface BuyerData {
	id: string;
	name: string;
	email: string;
}

interface ProductTemplate {
	name: string;
	prefix: string;
	brands: string[];
}

async function main() {
	console.log(`🚀 Starting database seeding with Faker.js...`);

	const authInstance = auth(prismaService);

	// Only clear data in non-production
	if (process.env.NODE_ENV !== "production") {
		console.log("🧹 Clearing existing database data...");
		// Delete in correct order to respect foreign key constraints
		await prismaService.orderItem.deleteMany();
		await prismaService.order.deleteMany();
		await prismaService.cartItem.deleteMany();
		await prismaService.cart.deleteMany();
		await prismaService.productRating.deleteMany();
		await prismaService.productImage.deleteMany();
		await prismaService.product.deleteMany();
		await prismaService.category.deleteMany();
		await prismaService.account.deleteMany();
		await prismaService.session.deleteMany();
		await prismaService.user.deleteMany();
	}

	const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
	const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123";

	// ==================== USERS ====================
	console.log("👥 Creating users...");

	// Arrays with explicit types
	const sellers: SellerData[] = [];
	const buyers: BuyerData[] = [];

	// 1. Create Admin User
	const adminRes = await authInstance.api.signUpEmail({
		body: {
			email: adminEmail,
			password: adminPassword,
			name: "System Administrator",
		},
	});

	if (adminRes.user) {
		await prismaService.user.update({
			where: { id: adminRes.user.id },
			data: {
				role: USER_ROLE.ADMIN,
				emailVerified: true,
				phone: faker.phone.number(),
				address: faker.location.streetAddress(),
			},
		});
		console.log(`✅ Admin created: ${adminEmail}`);
	}

	// 2. Create Sellers (5 sellers)
	for (let i = 0; i < 5; i++) {
		const sellerData = {
			email: faker.internet.email().toLowerCase(),
			password: "Seller@123",
			name: faker.person.fullName(),
		};

		try {
			const sellerRes = await authInstance.api.signUpEmail({
				body: sellerData,
			});

			if (sellerRes.user) {
				const businessName = faker.company.name();
				await prismaService.user.update({
					where: { id: sellerRes.user.id },
					data: {
						role: USER_ROLE.SELLER,
						sellerApplicationStatus: SellerApplicationStatus.APPROVED,
						sellerApprovedAt: new Date(),
						sellerBio: faker.lorem.paragraph(),
						businessName: businessName,
						phone: faker.phone.number(),
						address: faker.location.streetAddress(),
						emailVerified: true,
						image: faker.image.avatar(),
					},
				});

				sellers.push({
					id: sellerRes.user.id,
					name: sellerData.name,
					businessName,
				});
				console.log(`✅ Seller ${i + 1} created: ${sellerData.email}`);
			}
		} catch (_error) {
			console.log(`⚠️ Skipping duplicate seller: ${sellerData.email}`);
		}
	}

	// 3. Create Buyers (10 buyers)
	for (let i = 0; i < 10; i++) {
		const buyerData = {
			email: faker.internet.email().toLowerCase(),
			password: "Buyer@123",
			name: faker.person.fullName(),
		};

		try {
			const buyerRes = await authInstance.api.signUpEmail({
				body: buyerData,
			});

			if (buyerRes.user) {
				await prismaService.user.update({
					where: { id: buyerRes.user.id },
					data: {
						role: USER_ROLE.BUYER,
						phone: faker.phone.number(),
						address: faker.location.streetAddress(),
						emailVerified: true,
						image: faker.image.avatar(),
					},
				});

				buyers.push({
					id: buyerRes.user.id,
					name: buyerData.name,
					email: buyerData.email,
				});
				console.log(`✅ Buyer ${i + 1} created: ${buyerData.email}`);
			}
		} catch (_error) {
			console.log(`⚠️ Skipping duplicate buyer: ${buyerData.email}`);
		}
	}

	// ==================== CATEGORIES ====================
	console.log("📂 Creating categories...");

	const categoriesData = [
		{ name: "Electronics", emoji: "📱" },
		{ name: "Fashion", emoji: "👕" },
		{ name: "Home & Garden", emoji: "🏡" },
		{ name: "Books & Media", emoji: "📚" },
		{ name: "Sports & Outdoors", emoji: "⚽" },
		{ name: "Health & Beauty", emoji: "💄" },
		{ name: "Toys & Games", emoji: "🎮" },
		{ name: "Automotive", emoji: "🚗" },
		{ name: "Food & Grocery", emoji: "🍎" },
		{ name: "Office Supplies", emoji: "💼" },
	];

	const categories: Category[] = [];
	for (const cat of categoriesData) {
		const slug = slugify(cat.name, { lower: true });
		const category = await prismaService.category.upsert({
			where: { slug },
			update: {},
			create: {
				name: cat.name,
				slug,
				image: faker.image.urlPicsumPhotos({
					width: 800,
					height: 400,
				}),
				imagePublicId: `category-${slug}`,
			},
		});
		categories.push(category);
		console.log(`✅ Category created: ${cat.emoji} ${cat.name}`);
	}

	// ==================== PRODUCTS ====================
	console.log("🛍️ Creating products...");

	// Product templates by category
	const productTemplates: Record<string, ProductTemplate[]> = {
		Electronics: [
			{
				name: "Smartphone",
				prefix: "Phone",
				brands: ["iPhone", "Samsung", "Google", "OnePlus", "Xiaomi"],
			},
			{
				name: "Laptop",
				prefix: "Laptop",
				brands: ["MacBook", "Dell", "HP", "Lenovo", "Asus"],
			},
			{
				name: "Headphones",
				prefix: "Headphones",
				brands: ["Sony", "Bose", "Apple", "Sennheiser", "JBL"],
			},
			{
				name: "Smart Watch",
				prefix: "Watch",
				brands: ["Apple", "Samsung", "Fitbit", "Garmin", "Amazfit"],
			},
			{
				name: "Tablet",
				prefix: "Tablet",
				brands: ["iPad", "Samsung", "Microsoft", "Amazon", "Lenovo"],
			},
		],
		Fashion: [
			{
				name: "T-Shirt",
				prefix: "T-Shirt",
				brands: ["Nike", "Adidas", "Levi's", "Uniqlo", "H&M"],
			},
			{
				name: "Jeans",
				prefix: "Jeans",
				brands: ["Levi's", "Wrangler", "Lee", "Diesel", "Calvin Klein"],
			},
			{
				name: "Sneakers",
				prefix: "Sneakers",
				brands: ["Nike", "Adidas", "Converse", "Vans", "Puma"],
			},
			{
				name: "Jacket",
				prefix: "Jacket",
				brands: ["North Face", "Columbia", "Patagonia", "Superdry", "Zara"],
			},
			{
				name: "Dress",
				prefix: "Dress",
				brands: ["Zara", "H&M", "Forever 21", "Mango", "ASOS"],
			},
		],
		"Home & Garden": [
			{
				name: "Chair",
				prefix: "Chair",
				brands: ["IKEA", "Herman Miller", "Steelcase", "La-Z-Boy", "West Elm"],
			},
			{
				name: "Lamp",
				prefix: "Lamp",
				brands: ["IKEA", "Philips", "West Elm", "CB2", "Article"],
			},
			{
				name: "Plant",
				prefix: "Plant",
				brands: [
					"The Sill",
					"Bloomscape",
					"Costa Farms",
					"Plants.com",
					"Home Depot",
				],
			},
			{
				name: "Cookware",
				prefix: "Cookware",
				brands: ["All-Clad", "Le Creuset", "Calphalon", "Cuisinart", "T-fal"],
			},
			{
				name: "Bedding",
				prefix: "Bedding",
				brands: ["Brooklinen", "Parachute", "Boll & Branch", "Casper", "Snowe"],
			},
		],
		"Books & Media": [
			{
				name: "Book",
				prefix: "Book",
				brands: [
					"Penguin",
					"HarperCollins",
					"Random House",
					"Simon & Schuster",
					"Macmillan",
				],
			},
			{
				name: "Game",
				prefix: "Game",
				brands: ["Nintendo", "Sony", "Microsoft", "Ubisoft", "EA"],
			},
			{
				name: "Movie",
				prefix: "Movie",
				brands: [
					"Disney",
					"Warner Bros",
					"Universal",
					"Paramount",
					"Sony Pictures",
				],
			},
		],
		"Sports & Outdoors": [
			{
				name: "Equipment",
				prefix: "Sports",
				brands: ["Nike", "Adidas", "Under Armour", "Reebok", "Puma"],
			},
			{
				name: "Bicycle",
				prefix: "Bike",
				brands: ["Trek", "Specialized", "Giant", "Cannondale", "Scott"],
			},
		],
	};

	const products: Product[] = [];
	for (const seller of sellers) {
		console.log(`📦 Creating products for seller: ${seller.businessName}`);

		// Each seller gets 5-10 products
		const productCount = faker.number.int({ min: 5, max: 10 });

		for (let i = 0; i < productCount; i++) {
			const category = faker.helpers.arrayElement(categories);
			const templates = productTemplates[category.name] || [];
			const template =
				templates.length > 0
					? faker.helpers.arrayElement(templates)
					: { name: "Product", prefix: "Product", brands: ["Generic"] };

			const brand = faker.helpers.arrayElement(template.brands);
			const model = faker.helpers.arrayElement([
				"Pro",
				"Max",
				"Ultra",
				"Lite",
				"Plus",
				"Elite",
				"Premium",
				"Standard",
			]);

			const productName = `${brand} ${template.prefix} ${model} ${faker.number.int({ min: 1000, max: 9999 })}`;
			const baseSlug = slugify(productName, { lower: true });
			const uniqueSlug = `${baseSlug}-${faker.string.alphanumeric(8)}`;

			const price = faker.commerce.price({
				min: 10,
				max: 2000,
				dec: 2,
			});

			const product = await prismaService.product.create({
				data: {
					name: productName,
					slug: uniqueSlug,
					description: faker.commerce.productDescription(),
					price: parseFloat(price),
					stock: faker.number.int({ min: 0, max: 100 }),
					isAvailable: faker.datatype.boolean(0.8), // 80% available
					categoryId: category.id,
					sellerId: seller.id,
					rating: parseFloat(
						faker.number
							.float({ min: 1, max: 5, fractionDigits: 1 })
							.toFixed(1),
					),
					ratingCount: faker.number.int({ min: 0, max: 500 }),
				},
			});

			// Add 1-4 images for each product
			const imageCount = faker.number.int({ min: 1, max: 4 });
			for (let j = 0; j < imageCount; j++) {
				await prismaService.productImage.create({
					data: {
						productId: product.id,
						url: faker.image.urlPicsumPhotos({
							width: 800,
							height: 600,
							blur: j === 0 ? 0 : 2, // First image is clear
						}),
						publicId: `product-${product.id}-${j}`,
						order: j,
					},
				});
			}

			products.push(product);
			console.log(`   📍 Product: ${productName} ($${price})`);
		}
	}

	console.log(`✅ Total products created: ${products.length}`);

	// ==================== RATINGS ====================
	console.log("⭐ Creating product ratings...");

	for (const product of products.slice(0, 30)) {
		// Rate first 30 products
		// Each product gets 5-20 ratings
		const ratingCount = faker.number.int({ min: 5, max: 20 });
		const ratedUsers = new Set<string>(); // Prevent duplicate ratings

		for (let i = 0; i < ratingCount; i++) {
			const buyer = faker.helpers.arrayElement(buyers);

			// Ensure each buyer rates a product only once
			if (ratedUsers.has(buyer.id)) continue;
			ratedUsers.add(buyer.id);

			try {
				await prismaService.productRating.create({
					data: {
						productId: product.id,
						userId: buyer.id,
						rating: parseFloat(
							faker.number
								.float({
									min: 1,
									max: 5,
									fractionDigits: 1,
								})
								.toFixed(1),
						),
					},
				});
			} catch (_error) {
				// Skip if duplicate rating (shouldn't happen with Set)
			}
		}
		console.log(
			`   ⭐ Product "${product.name.substring(0, 30)}..." has ${ratingCount} ratings`,
		);
	}

	// ==================== ORDERS ====================
	console.log("📦 Creating orders...");

	// Define interface for product with quantity
	interface ProductWithQuantity {
		product: Product;
		quantity: number;
	}

	for (const buyer of buyers.slice(0, 5)) {
		// First 5 buyers place orders
		// Each buyer places 1-3 orders
		const orderCount = faker.number.int({ min: 1, max: 3 });

		for (let orderIndex = 0; orderIndex < orderCount; orderIndex++) {
			// Select 1-4 random products
			const availableProducts = products.filter(
				(p) => p.isAvailable && p.stock > 0,
			);
			const selectedProducts = faker.helpers.arrayElements(
				availableProducts,
				Math.min(
					faker.number.int({ min: 1, max: 4 }),
					availableProducts.length,
				),
			);

			// Group products by seller
			const productsBySeller = new Map<string, ProductWithQuantity[]>();
			for (const product of selectedProducts) {
				if (!productsBySeller.has(product.sellerId)) {
					productsBySeller.set(product.sellerId, []);
				}
				productsBySeller.get(product.sellerId)?.push({
					product,
					quantity: faker.number.int({ min: 1, max: 3 }),
				});
			}

			// Create one order per seller
			for (const [sellerId, sellerProducts] of productsBySeller) {
				const totalAmount = sellerProducts.reduce(
					(sum: number, item: ProductWithQuantity) =>
						sum + parseFloat(item.product.price.toString()) * item.quantity,
					0,
				);

				const order = await prismaService.order.create({
					data: {
						buyerId: buyer.id,
						sellerId,
						shippingAddress: faker.location.streetAddress(),
						phone: faker.phone.number(),
						totalAmount,
						status: faker.helpers.arrayElement([
							"PENDING",
							"CONFIRMED",
							"SHIPPED",
							"DELIVERED",
						]),
					},
				});

				// Add order items
				for (const item of sellerProducts) {
					await prismaService.orderItem.create({
						data: {
							orderId: order.id,
							productId: item.product.id,
							quantity: item.quantity,
							price: item.product.price,
							productNameSnapShot: item.product.name,
						},
					});

					// Update product stock
					await prismaService.product.update({
						where: { id: item.product.id },
						data: {
							stock: {
								decrement: item.quantity,
							},
						},
					});
				}

				const seller = sellers.find((s) => s.id === sellerId);
				console.log(
					`   📦 Order ${order.id.substring(0, 8)}... for ${buyer.name} from ${seller?.businessName || "Seller"}`,
				);
			}
		}
	}

	// ==================== CARTS ====================
	console.log("🛒 Creating shopping carts...");

	for (const buyer of buyers.slice(5)) {
		// Remaining buyers have carts
		const cart = await prismaService.cart.create({
			data: {
				userId: buyer.id,
			},
		});

		// Add 1-3 items to cart
		const cartItemsCount = faker.number.int({ min: 1, max: 3 });
		const availableProducts = products.filter(
			(p) => p.isAvailable && p.stock > 0,
		);
		const cartProducts = faker.helpers.arrayElements(
			availableProducts,
			Math.min(cartItemsCount, availableProducts.length),
		);

		for (const product of cartProducts) {
			await prismaService.cartItem.create({
				data: {
					cartId: cart.id,
					productId: product.id,
					quantity: faker.number.int({ min: 1, max: 2 }),
				},
			});
		}

		console.log(
			`   🛒 Cart for ${buyer.name} with ${cartProducts.length} items`,
		);
	}

	// ==================== SUMMARY ====================
	console.log(`\n${"=".repeat(50)}`);
	console.log("📊 SEEDING SUMMARY");
	console.log("=".repeat(50));
	console.log(
		`👥 Users: 1 Admin, ${sellers.length} Sellers, ${buyers.length} Buyers`,
	);
	console.log(`📂 Categories: ${categories.length}`);
	console.log(`🛍️ Products: ${products.length}`);
	console.log(
		`⭐ Ratings: Created for ${Math.min(30, products.length)} products`,
	);
	console.log(`📦 Orders: Created for ${Math.min(5, buyers.length)} buyers`);
	console.log(`🛒 Carts: Created for ${Math.max(0, buyers.length - 5)} buyers`);
	console.log("\n🌱 Seeding completed successfully!");
	console.log("=".repeat(50));
}

main()
	.then(async () => {
		await prismaService.$disconnect();
	})
	.catch(async (e) => {
		console.error("❌ Seeding error:", e);
		await prismaService.$disconnect();
		process.exit(1);
	});
