export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type Membership = {
  companyId: string;
  role: string;
};

export type AppContext = {
  user?: User;
  memberships?: Membership[];
  db: any; // We'll type this properly later or assume it's injected/global
};
