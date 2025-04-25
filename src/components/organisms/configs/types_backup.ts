export type EC = {
    id: string;
    name: string;
    credits: number;
  };
  
  export type UE = {
    id: string;
    name: string;
    credits: number;
    ecs: EC[];
  };
  
  export type Semester = {
    id: string;
    name: string;
    ues: UE[];
  };
  
  export type ClassConfig = {
    id: string;
    name: string;
    academicYear: string;
    semesters: Semester[];
  };