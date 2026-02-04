const API_URL = "https://script.google.com/macros/s/AKfycbytM7snXYUkPLqdkIb9z-CQkUyDVRoUx1ef7-r02duWq139BWq1xWgg8m11BMgEOgVB/exec";
const FAMILY_ID = "F001";

let people = [];

fetch(API_URL + "?action=getTree&familyId=" + FAMILY_ID)
  .then(r => r.json())
  .then(res => {
    if(res.status === "OK"){
      people = res.data;
      fillDropdowns();
    }
  });

function fillDropdowns(){
  const A = document.getElementById("personA");
  const B = document.getElementById("personB");

  people.forEach(p=>{
    const opt1 = new Option(p.name + " ("+p.personId+")", p.personId);
    const opt2 = new Option(p.name + " ("+p.personId+")", p.personId);
    A.add(opt1);
    B.add(opt2);
  });
}

function findRelation(a, b, people){

  const A = people.find(p => p.personId === a);
  const B = people.find(p => p.personId === b);

  if(!A || !B) return "Relation not found";

  // Spouse
  if(A.spouseId === B.personId || B.spouseId === A.personId){
    return `${A.name} is spouse of ${B.name}`;
  }

  // Father / Mother
  if(B.fatherId === A.personId){
    return `${A.name} is father of ${B.name}`;
  }
  if(B.motherId === A.personId){
    return `${A.name} is mother of ${B.name}`;
  }

  // Son / Daughter
  if(A.fatherId === B.personId){
    return `${A.name} is son of ${B.name}`;
  }
  if(A.motherId === B.personId){
    return `${A.name} is daughter of ${B.name}`;
  }

  // Grandfather / Grandmother
  const A_father = people.find(p => p.personId === A.fatherId);
  const A_mother = people.find(p => p.personId === A.motherId);

  if(A_father && A_father.fatherId === B.personId){
    return `${A.name} is grandson of ${B.name}`;
  }
  if(A_mother && A_mother.motherId === B.personId){
    return `${A.name} is granddaughter of ${B.name}`;
  }

  // Brother / Sister (same father OR same mother)
if (
  (A.fatherId && A.fatherId === B.fatherId) ||
  (A.motherId && A.motherId === B.motherId)
) {
  if (A.personId !== B.personId) {
    return `${A.name} and ${B.name} are siblings`;
  }
}

  return "Relation not mapped yet";
}
