export type Page = 'Overview' | 'Sections' | 'Churches' | 'Users' | 'Reports' | 'Audit logs'
export type UserRole = 'district' | 'section1' | 'section2' | 'section3' | 'section4'
export interface Section { name:string; town:string; admin:string; churches:number; users:number; tone:string; health:number }
