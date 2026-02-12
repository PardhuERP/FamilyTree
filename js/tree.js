// API_URL comes from index.html
const FAMILY_ID = localStorage.getItem("familyId");

if(!FAMILY_ID){
  alert("No family selected");
  location.href = "family-select.html";
}

const width = window.innerWidth;
const height = window.innerHeight - 120;

/* ---------- TREE SETUP ---------- */

// GLOBAL selected node
window.selectedNode = null;

let svg, g, zoom, treeLayout, root, i = 0;
let map = {};
const searchBox = document.getElementById("searchBox");

if(document.getElementById("tree")){

  // ✅ create zoom globally
zoom = d3.zoom()
  .scaleExtent([0.3,3])
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

svg = d3.select("#tree")
  .attr("width", width)
  .attr("height", height)
  .call(zoom);

  g = svg.append("g")
    .attr("transform", `translate(${width/2}, 80)`);

  treeLayout = d3.tree().nodeSize([80,180]);

  const USER_ID = localStorage.getItem("userId");

  if(!FAMILY_ID || !USER_ID){
  alert("Session expired. Please login again.");
  location.href = "login.html";
  return;
}
fetch(`${API_URL}?action=getTree&familyId=${FAMILY_ID}&userId=${USER_ID}`)
    .then(r => r.json())
    .then(res => {
      if(res.status === "OK"){
        buildTree(res.data);
      }
    });
}

/* ---------- BUILD TREE ---------- */
function buildTree(rows){

  if(!rows || rows.length === 0){
    alert("No members found. Add founder.");
    return;
  }

  map = {};

  // create nodes
  rows.forEach(p=>{
    map[p.personId] = {...p, children:[]};
  });

// link parents (father + mother grouping)
rows.forEach(p=>{

  const child = map[p.personId];

  // ✅ decide parent (father priority, else mother)
  let parentId = null;

  if(p.fatherId && map[p.fatherId]){
    parentId = p.fatherId;
  }
  else if(p.motherId && map[p.motherId]){
    parentId = p.motherId;
  }

  if(!parentId) return;

  const parent = map[parentId];

  // marriage group key
  const key =
    (p.fatherId || "single") + "_" +
    (p.motherId || "single");

  // create marriage container if not exists
  if(!parent._marriages){
    parent._marriages = {};
  }

  // create marriage node
  if(!parent._marriages[key]){

    parent._marriages[key] = {
      name: map[p.motherId]?.name || "",
      isMarriageNode: true,
      children: []
    };

    // attach marriage node to parent
    parent.children.push(parent._marriages[key]);
  }

  // add child under that marriage
  parent._marriages[key].children.push(child);

});
  // connect spouses (MULTIPLE SUPPORT)
rows.forEach(p => {

  if(!p.spouseId) return;

  const spouseIds = String(p.spouseId).split(",");

  map[p.personId].spouses = [];

  spouseIds.forEach(id => {

    if(map[id]){
      map[p.personId].spouses.push(map[id]);

      // reverse link also
      if(!map[id].spouses){
        map[id].spouses = [];
      }

      if(!map[id].spouses.includes(map[p.personId])){
        map[id].spouses.push(map[p.personId]);
      }
    }

  });

});

  // safer founder detection
  const founder = rows.find(r => !r.fatherId && !r.motherId);

  root = d3.hierarchy(map[founder.personId]);

  root.x0 = height/2;
  root.y0 = 0;

  root.children && root.children.forEach(collapse);
  update(root);
  centerNode(root);
}

function collapse(d){
  if(d.children){
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}

function expandPath(d){
  let p = d;
  while(p){
    if(p._children){
      p.children = p._children;
      p._children = null;
    }
    p = p.parent;
  }
}

/* ---------- UPDATE TREE ---------- */
function update(source){

  const treeData = treeLayout(root);
  const nodes = treeData.descendants();
  const links = treeData.links();

  nodes.forEach(d => d.y = d.depth * 180);

  const node = g.selectAll(".node")
    .data(nodes, d => d.id || (d.id = ++i));

  const nodeEnter = node.enter().append("g")
    .attr("class","node")
    .attr("transform", `translate(${source.y0 || 0},${source.x0 || 0})`)
    .style("cursor","pointer")
    .on("click", toggle);

nodeEnter.append("rect")
  .attr("height", d => d.data.isMarriageNode ? 20 : 34)
  .attr("width",  d => d.data.isMarriageNode ? 20 : 120)
  .attr("rx", 12)
  .attr("ry", 12)
  .attr("x", d => d.data.isMarriageNode ? -10 : -60)
  .attr("y", d => d.data.isMarriageNode ? -10 : -17)

  // background
  .style("fill", d => {
    if(d.data.isMarriageNode) return "transparent";

    return d.data.gender === "Female"
      ? "#fff0f6"   // light pink background
      : "#ffffff";  // male white
  })

  // border color
  .style("stroke", d => {

    if(d.data.isMarriageNode)
      return "transparent";

    if(d.data.gender === "Female")
      return "#e91e63";   // female pink

    return "#2563eb";     // male blue
  })

  .style("stroke-width", 2);
  
  
  nodeEnter.append("text")
  .attr("text-anchor","middle")
  .attr("dy",".35em")
  .style("font-weight","600")
  .text(d=>{
  if(d.data.isMarriageNode) return "";

    // ✅ hide marriage helper nodes
    if(d.data.isMarriageNode){
      return "";
    }

    const name = d.data.name || "";

    const spouse =
      d.data.spouses
        ? d.data.spouses.map(s => s.name).join(" , ")
        : "";

    return spouse
      ? `${name} 👩‍❤️‍👨 ${spouse}`
      : name;
  });

  nodeEnter.each(function(){
    const text = d3.select(this).select("text");
    const bbox = text.node().getBBox();
    const padding = 20;

    d3.select(this).select("rect")
      .attr("width", bbox.width + padding)
      .attr("x", -(bbox.width + padding)/2);
  });

  nodeEnter.merge(node)
    .transition().duration(400)
    .attr("transform", d=>{
  const x = (d.x !== undefined) ? d.x : 0;
  const y = (d.y !== undefined) ? d.y : 0;
  return `translate(${y},${x})`;
});

  const link = g.selectAll(".link")
  .data(
    links.filter(d =>
      !(d.target.data.isMarriageNode &&
        (!d.target.children || d.target.children.length === 0))
    ),
    d => d.target.id
  );

  link.enter().insert("path","g")
    .attr("class","link")
    .merge(link)
    .transition().duration(400)
    .attr("d", d=>diagonal(d.source,d.target));

  nodes.forEach(d=>{
    d.x0=d.x;
    d.y0=d.y;
  });
}

function diagonal(s,d){
  return `M ${s.y} ${s.x}
          C ${(s.y+d.y)/2} ${s.x},
            ${(s.y+d.y)/2} ${d.x},
            ${d.y} ${d.x}`;
}

/* ---------- NODE CLICK ---------- */
function toggle(event,d){

  event.stopPropagation();

  window.selectedNode = {
    personId: d.data.personId,
    name: d.data.name
  };
  showProfileCard(d.data);

  localStorage.setItem("selectedParent", d.data.personId);
  localStorage.setItem("selectedParentName", d.data.name);

  g.selectAll(".node").classed("search-match", false);
  d3.select(event.currentTarget).classed("search-match", true);

 setTimeout(()=>{

  // normal expand / collapse
  if(d.children){
    d._children = d.children;
    d.children = null;
  }else{
    d.children = d._children;
    d._children = null;
  }

  // ✅ AUTO EXPAND marriage nodes
  if(d.children){
    d.children.forEach(c=>{
      if(c.data && c.data.isMarriageNode){
        if(c._children){
          c.children = c._children;
          c._children = null;
        }
      }
    });
  }

  update(d);

},50); 
}

/* ---------- BUTTONS ---------- */
if(document.getElementById("collapseBtn")){
  document.getElementById("collapseBtn").onclick=()=>{
    if(!root) return;
    root.children && root.children.forEach(collapse);
    update(root);
  };
}

if(document.getElementById("expandBtn")){
  document.getElementById("expandBtn").onclick=()=>{
    if(!root) return;
    root.each(d=>{
      if(d._children){
        d.children=d._children;
        d._children=null;
      }
    });
    update(root);
  };
}

/* ---------- GENERATION ---------- */
function getPersonGen(personId){

  const USER_ID = localStorage.getItem("userId");

  return fetch(
    API_URL +
    "?action=getTree" +
    "&familyId=" + FAMILY_ID +
    "&userId=" + USER_ID
  )
  .then(r=>r.json())
  .then(res=>{
    if(res.status!=="OK") return 1;
    const p = res.data.find(x=>x.personId===personId);
    return p ? Number(p.generation) : 1;
  });
}

/* ---------- ADD PERSON ---------- */
async function addPerson(){

  const name = document.getElementById("pname")?.value;
  const gender = document.getElementById("pgender")?.value;
  const dob = document.getElementById("pdob")?.value;
  const blood = document.getElementById("pblood")?.value;
  const edu = document.getElementById("pedu")?.value;
  const place = document.getElementById("pplace")?.value;
  const fatherId = document.getElementById("pfather")?.value;
  const motherId =
  document.getElementById("pmother")?.value || "";
  const spouseId = document.getElementById("pspouse")?.value || "";
  const photoUrl =
  document.getElementById("previewPhoto")?.src || "";
  if(!name){
    alert("Enter name");
    return;
  }

  let gen = 1;
if(fatherId){
  gen = await getPersonGen(fatherId) + 1;
}

fetch(API_URL, {
  method: "POST",
  body: JSON.stringify({
    action: "addPerson",
    familyId: FAMILY_ID,
    name: name,
    gender: gender,
    dob: dob,
    bloodGroup: blood,
    qualification: edu,
    place: place,
    fatherId: fatherId,
    motherId: motherId,
    spouseId: spouseId,
    photoUrl: window.photoBase64 || "",
    generation: gen
  })
})
.then(r=>r.json())
.then(res=>{
  if(res.status==="OK"){
    alert("Added successfully!");
    localStorage.removeItem("selectedParent");
    localStorage.removeItem("selectedParentName");
    window.location.href="index.html";
  }else{
    alert("Error adding person");
  }
})
.catch(()=>{
  alert("Network error");
});
}

/* ---------- SEARCH ---------- */
if(searchBox){
  searchBox.addEventListener("input", function(){

    const q=this.value.toLowerCase().trim();
    if(!root || !q) return;

    let found=null;

    root.each(d=>{
      if(d.data.name.toLowerCase().includes(q)){
        found=d;
      }
    });

    if(found){
      expandPath(found);
      update(found);

      setTimeout(()=>{
        g.selectAll(".node").classed("search-match",false);
        g.selectAll(".node").each(function(d){
          if(d===found){
            d3.select(this).classed("search-match",true);
            centerNode(d);
          }
        });
      },300);
    }
  });
}


function showProfileCard(p){
  window.currentPerson = p;
  document.getElementById("pName").innerText = p.name || "-";

  let dobText = "-";

  if(p.dob){
    const d = new Date(p.dob);

    const dateOnly = d.toISOString().split("T")[0];

    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
      age--;
    }

    dobText = dateOnly + " (" + age + " yrs)";
  }

  document.getElementById("pDob").innerText = dobText;

  document.getElementById("pBlood").innerText =
    p.bloodGroup || "-";

  document.getElementById("pEdu").innerText =
    p.qualification || "-";

  document.getElementById("pPlace").innerText =
    p.place || "-";

  // ✅ ADD THIS BLOCK (PHOTO)
  document.getElementById("pPhoto").src =
    (p.photoUrl && p.photoUrl !== "")
      ? p.photoUrl
      : "https://via.placeholder.com/80";

  document.getElementById("pFather").innerText =
    map[p.fatherId]?.name || "-";

  document.getElementById("pMother").innerText =
    map[p.motherId]?.name || "-";

  document.getElementById("profileCard").style.display = "block";
}

function closeProfile(){
  document.getElementById("profileCard").style.display = "none";
}

function openHDPhotoUpload(){

  if(!window.currentPerson) return;

  const hdUrl = window.currentPerson.hdphotourl;

  if(!hdUrl){
    alert("HD photo not available");
    return;
  }

  document.getElementById("hdPhotoView").src = hdUrl;
  document.getElementById("hdPhotoOverlay").style.display = "flex";
}

function closeHDPhotoUpload(){
  document.getElementById("hdPhotoOverlay").style.display = "none";
}

/* ---------- ADD BUTTON ---------- */
if(document.getElementById("addBtn")){
  document.getElementById("addBtn")
    .addEventListener("click", addPerson);
}

document.getElementById("searchBox")
.addEventListener("input", function(){

  const text = this.value.toLowerCase();

  if(!text) return;

  const match = findPerson(root, text);

  if(match){
    expandParents(match);
    update(match);
    centerNode(match);
  }

});

function findPerson(node, text){

  if(node.data.name &&
     node.data.name.toLowerCase().includes(text)){
    return node;
  }

  let found = null;

  if(node.children){
    node.children.forEach(c=>{
      if(!found){
        found = findPerson(c, text);
      }
    });
  }

  if(node._children){
    node._children.forEach(c=>{
      if(!found){
        found = findPerson(c, text);
      }
    });
  }

  return found;
}

function expandParents(node){

  let parent = node.parent;

  while(parent){
    if(parent._children){
      parent.children = parent._children;
      parent._children = null;
    }
    parent = parent.parent;
  }
}

function centerNode(source){

  if(!source || source.x == null || source.y == null)
    return;

  const scale = 1;

  const x = width/2 - source.y;
  const y = height/2 - source.x;

  svg.transition()
    .duration(400)
    .call(
      zoom.transform,
      d3.zoomIdentity
        .translate(x, y)
        .scale(scale)
    );
}
