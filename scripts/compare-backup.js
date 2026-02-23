const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://ioppmvchszymwswtwsze.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBtdmNoc3p5bXdzd3R3c3plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAwNjcwOSwiZXhwIjoyMDg1NTgyNzA5fQ.Zt1bH5r9JKuNTK_E9s1EZA2anSR8y4nmDQJz-WZ9NXc"
);

// Parse CSV (handles quoted fields with commas)
function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current); current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

async function run() {
  const csvPath = "/Users/jefftucker/Library/Containers/com.apple.mail/Data/Library/Mail Downloads/7FBB49D8-29F1-4759-845A-D88C5C9913F8/clients-2026-02-17.csv";
  const csvRaw = fs.readFileSync(csvPath, "utf-8");
  const lines = csvRaw.trim().split("\n");
  // Header: Name,Email,Phone,Address,Notes,Created
  const backupClients = lines.slice(1).map(line => {
    const f = parseCSVLine(line);
    return { name: f[0], email: f[1], phone: f[2], address: f[3], notes: f[4] };
  });

  const { data: dbClients } = await supabase.from("clients").select("name,email,phone,address,notes,active");

  const dbByPhone = new Map();
  for (const c of dbClients) {
    const key = (c.phone || "").replace(/\D/g, "").slice(-10);
    if (key) dbByPhone.set(key, c);
  }

  console.log("COMPARING backup vs current DB:\n");
  let diffs = 0;
  for (const bc of backupClients) {
    const key = (bc.phone || "").replace(/\D/g, "").slice(-10);
    const db = dbByPhone.get(key);
    if (!db) {
      console.log("MISSING FROM DB: " + bc.name + " | " + bc.phone);
      diffs++;
      continue;
    }
    // Check address
    const backupAddr = (bc.address || "").trim();
    const dbAddr = (db.address || "").trim();
    if (backupAddr && !dbAddr) {
      console.log("ADDRESS WIPED: " + bc.name + " | backup: " + backupAddr + " | db: (empty)");
      diffs++;
    } else if (backupAddr && dbAddr && backupAddr !== dbAddr) {
      console.log("ADDRESS CHANGED: " + bc.name + " | backup: " + backupAddr + " | db: " + dbAddr);
      diffs++;
    }
    // Check email
    const backupEmail = (bc.email || "").trim();
    const dbEmail = (db.email || "").trim();
    if (backupEmail && !dbEmail) {
      console.log("EMAIL WIPED: " + bc.name + " | backup: " + backupEmail);
      diffs++;
    }
    // Check active
    if (db.active === false) {
      console.log("DEACTIVATED: " + bc.name);
      diffs++;
    }
  }
  if (diffs === 0) console.log("No differences found.");
  else console.log("\n" + diffs + " differences found.");
}
run();
