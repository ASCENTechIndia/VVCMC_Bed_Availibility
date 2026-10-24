export const CATEGORIES = [
  { id: 1, name: 'Intensive Care Unit (ICU)' },
  { id: 2, name: 'Neonatal ICU (NICU)' },
  { id: 3, name: 'Pediatric ICU (PICU)' },
  { id: 4, name: 'General Ward - Male' },
  { id: 5, name: 'General Ward - Female' },
  { id: 6, name: 'General Ward - Common/Combined' },
  { id: 7, name: 'Deluxe/Special Rooms' },
  { id: 8, name: 'Other (e.g. Casualty/ Day Care)' },
];

export const QUOTAS = [
  { id: 1, key: 'Regular', label: 'Regular' },
  { id: 2, key: 'Free', label: '10% Reserved Free Beds (Indigent)' },
  { id: 3, key: 'Concessional', label: '10% Concessional Beds (Weaker Section)' },
];

export const HOSPITAL_TYPES = ['Municipal', 'Private', 'Trust'];

// beds[category][quota] = [total, occupied]
const HOSPITAL_1 = [
  [[20, 14], [2, 1], [2, 2]],
  [[10, 6], [1, 0], [1, 0]],
  [[8, 3], [1, 0], [1, 0]],
  [[30, 24], [3, 2], [4, 1]],
  [[24, 22], [2, 2], [3, 1]],
  [[40, 12], [4, 1], [4, 0]],
  [[6, 2], [0, 0], [0, 0]],
  [[10, 9], [1, 0], [1, 0]],
];

const HOSPITAL_2 = [
  [[16, 10], [2, 1], [1, 0]],
  [[8, 5], [1, 1], [1, 0]],
  [[6, 2], [1, 0], [1, 0]],
  [[26, 22], [3, 2], [3, 2]],
  [[20, 12], [2, 1], [2, 0]],
  [[30, 18], [3, 1], [3, 1]],
  [[4, 1], [0, 0], [0, 0]],
  [[8, 3], [1, 0], [1, 0]],
];

const HOSPITAL_3 = [
  [[12, 12], [1, 1], [1, 1]],
  [[6, 4], [1, 1], [0, 0]],
  [[4, 1], [0, 0], [0, 0]],
  [[20, 11], [2, 1], [2, 1]],
  [[18, 9], [2, 0], [2, 1]],
  [[24, 10], [2, 0], [2, 0]],
  [[8, 3], [0, 0], [0, 0]],
  [[6, 2], [1, 0], [0, 0]],
];

const toObjects = (grid) =>
  grid.map((row) => row.map(([total, occupied]) => ({ total, occupied })));

const at = (daysAgo, h, m) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const seedState = () => ({
  hospitals: [
    {
      id: 1, name: 'Sample Hospital 1 (Virar West)', type: 'Municipal',
      address: 'Sample address, Virar West', area: 'Virar', pincode: '401303',
      phone: '0250-0000001', email: 'hospital1@example.com', active: true,
      lastUpdated: at(0, 9, 30), updatedBy: 'Admin User',
    },
    {
      id: 2, name: 'Sample Hospital 2 (Vasai West)', type: 'Municipal',
      address: 'Sample address, Vasai West', area: 'Vasai', pincode: '401202',
      phone: '0250-0000002', email: 'hospital2@example.com', active: true,
      lastUpdated: at(0, 8, 45), updatedBy: 'dataentry1',
    },
    {
      id: 3, name: 'Sample Hospital 3 (Nalasopara)', type: 'Private',
      address: 'Sample address, Nalasopara', area: 'Nalasopara', pincode: '401209',
      phone: '0250-0000003', email: 'hospital3@example.com', active: true,
      lastUpdated: at(3, 17, 10), updatedBy: 'dataentry1',
    },
  ],
  beds: {
    1: toObjects(HOSPITAL_1),
    2: toObjects(HOSPITAL_2),
    3: toObjects(HOSPITAL_3),
  },
  history: [
    { at: at(0, 9, 30), hospitalId: 1, category: 'ICU', quota: 'Regular', oldOccupied: 12, newOccupied: 14, user: 'admin', ip: '10.0.0.15' },
    { at: at(0, 8, 45), hospitalId: 2, category: 'General Ward - Male', quota: 'Regular', oldOccupied: 20, newOccupied: 22, user: 'dataentry1', ip: '10.0.0.21' },
    { at: at(3, 17, 10), hospitalId: 3, category: 'NICU', quota: 'Free', oldOccupied: 0, newOccupied: 1, user: 'dataentry1', ip: '10.0.0.21' },
  ],
});
