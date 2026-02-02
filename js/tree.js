const API_URL = "https://script.google.com/macros/s/AKfycbytM7snXYUkPLqdkIb9z-CQkUyDVRoUx1ef7-r02duWq139BWq1xWgg8m11BMgEOgVB/exec";
const FAMILY_ID = "F001";

const svg = d3.select("#tree")
  .call(d3.zoom().scaleExtent([0.3,3]).on("zoom", e=>{
    g.attr("transform", e.transform);
  }));

const g = svg.append("g").attr("transform","translate(50,50)");
const treeLayout = d3.tree().nodeSize([80,180]);
let root,i=0;

fetch(`${API_URL}?action=getTree&familyId=${FAMILY_ID}`)
  .then(r=>r.json())
  .then(res=>{
    if(res.status==="OK"){
      buildTree(res.data);
    }
  });

function buildTree(rows){
  if(rows.length===0){
    alert("No members found. Add founder.");
    return;
  }
  const map={};
  rows.forEach(p=>map[p.personId]={...p,children:[]});
  rows.forEach(p=>{
    if(p.fatherId && map[p.fatherId]){
      map[p.fatherId].children.push(map[p.personId]);
    }
  });
  root = d3.hierarchy(map[rows[0].personId]);
  root.x0=300; root.y0=0;
  root.children?.forEach(collapse);
  update(root);
}

function collapse(d){
  if(d.children){
    d._children=d.children;
    d._children.forEach(collapse);
    d.children=null;
  }
}

function update(source){
  const treeData = treeLayout(root);
  const nodes = treeData.descendants();
  const links = treeData.links();
  nodes.forEach(d=>d.y=d.depth*180);

  const node = g.selectAll(".node").data(nodes,d=>d.id||(d.id=++i));

  const nodeEnter=node.enter().append("g")
    .attr("class","node")
    .attr("transform",d=>`translate(${source.y0},${source.x0})`)
    .on("click",toggle);

  nodeEnter.append("rect")
    .attr("width",100).attr("height",30)
    .attr("x",-50).attr("y",-15);

  nodeEnter.append("text")
    .attr("dy",".35em").attr("text-anchor","middle")
    .text(d=>d.data.name);

  nodeEnter.merge(node).transition().duration(400)
    .attr("transform",d=>`translate(${d.y},${d.x})`);

  g.selectAll(".link").data(links,d=>d.target.id)
    .enter().insert("path","g").attr("class","link")
    .merge(g.selectAll(".link"))
    .transition().duration(400)
    .attr("d",d=>diagonal(d.source,d.target));

  nodes.forEach(d=>{d.x0=d.x; d.y0=d.y;});
}

function diagonal(s,d){
  return `M ${s.y} ${s.x}
          C ${(s.y+d.y)/2} ${s.x},
            ${(s.y+d.y)/2} ${d.x},
            ${d.y} ${d.x}`;
}

function toggle(e,d){
  if(d.children){d._children=d.children; d.children=null;}
  else{d.children=d._children; d._children=null;}
  update(d);
}

document.getElementById("collapseBtn").onclick=()=>{
  root.children?.forEach(collapse);
  update(root);
};

document.getElementById("expandBtn").onclick=()=>{
  root.each(d=>{
    if(d._children){d.children=d._children; d._children=null;}
  });
  update(root);
};
