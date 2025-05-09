export interface EC {
  id: string;
  name: string;
}

export interface UE {
  id: string;
  name: string;
  code: string;
  credits: number;
  ecs: EC[];
}

export interface Semester {
  id: string;
  name: string;
  ues: UE[];
}

export interface ClassConfig {
  id: string;
  name: string;
  academicYear: string;
  filiere: string;
  niveau: string;
  cycle: string;
  option: string;
  semesters: Semester[];
}
