import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { writeFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();
const GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const CITIES = [
  { name: "Karachi", lat: 24.8608, lng: 67.0011 },
  { name: "Hyderabad", lat: 25.3960, lng: 68.3578 },
  { name: "Sukkur", lat: 27.7246, lng: 68.8228 },
  { name: "Ghotki", lat: 28.0068, lng: 69.3154 },
  { name: "Larkana", lat: 27.5570, lng: 68.2028 },
  { name: "Mirpurkhas", lat: 25.5276, lng: 69.0126 },
  { name: "Nawabshah", lat: 26.2442, lng: 68.4100 },
  { name: "Khairpur", lat: 27.5295, lng: 68.7592 },
];

const BANKS = [
  ["Karachi Central Blood Bank", "Karachi", "Civil Hospital Road, Saddar"],
  ["Karachi South Blood Centre", "Karachi", "Clifton Block 5, Near Teen Talwar"],
  ["Karachi North Blood Bank", "Karachi", "North Nazimabad, Block H"],
  ["Hyderabad City Blood Bank", "Hyderabad", "Civil Hospital Road, Hirabad"],
  ["Hyderabad Latifabad Blood Centre", "Hyderabad", "Latifabad Unit 7"],
  ["Sukkur Blood Bank & Transfusion Centre", "Sukkur", "GMMMC Hospital Road"],
  ["Sukkur New Town Blood Centre", "Sukkur", "New Sukkur, Gulshan-e-Iqbal"],
  ["Ghotki Community Blood Bank", "Ghotki", "Main Mirpur Mathelo Road, Near Civil Hospital"],
  ["Larkana Chandka Blood Bank", "Larkana", "Chandka Medical College Road"],
  ["Mirpurkhas Civil Blood Centre", "Mirpurkhas", "Civil Hospital Road"],
  ["Nawabshah PMC Blood Bank", "Nawabshah", "PMC Hospital Road"],
  ["Khairpur Civil Blood Bank", "Khairpur", "Civil Hospital Road"],
];

const pw = (label) => `${label}!${randomBytes(3).toString("hex").toUpperCase()}26`;

function stock(bankIdx, gIdx) {
  const free = (bankIdx * 3 + gIdx * 2) % 7 === 0 ? 0 : ((bankIdx + gIdx * 3) % 9);
  const paid = (bankIdx + gIdx) % 5;
  const exchange = (bankIdx * 2 + gIdx) % 4 === 0 ? 0 : (bankIdx + gIdx) % 3;
  const paidPrice = paid > 0 ? 3500 + ((bankIdx * 7 + gIdx * 13) % 40) * 100 : 0;
  return { freeUnits: free, paidUnits: paid, paidPrice, exchangeUnits: exchange };
}

async function main() {
  await prisma.appointment.deleteMany(); await prisma.donation.deleteMany();
  await prisma.bloodRequest.deleteMany(); await prisma.inventory.deleteMany();
  await prisma.user.deleteMany(); await prisma.bloodBank.deleteMany(); await prisma.city.deleteMany();

  const accounts = ["# Sindh Blood Bank — TEST ACCOUNTS (local only, never commit)\n"];
  const mkUser = async (name, email, label, data) => {
    const password = pw(label);
    const user = await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 10), phone: data.phone || "0300-0000000", ...data } });
    accounts.push(`- ${user.role.padEnd(7)} ${email} / ${password}${user.bankId ? ` (branch #${user.bankId})` : ""} — ${name}`);
    return user;
  };

  const cityMap = {};
  for (const c of CITIES) cityMap[c.name] = (await prisma.city.create({ data: c })).id;

  const bankMap = {};
  let n = 0;
  for (const [name, city, address] of BANKS) {
    const b = await prisma.bloodBank.create({ data: { name, address, phone: "0723-680-2" + String(10 + n++), cityId: cityMap[city] } });
    bankMap[name] = b.id;
  }
  for (let bi = 0; bi < BANKS.length; bi++)
    for (let gi = 0; gi < GROUPS.length; gi++)
      await prisma.inventory.create({ data: { bankId: bankMap[BANKS[bi][0]], bloodGroup: GROUPS[gi], ...stock(bi + 1, gi) } });

  await mkUser("Super Admin (Test)", "admin@bloodbank.test", "MasterSindh", { role: "ADMIN" });
  for (const city of ["Karachi", "Hyderabad", "Sukkur", "Ghotki"]) {
    const bankName = BANKS.find((b) => b[1] === city)[0];
    await mkUser(`${city} Bank Manager (Test)`, `${city.toLowerCase()}@bloodbank.test`, `${city}Bank`, { role: "BANK", bankId: bankMap[bankName] });
  }

  const donors = [];
  for (const [name, email, label, group, city] of [
    ["Ahmed Raza (Test)", "ahmed@bloodbank.test", "DonorAhmed", "O+", "Karachi"],
    ["Fatima Noor (Test)", "fatima@bloodbank.test", "DonorFatima", "A-", "Hyderabad"],
    ["Bilal Hussain (Test)", "bilal@bloodbank.test", "DonorBilal", "B+", "Sukkur"],
    ["Ayesha Khan (Test)", "ayesha@bloodbank.test", "DonorAyesha", "AB+", "Ghotki"],
    ["Usman Ali (Test)", "usman@bloodbank.test", "DonorUsman", "O-", "Larkana"],
  ]) donors.push(await mkUser(name, email, label, { role: "DONOR", bloodGroup: group, cityId: cityMap[city] }));

  const patients = [];
  for (const [name, email, label, group, city, hospital] of [
    ["Sana Bibi (Test)", "sana@bloodbank.test", "PatientSana", "O+", "Karachi", "Civil Hospital Karachi"],
    ["Imran Sheikh (Test)", "imran@bloodbank.test", "PatientImran", "A-", "Ghotki", "Civil Hospital Ghotki"],
    ["Zainab Fatima (Test)", "zainab@bloodbank.test", "PatientZainab", "B+", "Sukkur", "GMMMC Sukkur"],
    ["Hira Shah (Test)", "hira@bloodbank.test", "PatientHira", "AB-", "Hyderabad", "Civil Hospital Hyderabad"],
  ]) patients.push(await mkUser(name, email, label, { role: "PATIENT", bloodGroup: group, cityId: cityMap[city], hospital }));

  // ~14 requests, mixed statuses (historical rows; live API approvals decrement stock transactionally)
  for (const [pi, bankName, group, mode, units, urgency, status] of [
    [0, "Karachi Central Blood Bank", "O+", "FREE", 2, "Critical", "FULFILLED"],
    [0, "Karachi Central Blood Bank", "O+", "FREE", 1, "Urgent", "APPROVED"],
    [1, "Ghotki Community Blood Bank", "A-", "FREE", 1, "Critical", "PENDING"],
    [1, "Ghotki Community Blood Bank", "A-", "PAID", 1, "Normal", "FULFILLED"],
    [2, "Sukkur Blood Bank & Transfusion Centre", "B+", "FREE", 2, "Urgent", "PENDING"],
    [2, "Sukkur Blood Bank & Transfusion Centre", "B+", "EXCHANGE", 1, "Normal", "APPROVED"],
    [3, "Hyderabad City Blood Bank", "AB-", "FREE", 1, "Critical", "PENDING"],
    [3, "Hyderabad City Blood Bank", "A+", "PAID", 2, "Normal", "REJECTED"],
    [0, "Karachi South Blood Centre", "B-", "FREE", 1, "Urgent", "PENDING"],
    [1, "Sukkur New Town Blood Centre", "O-", "FREE", 1, "Critical", "PENDING"],
    [2, "Larkana Chandka Blood Bank", "A+", "FREE", 3, "Normal", "FULFILLED"],
    [3, "Nawabshah PMC Blood Bank", "O+", "EXCHANGE", 2, "Normal", "APPROVED"],
    [0, "Mirpurkhas Civil Blood Centre", "AB+", "FREE", 1, "Urgent", "CANCELLED"],
    [2, "Khairpur Civil Blood Bank", "O+", "FREE", 2, "Normal", "PENDING"],
  ]) await prisma.bloodRequest.create({ data: { patientId: patients[pi].id, bankId: bankMap[bankName], bloodGroup: group, mode, units, urgency, status, hospital: patients[pi].hospital || "" } });

  for (let i = 0; i < 12; i++) {
    const donor = donors[i % donors.length];
    await prisma.donation.create({ data: { donorId: donor.id, bankId: bankMap[BANKS[(i * 2) % BANKS.length][0]], bloodGroup: donor.bloodGroup, units: 1, date: new Date(Date.now() - (i + 3) * 86400000 * 6) } });
  }
  for (let i = 0; i < 3; i++)
    await prisma.appointment.create({ data: { donorId: donors[i].id, bankId: bankMap[BANKS[i * 3][0]], date: new Date(Date.now() + (i + 2) * 86400000), status: "BOOKED" } });

  writeFileSync(join(process.cwd(), "TEST_ACCOUNTS.local.md"), accounts.join("\n") + "\n");
  console.log("Seed complete: 8 cities, 12 branches, 96 inventory rows,",
    await prisma.bloodRequest.count(), "requests,", await prisma.donation.count(), "donations,",
    await prisma.user.count(), "users. Passwords written to TEST_ACCOUNTS.local.md");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
