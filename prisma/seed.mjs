import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { writeFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

// Fixed test-account passwords (same set as the live site; written to TEST_ACCOUNTS.local.md)
const PASSWORDS = {
  "admin@bloodbank.test": "MasterSindh!5458CF26",
  "karachi@bloodbank.test": "KarachiBank!8B9D7D26",
  "hyderabad@bloodbank.test": "HyderabadBank!D11CB626",
  "sukkur@bloodbank.test": "SukkurBank!C6E3F326",
  "ghotki@bloodbank.test": "GhotkiBank!710AE526",
  "ahmed@bloodbank.test": "DonorAhmed!8ABF4926",
  "fatima@bloodbank.test": "DonorFatima!D95E1B26",
  "bilal@bloodbank.test": "DonorBilal!611A9826",
  "ayesha@bloodbank.test": "DonorAyesha!B25E6726",
  "usman@bloodbank.test": "DonorUsman!131A3D26",
  "hassan@bloodbank.test": "DonorHassan!7C4D2E26",
  "sana@bloodbank.test": "PatientSana!39595626",
  "imran@bloodbank.test": "PatientImran!6925F426",
  "zainab@bloodbank.test": "PatientZainab!AB79D726",
  "hira@bloodbank.test": "PatientHira!634D8126",
};

const GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const CITIES = [
  { name: "Karachi", lat: 24.8608, lng: 67.0011 },
  { name: "Hyderabad", lat: 25.396, lng: 68.3578 },
  { name: "Sukkur", lat: 27.7246, lng: 68.8228 },
  { name: "Ghotki", lat: 28.0068, lng: 69.3159 },
  { name: "Larkana", lat: 27.5611, lng: 68.2069 },
  { name: "Mirpurkhas", lat: 25.5276, lng: 69.0126 },
  { name: "Nawabshah", lat: 26.2442, lng: 68.41 },
  { name: "Khairpur", lat: 27.5295, lng: 68.7592 },
];

// [name, city, address, phone, hours] — in the original app's branch order
const BANKS = [
  ["Karachi Central Blood Bank", "Karachi", "M.A. Jinnah Road, Near Civil Hospital, Karachi", "021-9921-5701", "Open 24 hours"],
  ["Lifeline Blood Bank — Clifton", "Karachi", "Khayaban-e-Ittehad, Clifton Block 5, Karachi", "021-3583-2210", "8:00 AM – 10:00 PM"],
  ["Karachi Blood Bank — North Nazimabad", "Karachi", "Shahrah-e-Sher Shah Suri, North Nazimabad, Karachi", "021-3664-8812", "9:00 AM – 11:00 PM"],
  ["Hyderabad Blood Bank", "Hyderabad", "Thandi Sarak, Near Civil Hospital, Hyderabad", "022-9260-335", "Open 24 hours"],
  ["Hyderabad City Blood Bank — Latifabad", "Hyderabad", "Latifabad Unit 7, Near Bhitai Hospital, Hyderabad", "022-3861-204", "8:00 AM – 10:00 PM"],
  ["Sukkur Blood Bank & Transfusion Centre", "Sukkur", "Clock Tower Road, Near Ghulam Muhammad Mahar Medical College, Sukkur", "071-9310-552", "Open 24 hours"],
  ["Sukkur City Blood Bank — New Sukkur", "Sukkur", "Airport Road, New Sukkur", "071-5610-778", "9:00 AM – 9:00 PM"],
  ["Ghotki Community Blood Bank", "Ghotki", "Main Mirpur Mathelo Road, Near Civil Hospital, Ghotki", "0723-680-214", "9:00 AM – 8:00 PM"],
  ["Larkana Blood Bank", "Larkana", "VIP Road, Near Chandka Medical College, Larkana", "074-9410-326", "8:00 AM – 10:00 PM"],
  ["Mirpurkhas Blood Bank", "Mirpurkhas", "Hyderabad Road, Near Civil Hospital, Mirpurkhas", "0233-863-419", "9:00 AM – 9:00 PM"],
  ["Nawabshah Blood Bank", "Nawabshah", "Sakrand Road, Near PMC Hospital, Nawabshah", "0244-937-052", "9:00 AM – 9:00 PM"],
  ["Khairpur Blood Bank", "Khairpur", "Civil Hospital Road, Khairpur Mirs", "0243-714-288", "9:00 AM – 8:00 PM"],
];

// Per bank (same order as BANKS), per group (GROUPS order): [free, paid, price, exchange]
const STOCK = [
  // Karachi Central
  [[12,10,4500,6],[3,4,7500,2],[11,8,4800,5],[2,3,7800,1],[9,7,4600,4],[1,2,8000,1],[5,4,5200,2],[0,1,9000,0]],
  // Lifeline Clifton
  [[8,6,4700,3],[1,2,7600,1],[7,5,4900,3],[0,2,7900,0],[6,5,4700,2],[2,1,8100,1],[3,2,5300,1],[1,0,9100,1]],
  // Karachi North Nazimabad
  [[10,7,4600,4],[2,3,7550,1],[8,6,4750,4],[1,2,7850,1],[7,5,4650,3],[0,1,8050,1],[4,3,5250,2],[1,1,9050,0]],
  // Hyderabad Blood Bank
  [[9,7,4400,4],[2,3,7400,1],[10,8,4600,5],[2,2,7700,1],[6,5,4500,3],[0,2,7950,0],[3,3,5050,2],[1,1,8850,0]],
  // Hyderabad Latifabad
  [[6,5,4300,2],[0,1,7300,0],[5,4,4500,2],[1,1,7600,1],[4,3,4400,2],[0,1,7900,0],[2,2,5000,1],[0,0,8800,0]],
  // Sukkur B&TC
  [[8,6,4350,3],[2,2,7350,1],[7,5,4550,3],[1,2,7650,1],[5,4,4450,2],[1,1,7950,1],[2,2,4950,1],[0,1,8750,0]],
  // Sukkur City New Sukkur
  [[5,3,4200,2],[1,1,7200,0],[4,3,4400,1],[0,1,7500,0],[3,2,4300,1],[1,0,7800,1],[1,1,4900,0],[0,1,8700,0]],
  // Ghotki
  [[2,2,4100,1],[0,1,7100,0],[3,2,4300,1],[1,0,7400,0],[2,1,4200,1],[0,0,7700,0],[1,1,4800,0],[0,0,8600,0]],
  // Larkana
  [[6,4,4250,2],[1,2,7250,1],[5,4,4450,2],[1,1,7550,1],[4,3,4350,2],[0,1,7850,0],[2,1,4850,1],[0,1,8650,0]],
  // Mirpurkhas
  [[4,3,4200,2],[1,1,7200,0],[3,3,4400,1],[0,1,7500,0],[3,2,4300,1],[0,0,7800,1],[1,1,4900,0],[0,0,8700,0]],
  // Nawabshah
  [[5,4,4250,2],[1,1,7250,1],[4,3,4450,2],[1,1,7550,0],[3,3,4350,1],[0,1,7850,0],[2,1,4850,1],[0,1,8650,0]],
  // Khairpur
  [[4,2,4150,1],[0,1,7150,0],[3,2,4350,1],[1,0,7450,1],[2,2,4250,1],[0,1,7750,0],[1,1,4750,0],[0,0,8550,0]],
];

async function main() {
  await prisma.appointment.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.bloodRequest.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.bloodBank.deleteMany();
  await prisma.city.deleteMany();

  const accounts = ["# Sindh Blood Bank — TEST ACCOUNTS (local only, never commit)\n"];
  const mkUser = async (name, email, data) => {
    const password = PASSWORDS[email];
    if (!password) throw new Error(`Missing password for ${email}`);
    const created = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        phone: "0300-0000000",
        ...data,
      },
    });
    accounts.push(`- ${created.role.padEnd(7)} ${email} / ${password}${created.bankId ? ` (branch #${created.bankId})` : ""} — ${name}`);
    return created;
  };

  const cityMap = {};
  for (const c of CITIES) cityMap[c.name] = (await prisma.city.create({ data: c })).id;

  const bankMap = {};
  for (const [name, city, address, phone, hours] of BANKS) {
    const b = await prisma.bloodBank.create({
      data: { name, address, phone, hours, cityId: cityMap[city] },
    });
    bankMap[name] = b.id;
  }
  for (let bi = 0; bi < BANKS.length; bi++)
    for (let gi = 0; gi < GROUPS.length; gi++) {
      const [freeUnits, paidUnits, paidPrice, exchangeUnits] = STOCK[bi][gi];
      await prisma.inventory.create({
        data: { bankId: bankMap[BANKS[bi][0]], bloodGroup: GROUPS[gi], freeUnits, paidUnits, paidPrice, exchangeUnits },
      });
    }

  await mkUser("Super Admin (Test)", "admin@bloodbank.test", { role: "ADMIN" });
  for (const [city, bankName] of [
    ["Karachi", "Karachi Central Blood Bank"],
    ["Hyderabad", "Hyderabad Blood Bank"],
    ["Sukkur", "Sukkur Blood Bank & Transfusion Centre"],
    ["Ghotki", "Ghotki Community Blood Bank"],
  ])
    await mkUser(`${city} Bank Manager (Test)`, `${city.toLowerCase()}@bloodbank.test`, {
      role: "BANK",
      bankId: bankMap[bankName],
    });

  const donors = [];
  for (const [name, email, group, city] of [
    ["Ahmed Raza (Test)", "ahmed@bloodbank.test", "O+", "Karachi"],
    ["Fatima Noor (Test)", "fatima@bloodbank.test", "A-", "Hyderabad"],
    ["Bilal Hussain (Test)", "bilal@bloodbank.test", "B+", "Sukkur"],
    ["Ayesha Khan (Test)", "ayesha@bloodbank.test", "AB+", "Ghotki"],
    ["Usman Ali (Test)", "usman@bloodbank.test", "O-", "Larkana"],
    ["Hassan Sheikh (Test)", "hassan@bloodbank.test", "B-", "Khairpur"],
  ])
    donors.push(await mkUser(name, email, { role: "DONOR", bloodGroup: group, cityId: cityMap[city] }));

  const patients = [];
  for (const [name, email, group, city, hospital] of [
    ["Sana Bibi (Test)", "sana@bloodbank.test", "O+", "Karachi", "Civil Hospital Karachi"],
    ["Imran Sheikh (Test)", "imran@bloodbank.test", "A-", "Ghotki", "Civil Hospital Ghotki"],
    ["Zainab Fatima (Test)", "zainab@bloodbank.test", "B+", "Sukkur", "GMMMC Sukkur"],
    ["Hira Shah (Test)", "hira@bloodbank.test", "AB-", "Hyderabad", "Civil Hospital Hyderabad"],
  ])
    patients.push(
      await mkUser(name, email, { role: "PATIENT", bloodGroup: group, cityId: cityMap[city], hospital })
    );

  // Requests arranged so the public headline numbers match the original app:
  // PENDING 5 requests / 13 units (Karachi 4, Hyderabad 5, Ghotki 2, Sukkur 2), FULFILLED 5.
  for (const [pi, bankName, group, mode, units, urgency, status] of [
    // PENDING (the 5 waiting)
    [0, "Karachi Central Blood Bank", "O+", "FREE", 2, "Critical", "PENDING"],
    [0, "Lifeline Blood Bank — Clifton", "B+", "FREE", 2, "Urgent", "PENDING"],
    [3, "Hyderabad Blood Bank", "AB-", "FREE", 5, "Critical", "PENDING"],
    [1, "Ghotki Community Blood Bank", "A-", "FREE", 2, "Critical", "PENDING"],
    [2, "Sukkur Blood Bank & Transfusion Centre", "B+", "FREE", 2, "Urgent", "PENDING"],
    // FULFILLED (5)
    [1, "Ghotki Community Blood Bank", "A-", "PAID", 1, "Normal", "FULFILLED"],
    [2, "Sukkur Blood Bank & Transfusion Centre", "B+", "FREE", 1, "Urgent", "FULFILLED"],
    [0, "Karachi Central Blood Bank", "O+", "FREE", 2, "Critical", "FULFILLED"],
    [3, "Hyderabad City Blood Bank — Latifabad", "A+", "PAID", 2, "Normal", "FULFILLED"],
    [2, "Larkana Blood Bank", "A+", "FREE", 3, "Normal", "FULFILLED"],
    // Other history
    [0, "Karachi Central Blood Bank", "O+", "FREE", 1, "Urgent", "APPROVED"],
    [3, "Nawabshah Blood Bank", "O+", "EXCHANGE", 2, "Normal", "APPROVED"],
    [3, "Hyderabad Blood Bank", "A+", "PAID", 2, "Normal", "REJECTED"],
    [0, "Mirpurkhas Blood Bank", "AB+", "FREE", 1, "Urgent", "CANCELLED"],
  ])
    await prisma.bloodRequest.create({
      data: {
        patientId: patients[pi].id,
        bankId: bankMap[bankName],
        bloodGroup: group,
        mode,
        units,
        urgency,
        status,
        hospital: patients[pi].hospital || "",
      },
    });

  for (let i = 0; i < 13; i++) {
    const donor = donors[i % donors.length];
    await prisma.donation.create({
      data: {
        donorId: donor.id,
        bankId: bankMap[BANKS[(i * 2) % BANKS.length][0]],
        bloodGroup: donor.bloodGroup,
        units: 1,
        date: new Date(Date.now() - (i + 3) * 86400000 * 6),
      },
    });
  }
  for (let i = 0; i < 3; i++)
    await prisma.appointment.create({
      data: {
        donorId: donors[i].id,
        bankId: bankMap[BANKS[i * 3][0]],
        date: new Date(Date.now() + (i + 2) * 86400000),
        status: "BOOKED",
      },
    });


  writeFileSync(join(process.cwd(), "TEST_ACCOUNTS.local.md"), accounts.join("\n") + "\n");
  console.log("Seed complete:", await prisma.city.count(), "cities,", await prisma.bloodBank.count(), "banks,",
    await prisma.inventory.count(), "inventory rows,", await prisma.bloodRequest.count(), "requests,",
    await prisma.donation.count(), "donations,", await prisma.user.count(), "users.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
