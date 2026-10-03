export const dashboardDate=(date=new Date())=>new Intl.DateTimeFormat('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(date)
export function greeting(date=new Date()){const hour=date.getHours();return hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'}
