import { Card } from '../ui/card'

export function Metric({icon:Icon,label,value,tone}:{icon:React.ElementType;label:string;value:string;tone:string}){
  return <Card className="metric min-w-0 transition-[box-shadow,transform] duration-200">
    <div className={`metric-icon ${tone}`} aria-hidden="true"><Icon size={18}/></div>
    <div className="min-w-0">
      <span className="truncate">{label}</span>
      <strong className="tabular-nums">{value}</strong>
      <small className="block truncate">Within your access</small>
    </div>
  </Card>
}
