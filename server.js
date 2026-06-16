const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const CRISIS_DATA = [
  {
    id: 'fire',
    title: 'Fire Incident',
    icon: 'ph-fill ph-fire',
    desc: 'If you see smoke or fire.',
    severity: 'critical',
    accentColor: '#f43f5e',
    steps: [
      { title: 'Pull the Alarm', desc: 'Find the red box on the wall and pull the handle down hard.' },
      { title: 'Call for Help', desc: 'Call 911. Tell them your name and where the fire is.' },
      { title: 'Get Out Fast', desc: 'Walk quickly to the nearest door. Don\'t stop to pick up your things.' },
      { title: 'Meet at the Tree', desc: 'Go to the safe spot outside where everyone meets and stay there.' }
    ]
  },
  {
    id: 'accident',
    title: 'Workplace Accident',
    icon: 'ph-fill ph-warning-octagon',
    desc: 'If someone gets hurt or something breaks.',
    severity: 'high',
    accentColor: '#f59e0b',
    steps: [
      { title: 'Stop Everything', desc: 'Push the big red "STOP" button on the machine right away.' },
      { title: 'Tell a Grown-up', desc: 'Run and find a teacher or boss and tell them someone is hurt.' },
      { title: 'Stay Back', desc: 'Keep away from the broken machine so you don\'t get hurt too.' },
      { title: 'Wait for the Doctor', desc: 'Stay calm and wait for the ambulance to arrive.' }
    ]
  },
  {
    id: 'chemical',
    title: 'Chemical Leak',
    icon: 'ph-fill ph-flask',
    desc: 'If something smelly or sticky spills.',
    severity: 'critical',
    accentColor: '#8b5cf6',
    steps: [
      { title: 'Don\'t Touch It', desc: 'Stay away from the spill. Don\'t smell it or touch it!' },
      { title: 'Cover Your Nose', desc: 'Use your shirt or a mask to cover your mouth and nose.' },
      { title: 'Leave the Room', desc: 'Go outside where the air is fresh. Close the door behind you.' },
      { title: 'Wash Your Hands', desc: 'If anything touched your skin, wash it with lots of water.' }
    ]
  },
  {
    id: 'medical',
    title: 'Medical Emergency',
    icon: 'ph-fill ph-heartbeat',
    desc: 'If someone falls down or feels very sick.',
    severity: 'high',
    accentColor: '#f97316',
    steps: [
      { title: 'Check if they Wake Up', desc: 'Gently shake their shoulder and ask "Are you okay?".' },
      { title: 'Call 911', desc: 'Tell the person on the phone that someone is sick and needs a doctor.' },
      { title: 'Stay with Them', desc: 'Don\'t leave the person alone. Hold their hand and talk to them.' },
      { title: 'Open the Door', desc: 'Make sure the door is unlocked so the doctors can get in easily.' }
    ]
  },
  {
    id: 'medical-physical',
    title: 'Medical & Physical Emergencies',
    category: 'Emergency',
    icon: 'ph-fill ph-first-aid',
    accentColor: '#ef4444',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Take a deep breath and look around to understand what is happening.' },
      { title: 'Ensure personal safety first.', desc: 'Do not put yourself in danger while trying to help others.' },
      { title: 'Contact relevant authorities.', desc: 'Call emergency helplines immediately for professional help.' },
      { title: 'Follow basic safety procedures.', desc: 'Apply first aid or safety protocols you have learned.' },
      { title: 'Help others if possible.', desc: 'Assist those who are most vulnerable if it is safe to do so.' }
    ]
  },
  {
    id: 'accident-physical',
    title: 'Accident & Physical Incidents',
    category: 'Safety',
    icon: 'ph-fill ph-car-crash',
    accentColor: '#f97316',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Evaluate the extent of the accident and identify hazards.' },
      { title: 'Ensure personal safety first.', desc: 'Move to a safe location away from traffic or debris.' },
      { title: 'Contact relevant authorities.', desc: 'Call traffic police or ambulance as required.' },
      { title: 'Follow basic safety procedures.', desc: 'Turn off engines or secure the area if possible.' },
      { title: 'Help others if possible.', desc: 'Provide comfort and basic aid to any injured parties.' }
    ]
  },
  {
    id: 'personal-safety-crime',
    title: 'Safety & Crime Situations',
    subbranch: 'Personal Safety & Crime',
    category: 'Security',
    icon: 'ph-fill ph-mask-sad',
    accentColor: '#1e293b',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Avoid panic to keep your mind clear for decision making.' },
      { title: 'Ensure personal safety first.', desc: 'Find a well-lit, populated area or lock yourself in a safe room.' },
      { title: 'Contact relevant authorities.', desc: 'Call the police emergency number (112/100) immediately.' },
      { title: 'Follow basic safety procedures.', desc: 'Do not confront the perpetrator; focus on escape.' },
      { title: 'Help others if possible.', desc: 'Alert people nearby without drawing attention to yourself.' }
    ]
  },
  {
    id: 'harassment-abuse',
    title: 'Harassment & Abuse',
    category: 'Legal/Personal',
    icon: 'ph-fill ph-warning-octagon',
    accentColor: '#be185d',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Identify the source and nature of the harassment.' },
      { title: 'Ensure personal safety first.', desc: 'Distance yourself from the abuser immediately.' },
      { title: 'Contact relevant authorities.', desc: 'Report to HR, workplace safety, or local police.' },
      { title: 'Follow basic safety procedures.', desc: 'Document incidents with dates, times, and witnesses.' },
      { title: 'Help others if possible.', desc: 'Encourage other victims to come forward safely.' }
    ]
  },
  {
    id: 'police-rights',
    title: 'Police Interaction & Rights',
    category: 'Legal',
    icon: 'ph-fill ph-police-car',
    accentColor: '#1d4ed8',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Be polite and avoid any sudden movements.' },
      { title: 'Ensure personal safety first.', desc: 'Keep your hands visible at all times.' },
      { title: 'Contact relevant authorities.', desc: 'Request to speak to a lawyer or inform a family member.' },
      { title: 'Follow basic safety procedures.', desc: 'Do not resist arrest physically; state your rights clearly.' },
      { title: 'Help others if possible.', desc: 'If witnessing an interaction, record from a safe distance.' }
    ]
  },
  {
    id: 'arrest-detention',
    title: 'Arrest / Detention Situations',
    category: 'Legal',
    icon: 'ph-fill ph-handcuffs',
    accentColor: '#334155',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Understand the reason for the arrest if stated.' },
      { title: 'Ensure personal safety first.', desc: 'Do not argue or escalate the tension.' },
      { title: 'Contact relevant authorities.', desc: 'Use your right to one phone call for legal representation.' },
      { title: 'Follow basic safety procedures.', desc: 'Provide only necessary ID information; remain silent otherwise.' },
      { title: 'Help others if possible.', desc: 'Share contact info for legal aid with others in detention.' }
    ]
  },
  {
    id: 'cyber-crime-fraud',
    title: 'Digital & Cyber Emergencies',
    subbranch: 'Cyber Crime & Online Fraud',
    category: 'Cyber',
    icon: 'ph-fill ph-shield-check',
    accentColor: '#7c3aed',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Identify which accounts or data have been compromised.' },
      { title: 'Ensure personal safety first.', desc: 'Change passwords and enable 2FA on all other accounts.' },
      { title: 'Contact relevant authorities.', desc: 'Report to the National Cyber Crime Portal or your bank.' },
      { title: 'Follow basic safety procedures.', desc: 'Do not click on further suspicious links.' },
      { title: 'Help others if possible.', desc: 'Warn your contacts if your account is sending spam.' }
    ]
  },
  {
    id: 'identity-document-issues',
    title: 'Identity & Document Issues',
    category: 'Administrative',
    icon: 'ph-fill ph-identification-card',
    accentColor: '#059669',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'List all documents that are missing or compromised.' },
      { title: 'Ensure personal safety first.', desc: 'Watch for unauthorized transactions in your name.' },
      { title: 'Contact relevant authorities.', desc: 'File a police complain (FIR/NCR) for the lost documents.' },
      { title: 'Follow basic safety procedures.', desc: 'Block the cards if they are linked to the documents.' },
      { title: 'Help others if possible.', desc: 'Help others file reports if they were lost during a disaster.' }
    ]
  },
  {
    id: 'legal-fir-complaint',
    title: 'Legal Crisis: Filing FIR',
    category: 'Legal',
    icon: 'ph-fill ph-gavel',
    accentColor: '#b45309',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Clearly state the facts of the incident to the officer.' },
      { title: 'Ensure personal safety first.', desc: 'Wait in a public area of the police station.' },
      { title: 'Contact relevant authorities.', desc: 'If refused, contact the SP or use online FIR portals.' },
      { title: 'Follow basic safety procedures.', desc: 'Read the FIR carefully before signing; get a free copy.' },
      { title: 'Help others if possible.', desc: 'Assist illiterate or elderly persons in drafting complaints.' }
    ]
  },
  {
    id: 'property-rental-dispute',
    title: 'Property & Rental Disputes',
    category: 'Civil',
    icon: 'ph-fill ph-house-line',
    accentColor: '#10b981',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Review your rental agreement for relevant clauses.' },
      { title: 'Ensure personal safety first.', desc: 'Do not engage in physical altercations over property.' },
      { title: 'Contact relevant authorities.', desc: 'Consult a lawyer or a rental housing board.' },
      { title: 'Follow basic safety procedures.', desc: 'Keep all communication in writing (email/letter).' },
      { title: 'Help others if possible.', desc: 'Form a tenants association to prevent group harassment.' }
    ]
  },
  {
    id: 'consumer-rights-issue',
    title: 'Consumer Rights Issues',
    category: 'Commerce',
    icon: 'ph-fill ph-shopping-bag',
    accentColor: '#facc15',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Gather all receipts and warranty documents.' },
      { title: 'Ensure personal safety first.', desc: 'If a product is dangerous, stop using it immediately.' },
      { title: 'Contact relevant authorities.', desc: 'Call the National Consumer Helpline (1915).' },
      { title: 'Follow basic safety procedures.', desc: 'Send a formal notice to the company before court.' },
      { title: 'Help others if possible.', desc: 'Post a public review to warn other consumers.' }
    ]
  },
  {
    id: 'traffic-violations',
    title: 'Traffic Violations & Legal Issues',
    category: 'Legal/Road',
    icon: 'ph-fill ph-traffic-signal',
    accentColor: '#475569',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Record the location and officer details if stopped.' },
      { title: 'Ensure personal safety first.', desc: 'Park in a safe spot away from traffic flow.' },
      { title: 'Contact relevant authorities.', desc: 'Ask for a physical challan or check online portals.' },
      { title: 'Follow basic safety procedures.', desc: 'Do not offer bribes; ask for the violations list.' },
      { title: 'Help others if possible.', desc: 'Witness and document if you see harassment on the road.' }
    ]
  }
];

app.get('/api/crises', (req, res) => {
  res.json(CRISIS_DATA);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
