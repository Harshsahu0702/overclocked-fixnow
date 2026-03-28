const detectedService = "Maid";
const searchTerm = detectedService.toLowerCase().trim();

const serviceMatches = (partnerValue) => {
    const val = partnerValue.toLowerCase().trim();
    if (val === searchTerm) return true;
    if (val.includes(searchTerm)) return true;
    if (searchTerm.includes(val) && val.length >= 5) return true;
    return false;
};

const partners = [
  { name: "Ram kumar", sk: ["Electrician", "Cleaning", "AC Repair", "Plumber", "Carpenter"] },
  { name: "Harsh Sahu", sk: ["Electrician", "Plumber", "AC Repair", "Painter", "Carpenter", "Cleaning"] }
];

const matchedWorkers = partners.filter(p => {
    if (p.sc && serviceMatches(p.sc)) return true;
    if (p.sk && p.sk.some(s => serviceMatches(s))) return true;
    return false;
});

console.log(`Searching for: ${detectedService}`);
console.log(`Matched: ${matchedWorkers.map(w => w.name).join(', ')}`);
console.log(`Length: ${matchedWorkers.length}`);
