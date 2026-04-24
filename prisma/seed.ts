import { PrismaClient, Role, ElectionStatus, PositionLevel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const studentPassword = await bcrypt.hash("Student@123", 12);

  const schoolsData = [
    { id: "school-engineering", name: "School of Engineering and Technology" },
    { id: "school-business", name: "School of Business" },
    { id: "school-education", name: "School of Education" },
    { id: "school-social", name: "School of Social Sciences" },
    { id: "school-health", name: "School of Health Sciences" },
    { id: "school-agriculture", name: "School of Agriculture and Environmental Sciences" },
  ];

  for (const s of schoolsData) {
    await prisma.school.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }

  const departmentsData = [
    { id: "dept-cs", name: "Department of Computer Science", schoolId: "school-engineering" },
    { id: "dept-ee", name: "Department of Electrical Engineering", schoolId: "school-engineering" },
    { id: "dept-accounting", name: "Department of Accounting", schoolId: "school-business" },
    { id: "dept-marketing", name: "Department of Marketing", schoolId: "school-business" },
    { id: "dept-arts-edu", name: "Department of Arts Education", schoolId: "school-education" },
    { id: "dept-science-edu", name: "Department of Science Education", schoolId: "school-education" },
    { id: "dept-sociology", name: "Department of Sociology", schoolId: "school-social" },
    { id: "dept-political", name: "Department of Political Science", schoolId: "school-social" },
    { id: "dept-nursing", name: "Department of Nursing", schoolId: "school-health" },
    { id: "dept-public-health", name: "Department of Public Health", schoolId: "school-health" },
    { id: "dept-agribusiness", name: "Department of Agribusiness", schoolId: "school-agriculture" },
    { id: "dept-env-sci", name: "Department of Environmental Science", schoolId: "school-agriculture" },
  ];

  for (const d of departmentsData) {
    await prisma.department.upsert({
      where: { id: d.id },
      update: {},
      create: d,
    });
  }

  const coursesData = [
    { id: "course-cs-1", name: "BSc Computer Science", code: "CS101", departmentId: "dept-cs" },
    { id: "course-cs-2", name: "BSc Software Engineering", code: "SE101", departmentId: "dept-cs" },
    { id: "course-ee-1", name: "BSc Electrical Engineering", code: "EE101", departmentId: "dept-ee" },
    { id: "course-ee-2", name: "BSc Telecommunications Engineering", code: "TE101", departmentId: "dept-ee" },
    { id: "course-acc-1", name: "BCom Accounting", code: "ACC101", departmentId: "dept-accounting" },
    { id: "course-mkt-1", name: "BCom Marketing", code: "MKT101", departmentId: "dept-marketing" },
    { id: "course-mkt-2", name: "BCom Finance", code: "FIN101", departmentId: "dept-marketing" },
    { id: "course-art-edu-1", name: "Bachelor of Education Arts", code: "EDU101", departmentId: "dept-arts-edu" },
    { id: "course-sci-edu-1", name: "Bachelor of Education Science", code: "EDU201", departmentId: "dept-science-edu" },
    { id: "course-soc-1", name: "BA Sociology", code: "SOC101", departmentId: "dept-sociology" },
    { id: "course-pol-1", name: "BA Political Science", code: "POL101", departmentId: "dept-political" },
    { id: "course-nur-1", name: "BSc Nursing", code: "NUR101", departmentId: "dept-nursing" },
    { id: "course-ph-1", name: "BSc Public Health", code: "PH101", departmentId: "dept-public-health" },
    { id: "course-agb-1", name: "BSc Agribusiness", code: "AGB101", departmentId: "dept-agribusiness" },
    { id: "course-env-1", name: "BSc Environmental Science", code: "ENS101", departmentId: "dept-env-sci" },
  ];

  for (const c of coursesData) {
    await prisma.course.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@university.edu" },
    update: {},
    create: {
      name: "System Administrator",
      studentId: "ADMIN001",
      email: "admin@university.edu",
      password: adminPassword,
      role: Role.ADMIN,
      schoolId: "school-engineering",
      departmentId: "dept-cs",
      courseId: "course-cs-1",
    },
  });

  const kenyanNames = [
    "John Maina", "Mary Wanjiku", "David Kamau", "Grace Njoroge", "Peter Ochieng",
    "Faith Akinyi", "James Mwangi", "Esther Nyaguthii", "Michael Odhiambo", "Sarah Akoth",
    "Joseph Owino", "Grace Atieno", "Rebecca Kemunto", "Daniel Kiplagat", "Paul Kariuki",
  ];

  for (let i = 0; i < coursesData.length && i < kenyanNames.length; i++) {
    const course = coursesData[i];
    const dept = departmentsData.find(d => d.id === course.departmentId);
    await prisma.user.upsert({
      where: { email: `student${i + 1}@university.edu` },
      update: {},
      create: {
        name: kenyanNames[i],
        studentId: `STU${String(i + 1).padStart(4, "0")}`,
        email: `student${i + 1}@university.edu`,
        password: studentPassword,
        role: Role.STUDENT,
        schoolId: dept?.schoolId,
        departmentId: course.departmentId,
        courseId: course.id,
      },
    });
  }

  const election = await prisma.election.upsert({
    where: { id: "election-2026" },
    update: {},
    create: {
      id: "election-2026",
      title: "Student Council Election 2026",
      status: ElectionStatus.ACTIVE,
    },
  });

  const universityPositions = [
    { name: "President", level: PositionLevel.UNIVERSITY },
    { name: "Deputy President", level: PositionLevel.UNIVERSITY },
    { name: "Secretary General", level: PositionLevel.UNIVERSITY },
    { name: "Treasurer", level: PositionLevel.UNIVERSITY },
    { name: "Games Captain", level: PositionLevel.UNIVERSITY },
    { name: "Events and Entertainment Captain", level: PositionLevel.UNIVERSITY },
    { name: "PWD Representative 1", level: PositionLevel.UNIVERSITY },
    { name: "PWD Representative 2", level: PositionLevel.UNIVERSITY },
  ];

  const posMap: Record<string, string> = {};
  for (const p of universityPositions) {
    const pos = await prisma.position.upsert({
      where: { name_electionId: { name: p.name, electionId: election.id } },
      update: {},
      create: { name: p.name, electionId: election.id, level: p.level },
    });
    posMap[p.name] = pos.id;
  }

  await prisma.candidate.upsert({
    where: { id: "cand-john-maina" },
    update: {},
    create: {
      id: "cand-john-maina",
      name: "John Maina",
      description: "Committed to student welfare and academic excellence. Visionary leader with a track record of serving the student community.",
      electionId: election.id,
      positionId: posMap["President"],
    },
  });

  const faithCandidate = await prisma.candidate.upsert({
    where: { id: "cand-faith-akinyi" },
    update: {},
    create: {
      id: "cand-faith-akinyi",
      name: "Faith Akinyi",
      description: "Dedicated to serving the student body with excellence and integrity.",
      electionId: election.id,
      positionId: posMap["Deputy President"],
    },
  });

  await prisma.candidate.update({
    where: { id: "cand-john-maina" },
    data: { runningMateId: faithCandidate.id },
  });

  const uniCandidates = [
    { pos: "President", names: ["Mary Wanjiku", "David Kamau"] },
    { pos: "Deputy President", names: ["Faith Akinyi", "Peter Ochieng"] },
    { pos: "Secretary General", names: ["Esther Nyaguthii", "Michael Odhiambo"] },
    { pos: "Treasurer", names: ["Joseph Owino", "Grace Atieno"] },
    { pos: "Games Captain", names: ["Rebecca Kemunto", "Daniel Kiplagat"] },
    { pos: "Events and Entertainment Captain", names: ["Paul Kariuki", "Joyce Kemunto"] },
    { pos: "PWD Representative 1", names: ["Alice Aoko"] },
    { pos: "PWD Representative 2", names: ["Mercy Wairimu"] },
  ];

  for (const c of uniCandidates) {
    for (const name of c.names) {
      await prisma.candidate.upsert({
        where: { id: `cand-${name.replace(/\s/g, "-").toLowerCase()}` },
        update: {},
        create: {
          id: `cand-${name.replace(/\s/g, "-").toLowerCase()}`,
          name,
          description: "Dedicated to serving the student body with excellence and integrity.",
          electionId: election.id,
          positionId: posMap[c.pos],
        },
      });
    }
  }

  for (const s of schoolsData) {
    const posName = `${s.name} Representative`;
    const pos = await prisma.position.upsert({
      where: { name_electionId: { name: posName, electionId: election.id } },
      update: {},
      create: { name: posName, electionId: election.id, level: PositionLevel.SCHOOL, schoolId: s.id },
    });
    posMap[`school-${s.id}`] = pos.id;
  }

  const schoolCandidates = [
    { school: "school-engineering", names: ["Beatrice Cherono", "Andrew Rotich"] },
    { school: "school-business", names: ["Benjamin Sang", "Veronica Chebet"] },
    { school: "school-education", names: ["Sharon Cherono", "Francis Odhiambo"] },
    { school: "school-social", names: ["Ruth Wangari", "Nancy Akinyi"] },
    { school: "school-health", names: ["Gladys Auma", "Grace Atieno"] },
    { school: "school-agriculture", names: ["Naomi Chepkoech", "Daniel Kiplagat"] },
  ];

  for (const sc of schoolCandidates) {
    for (const name of sc.names) {
      await prisma.candidate.upsert({
        where: { id: `cand-${name.replace(/\s/g, "-").toLowerCase()}` },
        update: {},
        create: {
          id: `cand-${name.replace(/\s/g, "-").toLowerCase()}`,
          name,
          description: `Representing ${sc.school.replace("school-", "").replace("-", " ")} students.`,
          electionId: election.id,
          positionId: posMap[`school-${sc.school}`],
        },
      });
    }
  }

  for (const d of departmentsData) {
    const pos = await prisma.position.upsert({
      where: { name_electionId: { name: "Department Representative", electionId: election.id } },
      update: {},
      create: { name: "Department Representative", electionId: election.id, level: PositionLevel.DEPARTMENT, departmentId: d.id, schoolId: d.schoolId },
    });
    posMap[`dept-${d.id}`] = pos.id;
  }

  const deptCandidates = [
    { dept: "dept-cs", names: ["James Mwangi", "Sarah Akoth"] },
    { dept: "dept-ee", names: ["Peter Ochieng", "Faith Akinyi"] },
    { dept: "dept-accounting", names: ["Joseph Owino"] },
    { dept: "dept-marketing", names: ["Grace Atieno", "Rebecca Kemunto"] },
    { dept: "dept-arts-edu", names: ["Joyce Kemunto"] },
    { dept: "dept-science-edu", names: ["Daniel Kiplagat"] },
    { dept: "dept-sociology", names: ["Alice Aoko"] },
    { dept: "dept-political", names: ["Mercy Wairimu"] },
    { dept: "dept-nursing", names: ["Beatrice Cherono"] },
    { dept: "dept-public-health", names: ["Andrew Rotich"] },
    { dept: "dept-agribusiness", names: ["Benjamin Sang"] },
    { dept: "dept-env-sci", names: ["Veronica Chebet"] },
  ];

  for (const dc of deptCandidates) {
    for (const name of dc.names) {
      await prisma.candidate.upsert({
        where: { id: `cand-${name.replace(/\s/g, "-").toLowerCase()}-${dc.dept}` },
        update: {},
        create: {
          id: `cand-${name.replace(/\s/g, "-").toLowerCase()}-${dc.dept}`,
          name,
          description: `Advocating for ${dc.dept.replace("dept-", "").replace("-", " ")} department students.`,
          electionId: election.id,
          positionId: posMap[`dept-${dc.dept}`],
        },
      });
    }
  }

  for (const c of coursesData) {
    const pos = await prisma.position.upsert({
      where: { name_electionId: { name: "Class Representative", electionId: election.id } },
      update: {},
      create: { name: "Class Representative", electionId: election.id, level: PositionLevel.CLASS, courseId: c.id, departmentId: c.departmentId },
    });
    posMap[`course-${c.id}`] = pos.id;
  }

  const courseCandidates = [
    { course: "course-cs-1", names: ["John Maina", "Mary Wanjiku"] },
    { course: "course-cs-2", names: ["David Kamau", "Grace Njoroge"] },
    { course: "course-ee-1", names: ["Peter Ochieng"] },
    { course: "course-ee-2", names: ["Faith Akinyi"] },
    { course: "course-acc-1", names: ["James Mwangi"] },
    { course: "course-mkt-1", names: ["Esther Nyaguthii"] },
    { course: "course-mkt-2", names: ["Michael Odhiambo"] },
    { course: "course-art-edu-1", names: ["Sarah Akoth"] },
    { course: "course-sci-edu-1", names: ["Joseph Owino"] },
    { course: "course-soc-1", names: ["Grace Atieno"] },
    { course: "course-pol-1", names: ["Rebecca Kemunto"] },
    { course: "course-nur-1", names: ["Daniel Kiplagat"] },
    { course: "course-ph-1", names: ["Paul Kariuki"] },
    { course: "course-agb-1", names: ["Joyce Kemunto"] },
    { course: "course-env-1", names: ["Alice Aoko"] },
  ];

  for (const cc of courseCandidates) {
    for (const name of cc.names) {
      const course = coursesData.find(c => c.id === cc.course);
      await prisma.candidate.upsert({
        where: { id: `cand-${name.replace(/\s/g, "-").toLowerCase()}-${cc.course}` },
        update: {},
        create: {
          id: `cand-${name.replace(/\s/g, "-").toLowerCase()}-${cc.course}`,
          name,
          description: `Representing ${course?.name || "Class"} class.`,
          electionId: election.id,
          positionId: posMap[`course-${cc.course}`],
        },
      });
    }
  }

  console.log("=== Seed Complete ===");
  console.log(`Admin: ${admin.email} / Admin@123`);
  console.log(`Student: student1@university.edu / Student@123`);
  console.log(`Created ${schoolsData.length} schools, ${departmentsData.length} departments, ${coursesData.length} courses`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());