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

function findRelation(){
  const idA = personA.value;
  const idB = personB.value;

  const A = people.find(p=>p.personId===idA);
  const B = people.find(p=>p.personId===idB);

  let relation = "No direct relation found";

  if(B.fatherId === A.personId) relation = A.name+" is father of "+B.name;
  else if(B.motherId === A.personId) relation = A.name+" is mother of "+B.name;
  else if(A.fatherId === B.personId) relation = A.name+" is son of "+B.name;
  else if(A.motherId === B.personId) relation = A.name+" is daughter of "+B.name;
  else if(A.spouseId === B.personId) relation = A.name+" is spouse of "+B.name;

  document.getElementById("result").innerText = relation;
}
