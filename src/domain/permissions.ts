import {sections} from '../data/sections'
import type {UserRole} from '../types'
export const accounts:Record<string,UserRole>={admin:'district',section1:'section1',section2:'section2',section3:'section3',section4:'section4'}
export const roleName=(role:UserRole)=>role==='district'?'District Super Admin':`Section ${role.replace('section','')} Super Admin`
export const sectionsForRole=(role:UserRole)=>role==='district'?sections:sections.filter((_,index)=>role===`section${index+1}`)
