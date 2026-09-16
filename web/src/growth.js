export const GROWTH_STAGES=[
 {stage:1,from:0,to:4,name:'Seedling',description:'A small beginning. Five young leaves reach for the light.'},
 {stage:2,from:5,to:9,name:'New leaves',description:'Fresh leaves open between the first stems.'},
 {stage:3,from:10,to:16,name:'A fuller canopy',description:'The crown fills out, with leaves at different heights.'},
 {stage:4,from:17,to:24,name:'First vines',description:'The first vines find their way over the rim.'},
 {stage:5,from:25,to:33,name:'Trailing growth',description:'Longer vines carry new leaves down the sides.'},
 {stage:6,from:34,to:45,name:'Mature',description:'A full crown and two trailing vines. A little life, grown together.'}
];
export function growthForDays(days){const d=Math.max(0,Number.isFinite(days)?Math.floor(days):0);return GROWTH_STAGES.find(s=>d<=s.to)||GROWTH_STAGES[5];}
export const growthStage=days=>growthForDays(days).stage;
export const PREVIEW_DAYS=[0,5,10,17,25,34,45];
