import { PrismaClient, Role, ElectionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@university.edu" },
    update: {},
    create: {
      name: "System Admin",
      studentId: "ADMIN001",
      email: "admin@university.edu",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Student users
  const studentPassword = await bcrypt.hash("Student@123", 12);
  const students = await Promise.all(
    ["Alice Johnson", "Bob Smith", "Carol White", "David Brown"].map(
      (name, i) =>
        prisma.user.upsert({
          where: { email: `student${i + 1}@university.edu` },
          update: {},
          create: {
            name,
            studentId: `STU00${i + 1}`,
            email: `student${i + 1}@university.edu`,
            password: studentPassword,
            role: Role.STUDENT,
          },
        })
    )
  );

  // Election
  const election = await prisma.election.upsert({
    where: { id: "election-2026" },
    update: {},
    create: {
      id: "election-2026",
      title: "Student Council Election 2026",
      status: ElectionStatus.PENDING,
    },
  });

  // Positions
  const [presidentPos, vpPos, secPos] = await Promise.all([
    prisma.position.upsert({
      where: { name_electionId: { name: "President", electionId: election.id } },
      update: {},
      create: { name: "President", electionId: election.id },
    }),
    prisma.position.upsert({
      where: { name_electionId: { name: "Vice President", electionId: election.id } },
      update: {},
      create: { name: "Vice President", electionId: election.id },
    }),
    prisma.position.upsert({
      where: { name_electionId: { name: "Secretary", electionId: election.id } },
      update: {},
      create: { name: "Secretary", electionId: election.id },
    }),
  ]);

  // Candidates
  const candidateData = [
    { name: "Emma Davis", description: "Committed to student welfare", positionId: presidentPos.id },
    { name: "Frank Miller", description: "Innovation and progress", positionId: presidentPos.id },
    { name: "Grace Lee", description: "Bridging gaps between students and faculty", positionId: vpPos.id },
    { name: "Henry Wilson", description: "Transparency and accountability", positionId: vpPos.id },
    { name: "Isla Moore", description: "Efficient record-keeping", positionId: secPos.id },
    { name: "Jack Taylor", description: "Digital transformation", positionId: secPos.id },
  ];

  for (const c of candidateData) {
    await prisma.candidate.upsert({
      where: { id: `cand-${c.name.replace(/\s/g, "-").toLowerCase()}` },
      update: {},
      create: {
        id: `cand-${c.name.replace(/\s/g, "-").toLowerCase()}`,
        ...c,
        electionId: election.id,
      },
    });
  }

  console.log("✅ Seed complete");
  console.log(`   Admin: admin@university.edu / Admin@123`);
  console.log(`   Students: student1@university.edu ... student4@university.edu / Student@123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
