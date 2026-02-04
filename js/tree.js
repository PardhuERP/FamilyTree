const API_URL = "https://script.google.com/macros/s/AKfycbytM7snXYUkPLqdkIb9z-CQkUyDVRoUx1ef7-r02duWq139BWq1xWgg8m11BMgEOgVB/exec";
const FAMILY_ID = "F001";

const width = window.innerWidth;
const height = window.innerHeight - 120;

/* ---------- TREE SETUP ---------- */
// GLOBAL selected node (shared with menu)
window.selectedNode = null;
let svg, g, treeLayout, root, i = 0;
let map = {};
const searchBox = document.getElementById("searchBox");

if(document.getElementById("tree")){
  svg = d3.select("#tree")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().scaleExtent([0.3,3]).on("zoom", e=>{
      g.attr("transform", e.transform);
    }));

  g = svg.append("g")
    .attr("transform", `translate(${width/2}, 80)`);

  treeLayout = d3.tree().nodeSize([80,180]);

  fetch(`${API_URL}?action=getTree&familyId=${FAMILY_ID}`)
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

// 1️⃣ First create all nodes
rows.forEach(p => {
  map[p.personId] = { ...p, children: [] };
});

// 2️⃣ Then link parents
rows.forEach(p => {
  const child = map[p.personId];

  if(p.fatherId && map[p.fatherId] && p.fatherId !== p.personId){
    const f = map[p.fatherId];
    if(!f.children.includes(child)){
      f.children.push(child);
    }
  }

  if(p.motherId && map[p.motherId] && p.motherId !== p.personId){
    const m = map[p.motherId];
    if(!m.children.includes(child)){
      m.children.push(child);
    }
  }
});

  // connect spouses
  rows.forEach(p=>{
    if(p.spouseId && map[p.spouseId]){
      map[p.personId].spouse = map[p.spouseId];
      map[p.spouseId].spouse = map[p.personId];
    }
  });

  const founder = rows.find(r => !r.fatherId);
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


function update(source){
  const treeData = treeLayout(root);
  const nodes = treeData.descendants();
  const links = treeData.links();
  nodes.forEach(d => d.y = d.depth * 180);

  const node = g.selectAll(".node")
    .data(nodes, d => d.id || (d.id = ++i));

  // ENTER
  const nodeEnter = node.enter().append("g")
    .attr("class","node")
    .attr("transform", `translate(${source.y0},${source.x0})`)
    .style("cursor","pointer")
    .on("click", toggle);

  // RECT
  nodeEnter.append("rect")
    .attr("height", 34)
    .attr("rx", 12)
    .attr("ry", 12)
    .attr("y", -17);
  

  // TEXT
  nodeEnter.append("text")
    .attr("text-anchor","middle")
    .attr("dy",".35em")
    .style("font-weight","600")
    .text(d => {
      const name = d.data.name || "";
      const spouse = d.data.spouse && d.data.spouse.name ? d.data.spouse.name : "";
      return spouse ? `${name} 👩‍❤️‍👨 ${spouse}` : name;
    });
  
  // AUTO SIZE BOX
  nodeEnter.each(function(){
    const text = d3.select(this).select("text");
    const bbox = text.node().getBBox();
    const padding = 20;

    d3.select(this).select("rect")
      .attr("width", bbox.width + padding)
      .attr("x", -(bbox.width + padding) / 2);
  });

  // UPDATE + ENTER
  nodeEnter.merge(node)
    .transition().duration(400)
    .attr("transform", d => `translate(${d.y},${d.x})`);

  // LINKS
  const link = g.selectAll(".link")
    .data(links, d => d.target.id);

  link.enter().insert("path","g")
    .attr("class","link")
    .merge(link)
    .transition().duration(400)
    .attr("d", d => diagonal(d.source,d.target));

  nodes.forEach(d => { d.x0=d.x; d.y0=d.y; });
}

function diagonal(s,d){
  return `M ${s.y} ${s.x}
          C ${(s.y+d.y)/2} ${s.x},
            ${(s.y+d.y)/2} ${d.x},
            ${d.y} ${d.x}`;
}

/* ---------- NODE CLICK ---------- */
function toggle(event, d){
  // 🔥 ALWAYS keep latest selected
  window.selectedNode = {
    personId: d.data.personId,
    name: d.data.name
  };

  // ✅ SAVE FOR ADD PAGE
  localStorage.setItem("selectedParent", d.data.personId);
  localStorage.setItem("selectedParentName", d.data.name);

  console.log("Saved parent:", d.data.personId, d.data.name);

  // highlight
  g.selectAll(".node").classed("search-match", false);
  d3.select(event.currentTarget).classed("search-match", true);

  // expand / collapse
  if(d.children){
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}

/* ---------- BUTTONS ---------- */
if(document.getElementById("collapseBtn")){
  document.getElementById("collapseBtn").onclick = () => {
    if(!root) return;
    root.children && root.children.forEach(collapse);
    update(root);
  };
}

if(document.getElementById("expandBtn")){
  document.getElementById("expandBtn").onclick = () => {
    if(!root) return;
    root.each(d=>{
      if(d._children){
        d.children = d._children;
        d._children = null;
      }
    });
    update(root);
  };
}

function getPersonGen(personId){
return fetch(API_URL + "?action=getTree&familyId=" + FAMILY_ID)
.then(r => r.json())
.then(res => {
if(res.status !== "OK") return 1;
const p = res.data.find(x => x.personId === personId);
return p ? Number(p.generation) : 1;
});
}

async function addPerson(){
  const name = document.getElementById("pname")?.value;
  const gender = document.getElementById("pgender")?.value;
  const dob = document.getElementById("pdob")?.value;
  const place = document.getElementById("pplace")?.value;
  const fatherId = document.getElementById("pfather")?.value;
  const spouseId = document.getElementById("pspouse")?.value || "";

  if(!name){
    alert("Enter name");
    return;
  }

  let gen = 1;
  if(fatherId){
    gen = await getPersonGen(fatherId) + 1;
  }

  fetch(
    API_URL +
      "?action=addPerson" +
      "&familyId=" + FAMILY_ID +
      "&name=" + encodeURIComponent(name) +
      "&gender=" + gender +
      "&dob=" + dob +
      "&place=" + encodeURIComponent(place) +
      "&fatherId=" + fatherId +
      "&spouseId=" + spouseId +
      "&generation=" + gen
  )
  .then(r => r.json())
  .then(res => {
    if(res.status === "OK"){
      alert("Added successfully!");
      localStorage.removeItem("selectedParent");
      localStorage.removeItem("selectedParentName");
      window.location.href = "index.html";
    } else {
      alert("Error adding person");
    }
  })
  .catch(err=>{
    console.error(err);
    alert("Network error");
  });
}


/* ---------- SEARCH ---------- */
if(searchBox){
  searchBox.addEventListener("input", function(){
    const q = this.value.toLowerCase().trim();
    if(!root || !q) return;

    let found = null;
    root.each(d=>{
      if(d.data.name.toLowerCase().includes(q)){
        found = d;
      }
    });

    if(found){
      expandPath(found);
      update(found);

      setTimeout(()=>{
        g.selectAll(".node").classed("search-match", false);
        g.selectAll(".node").each(function(d){
          if(d === found){
            d3.select(this).classed("search-match", true);
            centerNode(d);
          }
        });
      },300);
    }
  });
}

function centerNode(d){
  if(!svg || !g) return;
  const scale = 1;
  const x = width / 2 - d.y * scale;
  const y = 120 - d.x * scale;

  svg.transition().duration(400)
    .call(
      d3.zoom().transform,
      d3.zoomIdentity.translate(x, y).scale(scale)
    );
}

/* ---------- ADD BUTTON ---------- */
if(document.getElementById("addBtn")){
  document.getElementById("addBtn").addEventListener("click", addPerson);
}
window.selectedNode = selectedNode;

