const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://ioppmvchszymwswtwsze.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBtdmNoc3p5bXdzd3R3c3plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAwNjcwOSwiZXhwIjoyMDg1NTgyNzA5fQ.Zt1bH5r9JKuNTK_E9s1EZA2anSR8y4nmDQJz-WZ9NXc"
);

async function run() {
  const {data: bookings} = await supabase.from("bookings").select("client_id").neq("status", "cancelled");
  const clientIds = [...new Set(bookings.map(b => b.client_id).filter(Boolean))];
  const {data: clients} = await supabase.from("clients").select("id,name,address,phone").in("id", clientIds);
  const missing = clients.filter(c => {
    return !c.address || c.address.trim() === "";
  });
  console.log("Clients WITH bookings but NO address: " + missing.length + " / " + clients.length);
  missing.forEach(c => console.log("  - " + c.name + " | " + c.phone));
}
run();
