export interface Provider {
  id: string;
  name: string;
  acronym: string;
  status: "active" | "suspended";
  dateRegistered: string;
  recordCount: number;
  contactPerson: string;
  email: string;
  description: string;
}

export interface RegistrationRequest {
  id: string;
  officeName: string;
  acronym: string;
  contactPerson: string;
  email: string;
  dateSubmitted: string;
  description: string;
  status: "pending" | "approved" | "rejected";
}

export interface DataRequest {
  id: string;
  requesterName: string;
  requesterAcronym: string;
  targetProviderName: string;
  targetProviderAcronym: string;
  dataType: string;
  scope: string;
  purpose: string;
  dateRequested: string;
  status: "pending" | "approved" | "denied";
}

export interface CitizenRecord {
  id: string;
  fullName: string;
  citizenId: string;
  timeline: {
    office: string;
    dateTime: string;
    action: "submitted" | "accessed" | "shared";
    status: string;
  }[];
}

export const providers: Provider[] = [
  { id: "1", name: "Barangay Affairs Office", acronym: "BAO", status: "active", dateRegistered: "2024-01-15", recordCount: 1243, contactPerson: "Maria Santos", email: "bao@gov.ph", description: "Manages barangay-level citizen records and certifications." },
  { id: "2", name: "Public Employment Service Office", acronym: "PESO", status: "active", dateRegistered: "2024-02-20", recordCount: 856, contactPerson: "Juan Cruz", email: "peso@gov.ph", description: "Handles employment records and job matching services." },
  { id: "3", name: "Business Permits & Licensing Office", acronym: "BPLO", status: "active", dateRegistered: "2024-03-10", recordCount: 2105, contactPerson: "Ana Reyes", email: "bplo@gov.ph", description: "Processes business permits and licensing records." },
  { id: "4", name: "Civil Registry Office", acronym: "CRO", status: "active", dateRegistered: "2024-04-05", recordCount: 3421, contactPerson: "Pedro Lim", email: "cro@gov.ph", description: "Manages civil documents including birth, marriage, and death records." },
  { id: "5", name: "Social Welfare & Development Office", acronym: "SWDO", status: "suspended", dateRegistered: "2024-05-12", recordCount: 678, contactPerson: "Rosa Garcia", email: "swdo@gov.ph", description: "Handles social welfare programs and beneficiary data." },
];

export const registrationRequests: RegistrationRequest[] = [
  { id: "r1", officeName: "City Health Office", acronym: "CHO", contactPerson: "Dr. Elena Tan", email: "cho@gov.ph", dateSubmitted: "2025-03-18", description: "Requesting access to share public health records and vaccination data.", status: "pending" },
  { id: "r2", officeName: "City Planning & Development Office", acronym: "CPDO", contactPerson: "Engr. Mark Villar", email: "cpdo@gov.ph", dateSubmitted: "2025-03-15", description: "Needs to exchange zoning and land-use data with other offices.", status: "pending" },
  { id: "r3", officeName: "City Treasurer's Office", acronym: "CTO", contactPerson: "Atty. Grace Ong", email: "cto@gov.ph", dateSubmitted: "2025-03-10", description: "For tax record sharing and revenue data exchange.", status: "pending" },
];

export const dataRequests: DataRequest[] = [
  { id: "d1", requesterName: "Public Employment Service Office", requesterAcronym: "PESO", targetProviderName: "Barangay Affairs Office", targetProviderAcronym: "BAO", dataType: "Residency Certificates", scope: "All active residents aged 18-60", purpose: "Employment eligibility verification", dateRequested: "2025-03-20", status: "pending" },
  { id: "d2", requesterName: "Business Permits & Licensing Office", requesterAcronym: "BPLO", targetProviderName: "Civil Registry Office", targetProviderAcronym: "CRO", dataType: "Business Owner Identity", scope: "New applicants Q1 2025", purpose: "Identity verification for business permit applications", dateRequested: "2025-03-19", status: "pending" },
  { id: "d3", requesterName: "Social Welfare & Development Office", requesterAcronym: "SWDO", targetProviderName: "Barangay Affairs Office", targetProviderAcronym: "BAO", dataType: "Household Composition", scope: "Low-income households", purpose: "Beneficiary validation for social programs", dateRequested: "2025-03-17", status: "pending" },
];

export const citizenRecords: CitizenRecord[] = [
  {
    id: "c1", fullName: "Juan Dela Cruz", citizenId: "CIT-2024-0001",
    timeline: [
      { office: "Barangay Affairs Office", dateTime: "2025-03-20 09:15", action: "submitted", status: "Processed" },
      { office: "Civil Registry Office", dateTime: "2025-03-19 14:30", action: "accessed", status: "Verified" },
      { office: "Public Employment Service Office", dateTime: "2025-03-18 10:00", action: "shared", status: "Completed" },
      { office: "Business Permits & Licensing Office", dateTime: "2025-03-15 11:45", action: "accessed", status: "Pending Review" },
    ]
  },
  {
    id: "c2", fullName: "Maria Clara Santos", citizenId: "CIT-2024-0042",
    timeline: [
      { office: "Social Welfare & Development Office", dateTime: "2025-03-21 08:00", action: "submitted", status: "Under Review" },
      { office: "Barangay Affairs Office", dateTime: "2025-03-19 13:20", action: "accessed", status: "Verified" },
    ]
  },
  {
    id: "c3", fullName: "Pedro Reyes Lim", citizenId: "CIT-2024-0108",
    timeline: [
      { office: "Civil Registry Office", dateTime: "2025-03-22 10:30", action: "submitted", status: "Processed" },
      { office: "Barangay Affairs Office", dateTime: "2025-03-20 16:00", action: "shared", status: "Completed" },
      { office: "Public Employment Service Office", dateTime: "2025-03-18 09:45", action: "accessed", status: "Verified" },
    ]
  },
];

export const activityFeed = [
  { id: 1, message: "BPLO requested access to CRO data", time: "2 hours ago", type: "request" as const },
  { id: 2, message: "City Health Office submitted registration", time: "5 hours ago", type: "registration" as const },
  { id: 3, message: "PESO data request approved", time: "1 day ago", type: "approval" as const },
  { id: 4, message: "BAO uploaded 45 new records", time: "1 day ago", type: "upload" as const },
  { id: 5, message: "SWDO account suspended", time: "2 days ago", type: "alert" as const },
];

export const exchangeChartData = [
  { month: "Oct", exchanges: 120, requests: 45 },
  { month: "Nov", exchanges: 180, requests: 62 },
  { month: "Dec", exchanges: 150, requests: 38 },
  { month: "Jan", exchanges: 210, requests: 74 },
  { month: "Feb", exchanges: 280, requests: 89 },
  { month: "Mar", exchanges: 320, requests: 95 },
];
