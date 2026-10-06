import {sections} from '../data/sections'
import type {UserRole} from '../types'
export const accounts:Record<string,UserRole>={admin:'district',headpastor:'head-pastor',section1:'section1',section2:'section2',section3:'section3',section4:'section4'}
export const isDistrictScope=(role:UserRole)=>role==='district'||role==='head-pastor'
export const roleName=(role:UserRole)=>role==='district'?'District Super Admin':role==='head-pastor'?'Head Pastor':`Section ${role.replace('section','')} Super Admin`
export const sectionsForRole=(role:UserRole)=>isDistrictScope(role)?sections:sections.filter((_,index)=>role===`section${index+1}`)
