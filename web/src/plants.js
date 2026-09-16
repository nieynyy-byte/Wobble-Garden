export const PLANTS=[
 {id:'pothos',name:'Pothos',thai:'พลูด่าง',latin:'Epipremnum aureum',line:'A little heart, a little wander.',detail:'Soft heart-shaped leaves on slender stems. As it grows, its vines will find their own way down.',care:'Bright, indirect light · let the soil partly dry',color:'#6f934f'},
 {id:'fittonia',name:'Fittonia',thai:'พรมออสเตรเลีย',latin:'Fittonia albivenis',line:'Tiny leaves. Beautiful little veins.',detail:'A low, spreading plant with delicate pale veins. New leaves gather into a soft, close-knit cushion.',care:'Gentle indirect light · evenly moist soil',color:'#89906f'},
 {id:'peperomia',name:'Peperomia',thai:'เปปเปอร์โรเมีย',latin:'Peperomia obtusifolia',line:'Round leaves, quiet company.',detail:'Rounded, plump leaves with a gentle sheen. Its young stems grow into a compact, softly rounded plant.',care:'Bright, indirect light · allow some drying',color:'#64856d'},
 {id:'syngonium',name:'Syngonium',thai:'เงินไหลมา',latin:'Syngonium podophyllum',line:'Little arrows, reaching for the light.',detail:'Young arrow-shaped leaves reach upward and outward, each leaf finding a slightly different angle.',care:'Filtered light · lightly moist soil',color:'#9ba775'},
 {id:'sansevieria',name:'Mini Sansevieria',thai:'ลิ้นมังกรแคระ',latin:'Dracaena trifasciata ‘Hahnii’',line:'A small, steady kind of green.',detail:'Upright patterned leaves form a little rosette. New shoots grow beside it as the plant matures.',care:'Indirect light · let soil dry between watering',color:'#7e8a59'}
];
export const plantById=id=>PLANTS.find(p=>p.id===id)||PLANTS[0];
