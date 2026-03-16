function Drawer(container) {
  this.container = container;
  this.rootNode = null;
}

Drawer.prototype.setRoot = function(root){
  this.rootNode = root;
}

Drawer.prototype.draw = function() {
  this.container.innerHTML = "";
  this.container.style.position = "relative";
  this.rootNode.setEmplacementType();
  this.rootNode.getSubtreeWidth();
  this.setCenterPositionRoot();
  this.setNodes();
  //this.setRePositionRoot();
  this.renderNodes(this.rootNode);
  this.renderLines(this.rootNode);
  this.checkEquipStatus(this.rootNode);
  this.checkPVEquipStatus(this.rootNode);
  this.container.scrollLeft = (this.container.scrollWidth - this.container.clientWidth) / 2;
};

Drawer.prototype.zoomDraw = function() {
  this.container.innerHTML = "";
  this.container.style.position = "relative";
  this.rootNode.setEmplacementType();
  this.rootNode.getSubtreeWidth();
  this.setCenterPositionRoot();
  this.setNodes();
  //this.setRePositionRoot();
  this.renderNodes(this.rootNode);
  this.renderLines(this.rootNode);
  this.container.scrollLeft = (this.container.scrollWidth - this.container.clientWidth) / 2;
};

Drawer.prototype.reset = function(){
  this.container.innerHTML = "";
  this.container.style.position = "relative";
  document.getElementById('addRootNodeBtn').style.display = 'block';
}

Drawer.prototype.setCenterPositionRoot = function(count){
  this.rootNode.x = (this.container.offsetWidth / 2) - (this.rootNode.width / 2);
  this.rootNode.y = 50;
  if (this.rootNode.subTreeWidth > this.container.offsetWidth) {
    this.rootNode.x = this.rootNode.x + ((this.rootNode.subTreeWidth - this.container.offsetWidth) / 2);
  }
}


Drawer.prototype.setRePositionRoot = function(){
 /* if(this.rootNode.subTreeWidth < this.container.offsetWidth){*/
    this.rootNode.x = (this.container.scrollWidth / 2) - (this.rootNode.width / 2);
  /*}else{
    this.rootNode.x = (this.rootNode.subTreeWidth / 2) - (this.rootNode.width / 2);
  }*/
}

Drawer.prototype.setNodes = function () {
  const measure = (node) => {
    if (!node.children || node.children.length === 0) {
      const w = node.width || 0;
      node.leftExtent = w / 2;
      node.rightExtent = w / 2;
      node.subTreeWidth = w;
      return node.subTreeWidth;
    }

    const pvChildren = node.children.filter(c => !!c.data?.pv);
    const normalChildren = node.children.filter(c => !c.data?.pv);

    normalChildren.forEach(measure);
    pvChildren.forEach(measure);

    let normalRowTotal = 0;
    normalChildren.forEach((child, idx) => {
      const cw = child.leftExtent + child.rightExtent;
      normalRowTotal += cw;
      if (idx < normalChildren.length - 1) normalRowTotal += node.xSpacing;
    });

    const selfWidth = node.width;
    const baseHalf = Math.max(normalRowTotal, selfWidth) / 2;

    let pvColumnWidth = 0;
    pvChildren.forEach((child) => {
      const cw = child.leftExtent + child.rightExtent;
      pvColumnWidth = Math.max(pvColumnWidth, cw);
    });

    const pvExtraRight = (pvChildren.length > 0) ? (node.xSpacing + pvColumnWidth) : 0;

    node.leftExtent  = baseHalf;
    node.rightExtent = baseHalf + pvExtraRight;
    node.subTreeWidth = node.leftExtent + node.rightExtent;

    return node.subTreeWidth;
  };

  const layout = (node) => {
    if (!node.children || node.children.length === 0) return;

    const pvChildren = node.children.filter(c => !!c.data?.pv);
    const normalChildren = node.children.filter(c => !c.data?.pv);
    const hasNormal = normalChildren.length > 0;

    let normalRowTotal = 0;
    normalChildren.forEach((child, idx) => {
      const cw = child.leftExtent + child.rightExtent;
      normalRowTotal += cw;
      if (idx < normalChildren.length - 1) normalRowTotal += node.xSpacing;
    });

    const childY = node.y + node.height * 1.5;

    let currentX = node.x - normalRowTotal / 2;
    normalChildren.forEach((child) => {
      const l = child.leftExtent;
      const r = child.rightExtent;
      const cw = l + r;

      child.x = currentX + l;
      child.y = childY;
      layout(child);

      currentX += cw + node.xSpacing;
    });

    if (pvChildren.length > 0) {

      const baseRight = Math.max(normalRowTotal, node.width) / 2;
      const first = pvChildren[0];
      const firstW = first.leftExtent + first.rightExtent || first.width;

      first.addWidthForTopNodes(first);
      first.x = node.x + baseRight + node.xSpacing  + firstW / 2;
      first.y = node.y;
      layout(first);

      const stepFactor = hasNormal ? 0.9 : 0.85;
      const compressedStep = node.height * 1.5 * stepFactor;

      let pvY = first.y + compressedStep;
      const pvVMinY = childY ;
      if (pvY < pvVMinY) pvY = pvVMinY;

      pvChildren.slice(1).forEach((child) => {
        child.addWidthForTopNodes(child);
        child.x = first.x;
        child.y = pvY;
        layout(child);
        pvY += compressedStep;
      });
    }
  };

  measure(this.rootNode);
  layout(this.rootNode);
  this.normalizeIntoView(16);
};

Drawer.prototype.computeBounds = function () {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  const visit = (node) => {
    if (!node) return;

    const leftExtent  = (node.leftExtent  != null) ? node.leftExtent  : node.width / 2;
    const rightExtent = (node.rightExtent != null) ? node.rightExtent : node.width / 2;

    const left   = node.x - leftExtent;
    const right  = node.x + rightExtent;
    const top    = node.y;
    const bottom = node.y + node.height;

    if (left   < minX) minX = left;
    if (right  > maxX) maxX = right;
    if (top    < minY) minY = top;
    if (bottom > maxY) maxY = bottom;

    if (node.children && node.children.length) {
      node.children.forEach(visit);
    }
  };

  visit(this.rootNode);
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
};

Drawer.prototype.shiftTree = function (dx, dy) {
  const visit = (node) => {
    node.x += dx;
    node.y += dy;
    if (node.children && node.children.length) node.children.forEach(visit);
  };
  visit(this.rootNode);
};

Drawer.prototype.normalizeIntoView = function (margin = 16) {
  const b = this.computeBounds();

  if (b.minX < margin) {
    const dx = margin - b.minX;
    this.shiftTree(dx, 0);
  }
};

  Drawer.prototype.renderNodes = function(node) {
    this.createNodeEl(node);
    node.children.forEach(child => {
      this.renderNodes(child);
    });
  };

  Drawer.prototype.createNodeEl = function(node) {
    const nodeEl = document.createElement("div");
    nodeEl.id = node.data.id;
    nodeEl.className = "node";
    nodeEl.style.position = "absolute";
    nodeEl.style.left = node.x + "px";
    nodeEl.style.top = node.y + "px";
    nodeEl.style.width = node.width + "px";
    nodeEl.style.height = node.height + "px";
    nodeEl.style.borderWidth = node.border + "px";
    /*nodeEl.style.borderStyle = node.borderStyle;
    nodeEl.style.borderColor = node.borderColor;*/
    nodeEl.style.borderRadius = node.borderRadius + 'em';
    nodeEl.style.zIndex = "1";
    nodeEl.style.display = 'flex';
    nodeEl.style.flexDirection = 'column';
    nodeEl.style.padding = node.padding + 'px';
    nodeEl.style.border = 'none';
    nodeEl.style.boxShadow = '5px 5px 20px';
  
    if (node.isRoot) {
      nodeEl.setAttribute("tabindex", "-1");
    } 
    const topDiv = document.createElement('div');
    topDiv.style.display = 'flex';
    topDiv.style.gap = '3%';

    const imgDiv = document.createElement('div');
    imgDiv.style.display = 'flex';
    const img = document.createElement("img");

    if(node.data.main){
        img.src = '/static/images/main_emplacement.png'
    }
    else if(node.data.pv){
        img.src = '/static/images/solar_panel.png';
    }
    else if(node.data.ess){
        img.src = '/static/images/ess.png'
    }
    else{
      img.src = '/static/images/general_emplacement.png'
    }

    img.style.height = node.settingHeight + 'px';
    img.style.width = node.settingWidth + 'px';
    imgDiv.appendChild(img);
    topDiv.appendChild(imgDiv);

    const settingDiv = document.createElement('div');
    settingDiv.style.display = 'flex';
    settingDiv.style.width = '100%';
    settingDiv.style.justifyContent = 'flex-end';
   
    const settingImg = document.createElement("img");
    settingImg.src = '/static/images/setting.png'
    settingImg.style.height = node.settingHeight + 'px';
    settingImg.style.width = node.settingWidth + 'px';
    settingImg.style.cursor = 'pointer';

    settingImg.addEventListener('click', (e)=>{
      e.stopPropagation();
      node.openPlaceModal('modify', this);
    })
    settingImg.addEventListener('mouseover',(e)=>{
      settingImg.src = '/static/images/setting_hover.png'
    })
    settingImg.addEventListener('mouseout',(e)=>{
      settingImg.src = '/static/images/setting.png'
    })

    if(node.data.equipment){
      const statusDiv = document.createElement('div');
      statusDiv.style.display = 'flex';

      const statusImg = document.createElement("img");
      statusImg.src = '/static/images/loading.gif'
      statusImg.id = 'statusImg-' + node.data.id;
      statusImg.style.height = node.settingHeight + 'px';
      statusImg.style.width = node.settingWidth + 'px';

      statusDiv.appendChild(statusImg);
      topDiv.appendChild(statusDiv);
    }

    settingDiv.appendChild(settingImg);
    topDiv.appendChild(settingDiv);
    nodeEl.appendChild(topDiv);

    const nameText = document.createElement('span');
    nameText.textContent = node.data.name;
    nameText.style.fontSize = node.nameTextFontSize + 'px';
    nameText.style.color = 'black';
    nameText.style.fontWeight = 'bold';
    if(node.data.emplacementType === 1){
      nameText.className = 'isMain';
    }
    const placeNameDiv = document.createElement('div');
    placeNameDiv.appendChild(nameText);
    nodeEl.appendChild(nameText);

    const buttonDiv = document.createElement("div");
    buttonDiv.style.display = "flex";
    buttonDiv.style.gap = "2%";
    buttonDiv.style.marginTop = "10%";
    buttonDiv.style.justifyContent = "space-between";
  

    const nodeEquipBtnEl = document.createElement("button");
    nodeEquipBtnEl.style.flex = "1";
    nodeEquipBtnEl.style.height = node.equipBtnHeight + 'px';
    nodeEquipBtnEl.style.borderRadius = '5px';
    nodeEquipBtnEl.style.border = 'none';
    nodeEquipBtnEl.style.cursor = 'pointer'
    nodeEquipBtnEl.style.fontSize = node.btnFontSize + 'px';
    nodeEquipBtnEl.style.overflow = 'hidden';  
    nodeEquipBtnEl.style.whiteSpace = 'nowrap';
    nodeEquipBtnEl.textContent = node.data.equipment ? "장치 수정" : "장치 추가";
    nodeEquipBtnEl.classList.add('nodeEquipmentAddBtn');
    nodeEquipBtnEl.addEventListener("click", (e) => {
      e.stopPropagation();
      node.openEquipmentModal(this);
    });

    nodeEquipBtnEl.addEventListener('mouseover', (e)=>{
      nodeEquipBtnEl.style.backgroundColor = 'grey';
    })

    nodeEquipBtnEl.addEventListener('mouseout', (e)=>{
      nodeEquipBtnEl.style.backgroundColor = '#f0f0f0';
    })
    buttonDiv.appendChild(nodeEquipBtnEl);
  
    if (!node.data.pv) {
      const nodePlaceBtnEl = document.createElement("button");
      nodePlaceBtnEl.style.flex = "1";
      nodePlaceBtnEl.style.height = "auto";
      nodePlaceBtnEl.style.borderRadius = '5px';
      nodePlaceBtnEl.style.border = 'none';
      nodePlaceBtnEl.style.cursor = 'pointer'
      nodePlaceBtnEl.style.overflow = 'hidden';  
      nodePlaceBtnEl.style.fontSize = node.btnFontSize + 'px';
      nodePlaceBtnEl.style.whiteSpace = 'nowrap';
      nodePlaceBtnEl.textContent = "설치장소 추가";
      nodePlaceBtnEl.classList.add('nodeEmplacementAddBtn');
      nodePlaceBtnEl.addEventListener("click", (e) => {
        e.stopPropagation();
        node.openPlaceModal('add', this);
      });
      nodePlaceBtnEl.addEventListener('mouseover', (e)=>{
        nodePlaceBtnEl.style.backgroundColor = 'grey';
      })
  
      nodePlaceBtnEl.addEventListener('mouseout', (e)=>{
        nodePlaceBtnEl.style.backgroundColor = '#f0f0f0';
      })
      buttonDiv.appendChild(nodePlaceBtnEl);
    }
    nodeEl.appendChild(buttonDiv);
    nodeEl.addEventListener('click', (e) =>{
      console.log(node);
    })

    this.container.appendChild(nodeEl);
  };
  
  Drawer.prototype.renderLines = function(node) {
    if (node.parent) {
        this.createLineEl(node);
    }
    node.children.forEach(child => {
        this.renderLines(child);
    });
  };

Drawer.prototype.createLineEl = function(node) {
  const parent = node.parent;
  const parentCenterX = parent.x + parent.width / 2;
  const parentCenterY = parent.y + parent.height / 2;

  const nodeCenterX = node.x + node.width / 2;
  const nodeCenterY = node.y + node.height / 2;

  const isPV = !!node.data?.pv;

  const resetBorders = (el) => {
    el.style.borderLeft = 'none';
    el.style.borderTop = 'none';
    el.style.borderRight = 'none';
    el.style.borderBottom = 'none';
  };
  const setBaseStyle = (el) => {
    el.style.position = "absolute";
    el.style.backgroundColor = node.lineColor;
    el.style.borderStyle = node.lineStyle;
    el.style.borderColor = node.lineColor;
  };

  if (isPV) {
    const pvSiblings = (parent.children || []).filter(c => !!c.data?.pv);
    const firstPV = pvSiblings.length > 0 ? pvSiblings[0] : null;
    const isFirstPV = firstPV === node;
    const offsetPx = 150;

    let startX = parentCenterX;
    let startY = parentCenterY;

    if (!isFirstPV && firstPV) {
      const firstPVCenterX = firstPV.x + firstPV.width / 2;
      const firstPVCenterY = firstPV.y + firstPV.height / 2;
      startX = firstPVCenterX - offsetPx;

      const busY = (parentCenterY + firstPVCenterY) / 2;
      startY = Math.min(busY, nodeCenterY);

      const leftMargin = node.lineWidth * 2 + 4;
      const entryX = node.x;
      if (startX > entryX - leftMargin) startX = entryX - leftMargin;
    }

    if (isFirstPV) {
      startX = parentCenterX;
      startY = Math.min(parentCenterY, nodeCenterY);
    }

    const entryX = node.x;
    const line1 = document.createElement("div");
    setBaseStyle(line1);
    line1.style.left = `${startX}px`;
    line1.style.top = `${startY}px`;
    line1.style.width = `${node.lineWidth * 2}px`;
    line1.style.height = `${nodeCenterY - startY}px`;
    resetBorders(line1);
    this.container.appendChild(line1);

    const line2 = document.createElement("div");
    setBaseStyle(line2);
    line2.style.top = `${nodeCenterY}px`;
    line2.style.left = `${Math.min(startX, entryX)}px`;
    line2.style.width = `${Math.abs(entryX - startX)}px`;
    line2.style.height = `${node.lineWidth}px`;
    resetBorders(line2);
    this.container.appendChild(line2);

    node.addLine(line1, line2, null);
    return;
  }

  const line1 = document.createElement("div");
  setBaseStyle(line1);
  line1.style.left = parentCenterX + 'px';
  line1.style.top = parentCenterY + 'px';
  line1.style.width = node.lineWidth * 2 + 'px';
  line1.style.height = (nodeCenterY - parentCenterY) / 2 + 'px';
  resetBorders(line1);
  this.container.appendChild(line1);

  const midY = parentCenterY + (nodeCenterY - parentCenterY) / 2;

  const line2 = document.createElement("div");
  setBaseStyle(line2);
  line2.style.top = midY + 'px';
  line2.style.height = node.lineWidth + 'px';
  if (parentCenterX <= nodeCenterX) {
    line2.style.left = parentCenterX + 'px';
    line2.style.width = (nodeCenterX - parentCenterX) + 'px';
  } else {
    line2.style.left = nodeCenterX + 'px';
    line2.style.width = (parentCenterX - nodeCenterX) + 'px';
  }
  resetBorders(line2);
  this.container.appendChild(line2);

  const line3 = document.createElement("div");
  setBaseStyle(line3);
  line3.style.left = nodeCenterX + 'px';
  line3.style.top = midY + 'px';
  line3.style.width = node.lineWidth * 2 + 'px';
  line3.style.height = (nodeCenterY - midY) + 'px';
  resetBorders(line3);
  this.container.appendChild(line3);

  node.addLine(line1, line2, line3);
};

Drawer.prototype.zoomIn = function(node) {
  node.width *= 1.25;
  node.height *= 1.25;
  node.xSpacing *= 1.25;
  node.padding *= 1.25;
  node.lineWidth *= 1.25;

  node.settingHeight *= 1.25;
  node.settingWidth *= 1.25;
  node.nameTextFontSize *= 1.25;
  node.equipBtnHeight *= 1.25;
  node.btnFontSize *= 1.25;
  node.borderRadius *=1.25;

  node.children.forEach(child => {
    this.zoomIn(child);
  });
};

Drawer.prototype.zoomOut = function(node) {
  node.width *= 0.75;
  node.height *= 0.75;
  node.xSpacing *= 0.75;
  node.padding *= 0.75;
  node.lineWidth *= 0.75;

  node.settingHeight *= 0.75;
  node.settingWidth *= 0.75;
  node.nameTextFontSize *= 0.75;
  node.equipBtnHeight *= 0.75;
  node.btnFontSize *= 0.75;
  node.borderRadius *= 0.75;


  node.children.forEach(child => {
    this.zoomOut(child);
  });
};

Drawer.prototype.checkEquipStatus = async function (node) {
  const customerCode = document.getElementById('customerCode').value;

  if (!this.websocket || this.websocket.readyState === WebSocket.CLOSED) {
    const powerSocketUrl = await getPdaqsSocketUrl();
    const websocket = this.websocket = new WebSocket(powerSocketUrl + customerCode);

    websocket.onopen = () => {
      this.equipStatusInterval = setInterval(() => {
        sendWebSocketMessageEachNodes(this.websocket, node);
      }, 3000);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== 'INSPECT_STATUS_RESPONSE') {
        return;
      }
      handleWebSocketMessage(data);
    };

    websocket.onerror = function (error) {
      messageBox.style.visibility = 'visible';
      messageBox.value = '웹소켓 오류 발생.';
    };

    websocket.onclose = function () {
      messageBox.style.visibility = 'visible';
      messageBox.value = 'Power 웹소켓이 닫혔습니다.';
      clearInterval(this.equipStatusInterval);
    };
  }

  function sendWebSocketMessageEachNodes(websocket, node) {
    if (node.data.equipment && node.data.emplacementType !== 3) {
      const mac = node.data.equipment.result.mac;
      const emplacementId = node.data.id;
      sendWebSocketMessage(websocket, emplacementId, customerCode, mac);
    }

    node.children.forEach(child => {
      sendWebSocketMessageEachNodes(websocket, child);
    });
  }

  function sendWebSocketMessage(websocket, emplacementId, customerCode, macAddress) {
    const statusImg = document.getElementById('statusImg-' + emplacementId);
    if (statusImg) statusImg.setAttribute('src', '/static/images/loading.gif');
    const message = {
      customerCode: customerCode,
      type: "INSPECT_STATUS",
      message: JSON.stringify({
        emplacementId: emplacementId,
        mac: macAddress
      })
    };

    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify(message));
    } else {
      statusImg.setAttribute('src', '/static/images/error.png')
      messageBox.style.visibility = 'visible';
      messageBox.value = 'Power 웹소켓이 닫혀있습니다.';
    }
  }

  function handleWebSocketMessage(data) {
    try {
      const messageData = JSON.parse(data.message);
      const {emplacementId, connected, mac} = messageData;
      const imgElement = document.getElementById('statusImg-' + emplacementId);

      imgElement.setAttribute("src", connected ? "/static/images/connect.png" : "/static/images/disconnect.png");
      if (connected) {
        messageBox.style.visibility = 'none';
        messageBox.value = '';
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
    }
  }
};

Drawer.prototype.checkPVEquipStatus = async function (node) {
  const customerCode = document.getElementById('customerCode').value;
  if (!this.pvWebsocket || this.pvWebsocket.readyState === WebSocket.CLOSED) {
    const pvSocketUrl = await getPvdaqsSocketUrl();
    const pvWebsocket = this.pvWebsocket = new WebSocket(pvSocketUrl + customerCode);

    pvWebsocket.onopen = () => {
      this.pvEquipStatusInterval = setInterval(() => {
        sendPVWebSocketMessageEachNodes(this.pvWebsocket, node);
      }, 3000);
    };

    pvWebsocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== 'INSPECT_STATUS_RESPONSE') {
        return;
      }
      handlePVWebSocketMessage(data);
    };

    pvWebsocket.onerror = function (error) {
      messageBox.style.visibility = 'visible';
      messageBox.value = 'PV 웹소켓 오류 발생.';
    };

    pvWebsocket.onclose = function (event) {
      messageBox.style.visibility = 'visible';
      messageBox.value = 'PV 웹소켓이 닫혔습니다.';
      clearInterval(this.pvEquipStatusInterval);
    };
  }

  function sendPVWebSocketMessageEachNodes(pvWebsocket, node) {
    if (node.data.equipment && node.data.emplacementType === 3) {
      const mac = node.data.equipment.result.mac;
      const emplacementId = node.data.id;
      sendPVWebSocketMessage(pvWebsocket, emplacementId, customerCode, mac);
    }

    node.children.forEach(child => {
      sendPVWebSocketMessageEachNodes(pvWebsocket, child);
    });
  }

  function sendPVWebSocketMessage(websocket, emplacementId, customerCode, macAddress) {
    const statusImg = document.getElementById('statusImg-' + emplacementId);
    if (statusImg) statusImg.setAttribute('src', '/static/images/loading.gif');
    const message = {
      customerCode: customerCode,
      type: "INSPECT_STATUS",
      message: JSON.stringify({
        emplacementId: emplacementId,
        mac: macAddress
      })
    };

    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify(message));
    } else {
      statusImg.setAttribute('src', '/static/images/error.png')
      messageBox.style.visibility = 'visible';
      messageBox.value = 'PV 웹소켓이 닫혀있습니다.';
    }
  }

  function handlePVWebSocketMessage(data) {
    try {
      const messageData = JSON.parse(data.message);
      const {emplacementId, connected, mac} = messageData;
      const imgElement = document.getElementById('statusImg-' + emplacementId);

      imgElement.setAttribute("src", connected ? "/static/images/connect.png" : "/static/images/disconnect.png");

      if (connected) {
        messageBox.style.visibility = 'none';
        messageBox.value = '';
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
    }
  }
};
