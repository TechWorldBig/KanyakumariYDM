import { clientIp, ensureSchema, hashIp, sql } from './_lib.mjs'
export default async function handler(req,res){if(req.method!=='POST')return res.status(405).end();await ensureSchema();await sql.query('INSERT INTO traffic_events(ip_hash,path) VALUES($1,$2)',[hashIp(clientIp(req)),String(req.body?.path||'/').slice(0,200)]);return res.status(204).end()}
