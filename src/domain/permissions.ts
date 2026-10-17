import {sections} from '../data/sections'
import type {UserRole} from '../types'
export const accounts:Record<string,UserRole>={admin:'district',headpastor:'head-pastor',thinktank:'think-tank',sectionpastor:'section-pastor',churchpastor:'church-pastor',districtydm:'district-ydm',districtwomen:'district-women',section1:'section1',section2:'section2',section3:'section3',section4:'section4'}
export const isDistrictScope=(role:UserRole)=>['district','think-tank','district-ydm','district-women','head-pastor'].includes(role)
export const isReadOnlyRole=(role:UserRole)=>role==='head-pastor'||role==='district-ydm'||role==='district-women'||role==='church-pastor'
export const roleName=(role:UserRole)=>({district:'District Super Admin','head-pastor':'Head Pastor','think-tank':'Think Tank Admin','section-pastor':'Section Pastor Admin','church-pastor':'Pastor of Church','district-ydm':'District YDM Leader','district-women':'District Women Leader'} as Record<string,string>)[role]||`Section ${role.replace('section','')} Super Admin`
export const sectionsForRole=(role:UserRole)=>isDistrictScope(role)?sections:sections.filter((_,index)=>role===`section${index+1}`)
