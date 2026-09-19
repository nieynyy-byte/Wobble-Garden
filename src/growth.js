export const COMPLETION_DAY=45;
export const normalizeGrowthDays=days=>Math.min(COMPLETION_DAY,Math.max(0,Number.isFinite(days)?Math.floor(days):0));
export const GROWTH_STAGES=[
 {stage:1,from:0,to:4,name:'Small beginnings',description:'A young plant with its first established leaves.'},
 {stage:2,from:5,to:9,name:'New leaves',description:'New leaves join the first growth.'},
 {stage:3,from:10,to:16,name:'Taking shape',description:'New nodes and shoots give the plant its own shape.'},
 {stage:4,from:17,to:24,name:'Branching out',description:'Fresh growth fills new spaces around the older leaves.'},
 {stage:5,from:25,to:33,name:'Filling out',description:'More leaves and growing tips build a fuller plant.'},
 {stage:6,from:34,to:44,name:'Nearly grown',description:'A well-established plant, with new growth still unfolding.'},
 {stage:7,from:45,to:45,name:'Full grown',description:'A full plant with a final flush of leaves. Forty-five days together.'}
];
export function growthForDays(days){const d=normalizeGrowthDays(days);return GROWTH_STAGES.find(s=>d<=s.to)||GROWTH_STAGES[6];}
export const growthStage=days=>growthForDays(days).stage;
export const PREVIEW_DAYS=GROWTH_STAGES.map(s=>s.from);
