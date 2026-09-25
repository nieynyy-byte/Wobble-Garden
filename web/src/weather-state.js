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
 // Liquid amounts are a fallback when the summary code still says dry/cloudy.
 // Keep snow codes excluded; do not infer a storm from an accumulation amount.
 if(![71,73,75,77,85,86].includes(code)&&[current.rain,current.showers].some(v=>Number.isFinite(v)&&v>0))return 'light';
 return 'clear';
}

// Unix timestamps avoid confusing the provider's local timezone with the device.
export function forecastAt(hourly,time=Date.now()){
 if(!Array.isArray(hourly?.time))return null;
 const index=hourly.time.findIndex(t=>Number.isFinite(t)&&time>=t*1000&&time<(t+3600)*1000);
 if(index<0)return null;
 try{return {level:rainFromCurrent({weather_code:hourly.weather_code?.[index],rain:hourly.rain?.[index],showers:hourly.showers?.[index]}),validAt:hourly.time[index]*1000};}catch{return null;}
}
