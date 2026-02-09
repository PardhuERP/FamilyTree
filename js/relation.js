const API_URL =
"https://script.google.com/macros/s/AKfycbytM7snXYUkPLqdkIb9z-CQkUyDVRoUx1ef7-r02duWq139BWq1xWgg8m11BMgEOgVB/exec";

const FAMILY_ID = localStorage.getItem("familyId");
const USER_ID = localStorage.getItem("userId");

let people = [];
let dataReady = false;

/* ---------- LOAD TREE DATA ---------- */

fetch(API_URL +
 "?action=getTree" +
 "&familyId=" + FAMILY_ID +
 "&userId=" + USER_ID)
.then(r => r.json())
.then(res => {
  if(res.status === "OK"){
    people = res.data;
    dataReady = true;
    fillDropdowns();
  }
});

/* ---------- DROPDOWN ---------- */

function fillDropdowns(){

  const listA = document.getElementById("personAList");
  const listB = document.getElementById("personBList");

  listA.innerHTML = "";
  listB.innerHTML = "";

  people.forEach(p=>{

    listA.innerHTML += `
      <div class="dropdownItem"
        onclick="selectPerson('A','${p.personId}','${p.name}')">
        ${p.name}
      </div>`;

    listB.innerHTML += `
      <div class="dropdownItem"
        onclick="selectPerson('B','${p.personId}','${p.name}')">
        ${p.name}
      </div>`;
  });
}

function openDropdown(type){
  document.getElementById("personADrop").style.display = "none";
  document.getElementById("personBDrop").style.display = "none";

  document.getElementById("person"+type+"Drop").style.display = "block";
}

function selectPerson(type,id,name){
  document.getElementById("person"+type+"Input").value = name;
  document.getElementById("person"+type+"Input").dataset.id = id;
  document.getElementById("person"+type+"Drop").style.display = "none";
}

function filterPerson(type,value){

  value = value.toLowerCase();

  const items =
    document.querySelectorAll("#person"+type+"List .dropdownItem");

  items.forEach(i=>{
    i.style.display =
      i.innerText.toLowerCase().includes(value)
      ? "block" : "none";
  });
}

/* ---------- HELPERS ---------- */

function getPerson(id){
  return people.find(p => p.personId === id);
}

function getFather(p){
  return getPerson(p.fatherId);
}

function getMother(p){
  return getPerson(p.motherId);
}

function areSiblings(A,B){
  return (
    A.personId !== B.personId &&
    (
      (A.fatherId && A.fatherId === B.fatherId) ||
      (A.motherId && A.motherId === B.motherId)
    )
  );
}

function getAncestorLevel(childId, ancestorId){

  let level = 0;
  let current = getPerson(childId);

  while(current){

    if(current.fatherId === ancestorId ||
       current.motherId === ancestorId){
      return level + 1;
    }

    current =
      getPerson(current.fatherId) ||
      getPerson(current.motherId);

    level++;

    if(level > 10) break;
  }

  return 0;
}

/* ---------- MAIN RELATION ---------- */

function checkRelation(){

  const a =
    document.getElementById("personAInput").dataset.id;

  const b =
    document.getElementById("personBInput").dataset.id;

  const res = findRelation(a,b);

  document.getElementById("result").innerText = res;
}

function findRelation(a,b){

  if(!dataReady) return "Data loading...";

  const A = getPerson(a);
  const B = getPerson(b);

  if(!A || !B) return "Relation not found";
  if(a === b) return "Same person";

  const A_father = getFather(A);
  const A_mother = getMother(A);
  const B_father = getFather(B);
  const B_mother = getMother(B);

  /* ---- SPOUSE ---- */
  if(
    String(A.spouseId||"").split(",").includes(B.personId) ||
    String(B.spouseId||"").split(",").includes(A.personId)
  ){
    return `${A.name} is spouse of ${B.name}`;
  }

  /* ---- SIBLINGS ---- */
  if(areSiblings(A,B)){
    return `${A.name} is ${
      A.gender==="Female"?"sister":"brother"
    } of ${B.name}`;
  }

  /* ---- PARENT ---- */
  if(B.fatherId===A.personId || B.motherId===A.personId){
    return `${A.name} is ${
      A.gender==="Female"?"mother":"father"
    } of ${B.name}`;
  }

  /* ---- CHILD ---- */
  if(A.fatherId===B.personId || A.motherId===B.personId){
    return `${A.name} is ${
      A.gender==="Female"?"daughter":"son"
    } of ${B.name}`;
  }

  /* ---- UNCLE / AUNT ---- */
  if(A_father && areSiblings(A_father,B))
    return `${B.name} is uncle/aunt of ${A.name}`;

  if(A_mother && areSiblings(A_mother,B))
    return `${B.name} is uncle/aunt of ${A.name}`;

  /* ---- COUSINS ---- */
  if(A_father && B_father && areSiblings(A_father,B_father))
    return `${A.name} and ${B.name} are cousins`;

  /* ---------- ANCESTOR CHECK ---------- */

  let levelAB = getAncestorLevel(A.personId,B.personId);

  if(levelAB>0){

    if(levelAB===1)
      return `${A.name} is child of ${B.name}`;

    if(levelAB===2)
      return `${A.name} is grandchild of ${B.name}`;

    return `${A.name} is ${
      "great ".repeat(levelAB-2)
    }grandchild of ${B.name}`;
  }

  let levelBA = getAncestorLevel(B.personId,A.personId);

  if(levelBA>0){

    if(levelBA===1)
      return `${A.name} is parent of ${B.name}`;

    if(levelBA===2)
      return `${A.name} is grandparent of ${B.name}`;

    return `${A.name} is ${
      "great ".repeat(levelBA-2)
    }grandparent of ${B.name}`;
  }

  return "Relation not mapped yet";
}

/* ---------- CLOSE DROPDOWN OUTSIDE CLICK ---------- */

document.addEventListener("click", function(e){

  if(!e.target.closest(".searchSelect")){
    document.getElementById("personADrop").style.display="none";
    document.getElementById("personBDrop").style.display="none";
  }
});
