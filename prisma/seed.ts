import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const reasons = [
  "DAMAGED",
  "WRONG_ITEM",
  "SIZE_ISSUE",
  "NOT_AS_DESCRIBED",
  "CHANGED_MIND",
] as const;

const statuses = [
  "OPEN",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
] as const;

const resolutions = [
  "REFUND",
  "REPLACEMENT",
  "STORE_CREDIT",
] as const;

const customers = [
  "Aarav Sharma",
  "Priya Mehta",
  "Rohan Verma",
  "Ananya Singh",
  "Kabir Kapoor",
  "Meera Joshi",
  "Arjun Malhotra",
  "Ishita Gupta",
  "Rahul Bansal",
  "Sneha Agarwal",
];

const products = [
  "Wireless Headphones",
  "Running Shoes",
  "Cotton T-Shirt",
  "Laptop Stand",
  "Smart Watch",
  "Backpack",
  "Bluetooth Speaker",
  "Coffee Maker",
  "Mechanical Keyboard",
  "Travel Organizer",
];

function generateReference(index: number) {
  return `RET-SEED-${String(index).padStart(4, "0")}`;
}

async function main() {
  console.log("Starting ReturnDesk seed...");

  /*
   * Clear existing records.
   *
   * Notes must be deleted first because they reference
   * return requests.
   */
  await prisma.note.deleteMany();
  await prisma.returnRequest.deleteMany();

  let createdCount = 0;
  let createdNoteCount = 0;

  /*
   * Create:
   *
   * 6 OPEN
   * 6 IN_REVIEW
   * 6 APPROVED
   * 6 REJECTED
   * 6 COMPLETED
   *
   * Total = 30
   */
  for (const status of statuses) {
    for (let i = 0; i < 6; i++) {
      const index = createdCount + 1;

      const customer =
        customers[(index - 1) % customers.length];

      const product =
        products[(index - 1) % products.length];

      const reason =
        reasons[(index - 1) % reasons.length];

      /*
       * Only APPROVED and COMPLETED requests receive
       * a resolution.
       */
      let resolution:
        | (typeof resolutions)[number]
        | null = null;

      let refundAmount: number | null = null;

      if (
        status === "APPROVED" ||
        status === "COMPLETED"
      ) {
        resolution =
          resolutions[(index - 1) % resolutions.length];

        /*
         * Refund amount is ONLY present for Refund.
         */
        if (resolution === "REFUND") {
          refundAmount = 500 + index * 25;
        }
      }

      const createdRequest =
        await prisma.returnRequest.create({
          data: {
            reference: generateReference(index),

            customerName: customer,

            customerEmail:
              `${customer
                .toLowerCase()
                .replace(/\s+/g, ".")}@example.com`,

            customerPhone:
              `987650${String(index).padStart(4, "0")}`,

            orderId:
              `ORD-SEED-${String(index).padStart(4, "0")}`,

            itemName: product,

            quantity: ((index - 1) % 3) + 1,

            reason,

            status,

            resolution,

            refundAmount,
          },
        });

      createdCount++;

      /*
       * Add notes to every second request.
       */
      if (index % 2 === 0) {
        await prisma.note.create({
          data: {
            returnRequestId:
              createdRequest.id,

            body:
              "Return request reviewed by the support team.",
          },
        });

        await prisma.note.create({
          data: {
            returnRequestId:
              createdRequest.id,

            body:
              "Customer communication recorded for audit history.",
          },
        });

        createdNoteCount += 2;
      }
    }
  }

  console.log(
    `Created ${createdCount} return requests.`
  );

  console.log(
    `Created ${createdNoteCount} notes.`
  );

  /*
   * Verify distribution.
   */
  for (const status of statuses) {
    const count =
      await prisma.returnRequest.count({
        where: {
          status,
        },
      });

    console.log(
      `${status}: ${count} requests`
    );
  }

  console.log("ReturnDesk seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });