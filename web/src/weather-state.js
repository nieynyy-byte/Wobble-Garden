// Approximate Thai seasonal calendar; actual monsoon onset varies each year.
export function thaiSeason(date=new Date()){
 const md=(date.getMonth()+1)*100+date.getDate();
 return md>=216&&md<516?'hot':md>=516&&md<1016?'rainy':'cool';
}
export const RAIN_LEVELS={clear:0,light:.26,rain:.6,heavy:1};
export function rainFromCurrent(current){
 const code=current?.weather_code;
 if(!Number.isFinite(code))throw new Error('Missing weather code');
 // Never turn snow or dry overcast into tropical rain.
 if([65,67,82,95,96,99].includes(code))return 'heavy';
 if([63,66,81].includes(code))return 'rain';
 if([51,53,55,56,57,61,80].includes(code))return 'light';
 return 'clear';
}
