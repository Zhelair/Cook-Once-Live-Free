const MEALDB='https://www.themealdb.com/api/json/v1/1';
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));

let REGIONS,RULES;
let allergies=[];

fetch('./data/regions.json').then(r=>r.json()).then(d=>{
REGIONS=d.regions;
REGIONS.forEach(r=>regionSelect.add(new Option(r.label,r.id)));
});
fetch('./data/rules.json').then(r=>r.json()).then(d=>{
RULES=d;
RULES.diets.forEach(diet=>{
const b=document.createElement('button');
b.type='button';b.className='seg'+(diet.id==='omnivore'?' active':'');
b.textContent=diet.label;b.onclick=()=>selectDiet(diet.id,b);
dietTabs.appendChild(b);
});
RULES.allergies.forEach(a=>allergySelect.add(new Option(a.label,a.id)));
});

function selectDiet(id,btn){
$$('#dietTabs .seg').forEach(b=>b.classList.remove('active'));
btn.classList.add('active');
dietInput.value=id;
}

$$('#effortTabs .seg').forEach(b=>b.onclick=()=>{
$$('#effortTabs .seg').forEach(x=>x.classList.remove('active'));
b.classList.add('active');effortInput.value=b.dataset.effort;
});

addAllergy.onclick=()=>{
if(allergySelect.value && !allergies.includes(allergySelect.value)){
allergies.push(allergySelect.value);
renderAllergies();
}
};

function renderAllergies(){
allergyChips.innerHTML='';
allergies.forEach(a=>{
const c=document.createElement('span');c.className='chip';c.textContent=a;
allergyChips.appendChild(c);
});
}

planForm.onsubmit=e=>{
e.preventDefault();
const pantry=pantryInput.value.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
const diet=dietInput.value;
const region=REGIONS.find(r=>r.id===regionSelect.value);

let plan=['Base dish: oven meat + vegetables','Side: rice / potatoes','Carbs fresh daily'];
if(region.avoid_keywords.includes('tofu')){
plan=plan.filter(p=>!p.includes('tofu'));
}

planOutput.innerHTML='<ul>'+plan.map(p=>'<li>'+p+'</li>').join('')+'</ul>';

result.hidden=false;
};

btnRecipe.onclick=async()=>{
recipeBox.innerHTML='Loading...';
const r=await fetch(MEALDB+'/random.php').then(r=>r.json());
const m=r.meals[0];
const ings=[];
for(let i=1;i<=20;i++){if(m['strIngredient'+i])ings.push(m['strIngredient'+i].toLowerCase());}
const pantry=pantryInput.value.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
const have=ings.filter(i=>pantry.includes(i));
const need=ings.filter(i=>!pantry.includes(i));

recipeBox.innerHTML=`
<h4>${m.strMeal}</h4>
<p>✅ You already have: ${have.join(', ')||'nothing yet'}</p>
<p>🛒 You need: ${need.join(', ')}</p>
<img src="${m.strMealThumb}" width="100%">
`;
};
