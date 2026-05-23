export const tasks = [
  { id: 1, title: "Lab Report", course: "Physics 301 - Quantum Mechanics", 
    dueIn: "4h", priority: "critical", done: false },
  { id: 2, title: "Systems Midterm", course: "CS 412 - Operating Systems", 
    dueIn: "48h", priority: "high", done: false },
  { id: 3, title: "Math Assignment", course: "MATH 205 - Linear Algebra", 
    dueIn: "3 days", priority: "standard", done: false },
  { id: 4, title: "History Essay", course: "HIST 101 - World History", 
    dueIn: "10 days", priority: "default", done: false },
];

export const coursework = [
  { id: 1, course: "CS 301", color: "accent", title: "Review Peer Code", 
    desc: "Review pull request #45 on the main repository and provide feedback on algorithmic efficiency.", 
    meta: "2 comments", metaIcon: "comment" },
  { id: 2, course: "BIO 200", color: "green", title: "Read Chapter 4", 
    desc: "Complete the reading on cellular respiration before Tuesday's lecture.", 
    meta: "1 file", metaIcon: "file" },
];

export const alerts = [
  { id: 1, type: "critical", title: "Lab Report Due", 
    desc: "CS301 Lab Report is due in 4 hours", time: "10m ago" },
  { id: 2, type: "high", title: "Midterm Reminder", 
    desc: "Systems Architecture Midterm in 48 hours", time: "1h ago" },
  { id: 3, type: "standard", title: "New Comment", 
    desc: "Prof. Henderson commented on your submission", time: "2h ago" },
  { id: 4, type: "standard", title: "Email Received", 
    desc: "Engineering Dept sent you an email", time: "3h ago" },
];

export const emails = [
  { id: 1, sender: "Prof. Henderson", subject: "Lab Data Correction", 
    preview: "Please use the updated dataset attached to this email for your reports. The previous set had...", 
    time: "10s ago" },
  { id: 2, sender: "Engineering Dept", subject: "Fall Career Fair Registration", 
    preview: "Registration opens tomorrow for the virtual career fair...", 
    time: "2h ago" },
];
