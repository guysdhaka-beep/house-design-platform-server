const prisma = require("../prisma");
const bcrypt = require("bcryptjs");

async function main() {
  const username = "admin";
  const password = "admin123";

  const exists = await prisma.admin.findUnique({
    where: {
      username,
    },
  });

  if (exists) {
    await prisma.admin.delete({
      where: {
        username,
      },
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.admin.create({
    data: {
      username,
      password: hashedPassword,
    },
  });

  console.log("Admin created successfully.");
  console.log("Username:", username);
  console.log("Password:", password);

  process.exit(0);
}

main().catch((err) => {
  console.log(err);
  process.exit(1);
});