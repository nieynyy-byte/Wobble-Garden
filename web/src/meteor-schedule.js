export const METEOR_EVENT_DATE='2026-09-30';
export function meteorEventOpen(date=new Date()){
 return date.getFullYear()===2026&&date.getMonth()===8&&date.getDate()===30;
}
