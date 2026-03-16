function Node(data) {
    this.data = data;
    this.parent = null;
    this.children = [];
    this.line = [];
    this.x = 0;
    this.y = 0;
    this.width  = 193;
    this.height = 108;
    this.xSpacing = this.width / 1.5;
    this.padding = 12;
    this.border = 1;
    this.borderStyle = 'solid';
    this.borderColor = 'black';
    this.lineStyle = 'solid' ;
    this.lineWidth = 2;
    this.lineColor = 'black';
    this.isRoot = false;
    this.settingWidth = 18;
    this.settingHeight = 18;
    this.nameTextFontSize = 14;
    this.equipBtnHeight = 30;
    this.btnFontSize = 12;
    this.borderRadius = 0.8;
} 

Node.prototype.addChild = function (data) {
    const childNode = new Node(data);
    childNode.parent = this;
    this.children.push(childNode);
    return childNode;
}

Node.prototype.addChilds = function(datas) {
    const currentId = this.data.id;
    datas.forEach(data => {
        if (data.parentId === currentId) {
            const childNode = this.addChild(data);
            childNode.addChilds(datas);
        }
    });
}

Node.prototype.getChildrenIds = function () {
    const ids = [this.data.id];
    if (this.children && this.children.length > 0) {
        this.children.forEach(child => {
            ids.push(...child.getChildrenIds());
        });
    }
    return ids;
}

Node.prototype.addLine = function (line1, line2, line3){
    this.line = [line1, line2, line3]
}

Node.prototype.removeNodeEl = function(){
    const nodeEl = document.getElementById(this.data.id);
    if(nodeEl){
        nodeEl.remove();
    }
}

Node.prototype.removeNode = function() {
    if (this.parent) {
        const index = this.parent.children.indexOf(this);
        if (index > -1) {
            this.parent.children.splice(index, 1);
        }
    }
    this.data = null;
    this.parent = null;
    if (this.children) {
      this.children.forEach(child => {
          child.removeNode();
      });
  }
  this.children = null;
  
};

Node.prototype.removeLine= function () {
    if (this.line) {
        this.line.forEach(lineEl => {
            if(lineEl === null) return;
            lineEl.remove();
        });
        this.line = null;
    }
};

Node.prototype.setEmplacementType = function (){
    if(this.data.emplacementType === 1){
        this.data.main = true;
    }
    else if(this.data.emplacementType === 3){
        this.data.pv = true;
    }else if(this.data.emplacementType === 4){
        this.data.ess = true;
    }
    this.children.forEach(child => {
        child.setEmplacementType();
    });
}

Node.prototype.getSubtreeWidth = function () {
    if (this.children.length === 0 || this.data.pv) {
        this.subTreeWidth = this.width;
        return this.subTreeWidth;
    }
  
    const normalChildren = this.children.filter(child => !child.data.pv);
    let total = 0;
  
    normalChildren.forEach((child, index) => {
        total += child.getSubtreeWidth();
        if (index < normalChildren.length - 1) total += child.xSpacing;
    });
  
    this.subTreeWidth = Math.max(total, this.width);
    return this.subTreeWidth;
};
  
Node.prototype.addWidthForTopNodes = function (){
    let current = this;
    while(current.parent){
        //current.parent.subTreeWidth += current.width + current.xSpacing;
        current.parent.subTreeWidth += current.width;
        current = current.parent;
    }
}

Node.prototype.getAllNodesExceptSelfAndSubtree = function() {
    const result = [];

    let root = this;
    while (root.parent) {
        root = root.parent;
    }

    const self = this;

    function traverse(node) {
        if (!node) return;

        if (node === self || self.isDescendant(node)) return;

        if (node.data?.pv) return;

        result.push(node);

        if (node.children && node.children.length) {
            node.children.forEach(traverse);
        }
    }

    traverse(root);

    return result;
};

Node.prototype.isDescendant = function(node) {
    if (!this.children) return false;
    if (this.children.includes(node)) return true;

    return this.children.some(child => child.isDescendant(node));
};

Node.prototype.findNodeByIdForRoot = function(id) {
    let node = this;
    while (node.parent) {
        node = node.parent;
    }
    return node.findNodeById(id);
};

Node.prototype.findNodeById = function(id) {
    if (this.data.id === id) {
        return this;
    }
    if (this.children && this.children.length > 0) {
        for (let child of this.children) {
            const found = child.findNodeById(id);
            if (found) {
                return found;
            }
        }
    }
    return null;
};

Node.prototype.removeChild = function (child) {
    const index = this.children.indexOf(child);
    if (index > -1) {
        this.children.splice(index, 1);
    }
};


Node.prototype.createPlaceModal = function (type, drawer) {
    const isModify = type === 'modify';
    const modalWrapper = document.createElement('div');
    modalWrapper.id = 'placeModal';
    modalWrapper.className = 'modal fade mt-5';
  
    const title = isModify ? '설치 장소 수정' : '설치 장소 추가';
    const submitText = isModify ? '수정' : '등록';

    modalWrapper.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content" style="padding-top: 0;">
        <div class="modal-close">
            <a id="btnClosePlaceModal" style="border-bottom: none;">
              <img src="/static/images/modal_close.png" alt="" style="width:100%;" height="auto">
            </a>
        </div>
          <div class="modal-header">
            <h5 class="modal-title"><b>${title}</b></h5>
          </div>
          <div class="modal-body" style="display:flex; justify-content:center; margin-top: 2em;">
            <form id="placeForm">
              <input type="hidden" id="isRoot">
              <div class="mb-3 place-div">
                <label class="place-label" for="name">설치 장소</label>
                <input type="text" class="modal-input emplace-input" id="name" name="name" required>
              </div>
              <div id="emplacementType-section" class="mb-3 modal-radio-section place-div">
                <label class="place-label">설치유형</label>
                <div id="emplacementType" style="display:flex; gap: 1em;"></div>
              </div>
   
              <div class="mb-3 modal-radio-section place-div">
                <label class="place-label">디스플레이 여부</label>
                <input type="checkbox" id="isDisplay" name="isDisplay"  class="tree-check-radio" style="padding-left: 0.5em"checked>
              </div>
              
              <div id="capacity-section" class="mb-3 place-div" style="display: none;">
                <label class="place-label" for="installationCapacity">설치용량</label>
                <input type="text" pattern="[0-9]+(\\.[0-9]+)?" class="modal-input emplace-input" id="installationCapacity" name="installationCapacity">
              </div>
              
              <div id="volt-section" class="mb-3 place-div" style="display: none;">
                <label class="place-label" for="volt">전압</label>
                <input type="text" pattern="[0-9]+(\\.[0-9]+)?" class="modal-input emplace-input" id="volt" name="volt">
              </div>
              
              <div id="voltAmpere-section" class="mb-3 place-div" style="display: none;">
                <label class="place-label" for="voltAmpere">피상 전력</label>
                <input type="text" pattern="[0-9]+(\\.[0-9]+)?" class="modal-input emplace-input" id="voltAmpere" name="voltAmpere">
              </div>
            
              <div class="mb-3 modal-radio-section place-div">
              <label class="place-label">결선방식</label>
                <div id="wiringType" style="display:flex; gap: 1em;"></div>
              </div>
              
               <div id="parent-section" class="mb-3 modal-radio-section place-div" style="display:none;">
                <label id="prentModify-label"class="place-label">상위 장소 편집</label>
                <select id="parentModify" name="parentId"></select>
              </div>
              <div class="modal-footer">
                <button type="button" id="btnRemovePlaceModal" class="modal-btn modal-delete-btn">삭제</button>
                <button type="submit" class="modal-btn modal-submit-btn">${submitText}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  
    document.body.appendChild(modalWrapper);

    const emplacementRadiosWrapper = modalWrapper.querySelector('#emplacementType');
    emplacementTypes.forEach(t => {
        const id = 'emplacementType_' + t.value;

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.className = 'tree-check-radio';
        radio.classList.add('emplacementTypeRadios');
        radio.name = 'emplacementType';
        radio.value = t.value;
        radio.id = id;
        radio.required = true;

        const label = document.createElement('label');
        label.htmlFor = id;
        label.innerText = t.displayName;
        label.className = 'place-radio-label';

        emplacementRadiosWrapper.appendChild(radio);
        emplacementRadiosWrapper.appendChild(label);
    });

    if (isModify) {
        document.getElementById("parent-section").style.display = "flex";
        document.getElementById("prentModify-label").style.width = "9em";
        const options = this.getAllNodesExceptSelfAndSubtree();
        const selectEl = document.getElementById("parentModify");
        selectEl.innerHTML = "";

        options.forEach(n => {
            const option = document.createElement("option");
            option.value = n.data.id;
            option.textContent = n.data.name;

            if (this.parent === n) {
                option.selected = true;
                selectEl.prepend(option);
            } else {
                selectEl.appendChild(option);
            }
        });
    }

    const emplacementTypeRadios = document.querySelectorAll('.emplacementTypeRadios');
    const voltSection = document.getElementById('volt-section');
    const voltAmpereSection = document.getElementById('voltAmpere-section');
    const capacitySection = document.getElementById('capacity-section');

    emplacementTypeRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            const current = e.currentTarget;
            if(current.value === "3"){
                voltSection.style.display = 'none';
                voltAmpereSection.style.display = 'none';
                capacitySection.style.display = 'flex';
            }else{
                voltSection.style.display = 'flex';
                voltAmpereSection.style.display = 'flex';
                capacitySection.style.display = 'none';
            }
        })
    })

    if(!this.isRoot && this.data.pv && isModify){
        voltSection.style.display = 'none';
        voltAmpereSection.style.display = 'none';
        capacitySection.style.display = 'flex';
    }else{
        voltSection.style.display = 'flex';
        voltAmpereSection.style.display = 'flex';
        capacitySection.style.display = 'none';
    }

    const wiringRadiosWrapper = modalWrapper.querySelector('#wiringType');
    wiringTypes.forEach(t => {
        const id = 'wiringType_' + t.value;

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.className = 'tree-check-radio';
        radio.name = 'wiringType';
        radio.value = t.value;
        radio.id = id;
        radio.required = true;

        const label = document.createElement('label');
        label.htmlFor = id;
        label.innerText = t.displayName;
        label.className = 'place-radio-label';

        wiringRadiosWrapper.appendChild(radio);
        wiringRadiosWrapper.appendChild(label);
    });
  
    modalWrapper.querySelector('#btnClosePlaceModal').addEventListener('click', () => {
      modalWrapper.style.display = 'none';
      modalWrapper.remove();
    });

    const removeBtn = document.getElementById('btnRemovePlaceModal');
    removeBtn.style.display = isModify ? 'block' : 'none';

    removeBtn.addEventListener('click', async() =>{
        document.getElementById("loading").style.display = 'flex';
        document.body.style.overflow = 'hidden'
        const isDeleted = await this.requestDeletePlace(this.getChildrenIds());
        document.getElementById("loading").style.display = 'none';
        document.body.style.overflow = '';
        if(isDeleted && !this.isRoot){
          this.removeNodeEl();
          this.removeNode();
          this.removeLine();
          modalWrapper.remove();
          drawer.draw();   
        }else if(!isDeleted){
            modalWrapper.remove();
            drawer.draw();
        }else{
            {
                modalWrapper.remove();
                drawer.reset();
            }
        }
    })

    const form = modalWrapper.querySelector('#placeForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
      const formData = this.getPlaceFormData('placeForm');
      formData.emplacementType = parseInt(formData.emplacementType, 10);
      modalWrapper.style.display = 'none';
  
      if (isModify) {
        await this.modifyData(formData);
        drawer.draw();
      } else {
        if (this.isRoot && !this.data) {
          const data = {parent: null,parent_id: null, ...formData };
          this.data = data;
          document.getElementById("loading").style.display = 'flex';
          document.body.style.overflow = 'hidden'

          const newId= await this.requestAddPlace(data);

          document.getElementById("loading").style.display = 'none';
          document.body.style.overflow = '';
          if (newId) {
            this.data.id = newId;
            drawer.setRoot(this);
            drawer.draw();
            document.getElementById('addRootNodeBtn').style.display = 'none';
          } else {
            console.log('루트 노드 저장 실패');
          }
        } else if (this.data) {
          await this.addChildFromModal(formData);
          drawer.draw();
        }
      }
      modalWrapper.remove();
    });
    return modalWrapper;
  };

  Node.prototype.openPlaceModal = function (type, drawer) {
    const existingModal = document.getElementById('placeModal');
    if (existingModal) existingModal.remove();

    const modal = this.createPlaceModal(type, drawer);
    const form = modal.querySelector('#placeForm');

    if(this.isRoot && !this.data){
        form.querySelector('#emplacementType_3').disabled = true;
    }

    if (type === 'modify' && this.data) {
        form.querySelector('#name').value = this.data.name;
        form.querySelector('#volt').value = this.data.volt;
        form.querySelector('#voltAmpere').value = this.data.voltAmpere;
        form.querySelector('#installationCapacity').value = this.data.installationCapacity;
        form.querySelector('#isDisplay').checked = this.data.isDisplay;
        const emplacementTypeRadio = form.querySelector(`input[name="emplacementType"][value="${this.data.emplacementType}"]`);
        if (emplacementTypeRadio) emplacementTypeRadio.checked = true;

        const connectionRadio = form.querySelector(`input[name="wiringType"][value="${this.data.wiringType}"]`);
        if (connectionRadio) connectionRadio.checked = true;
        //TODO EmplacementType Radio 버튼 태양광 비활성화로 로직 바꿔야함
        if (this.data.emplacementType === 3) {
            form.querySelector('#emplacementType_1').disabled = true;
            form.querySelector('#emplacementType_2').disabled = true;
            form.querySelector('#emplacementType_4').disabled = true;
        } else if(this.data.emplacementType === 4) {
            form.querySelector('#emplacementType_1').disabled = true;
            form.querySelector('#emplacementType_2').disabled = true;
            form.querySelector('#emplacementType_3').disabled = true;
        }else{
            form.querySelector('#emplacementType_3').disabled = true;
            form.querySelector('#emplacementType_4').disabled = true;
        }
    }
    modal.style.display = 'block';
  };
  

Node.prototype.createEquipmentModal = function (drawer){
    const modalWrapper = document.createElement('div');
    modalWrapper.id = 'equipmentModal';
    modalWrapper.className = 'modal fade mt-5';
    modalWrapper.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content equip-modal-content" style="padding-top: 0;">
        <div class="modal-close">
            <a id="btnCloseEquipmentModal" style="border-bottom: none;">
              <img src="/static/images/modal_close.png" alt="" style="width:100%;" height="auto">
            </a>
        </div>
            <div class="modal-header">
                <h5 class="modal-title"><b>장치 추가</b></h5>
            </div>
            <div class="modal-body" style="display:flex; justify-content:center; margin-top: 2em;">
                <form id="equipmentForm">
                    <input type="hidden" id="isRoot">
                    <div class="mb-3 equip-div">
                        <label class="equip-label" for="placeName">설치 장소</label>
                        <input type="text" id="placeName" name="placeName" class="modal-input equip-input" readonly="readonly">
                    </div>

                    <div class="mb-3 equip-div">
                        <label class="equip-label" for="apparentPower">장치 유형</label>
                        <div class="modal-radio">
                          <div id="equipTypes" style="display:flex; gap: 1em;"></div>
                        </div>
                    </div>

                    <div class="mb-3 equip-div">
                        <label class="equip-label" for="alias">Alias</label>
                        <input type="text" id="alias" name="alias" class="modal-input equip-input" required>
                    </div>

                    <div class="mb-3 equip-div">
                        <label class="equip-label" for="mac">MAC</label>
                        <input type="text" id="mac" name="mac" class="modal-input equip-input" required>
                    </div>

                    <div class="mb-3 equip-div">
                        <label class="equip-label" for="dhcp">DHCP</label>
                        <input type="checkbox" id="dhcp" name="dhcp"  class="tree-check-radio">
                    </div>

                    <div class="mb-3 equip-div" style="display: flex; gap: 3px;">
                        <label class="equip-label" for="ip1">IP 주소</label>
                        <input type="text" id="ip1" name="ip1" class="modal-input four-input" required pattern="^\\d{1,3}$" title="숫자만으로 최소 1자리 최대 3자리를 입력해주세요.">
                        <input type="text" id="ip2" name="ip2" class="modal-input four-input" required pattern="^\\d{1,3}$" title="숫자만으로 최소 1자리 최대 3자리를 입력해주세요.">
                        <input type="text" id="ip3" name="ip3" class="modal-input four-input" required pattern="^\\d{1,3}$" title="숫자만으로 최소 1자리 최대 3자리를 입력해주세요.">
                        <input type="text" id="ip4" name="ip4" class="modal-input four-input" required pattern="^\\d{1,3}$" title="숫자만으로 최소 1자리 최대 3자리를 입력해주세요.">
                    </div>

                    <div class="mb-3 equip-div" style="display: flex; gap: 3px;">
                        <label class="equip-label" for="subnet1">서브넷 마스크</label>
                        <input type="text" id="subnet1" name="subnet1" class="modal-input four-input" required pattern="^\\d{1,3}$" title="숫자만으로 최소 1자리 최대 3자리를 입력해주세요.">
                        <input type="text" id="subnet2" name="subnet2" class="modal-input four-input" required pattern="^\\d{1,3}$" title="숫자만으로 최소 1자리 최대 3자리를 입력해주세요.">
                        <input type="text" id="subnet3" name="subnet3" class="modal-input four-input" required pattern="^\\d{1,3}$" title="숫자만으로 최소 1자리 최대 3자리를 입력해주세요.">
                        <input type="text" id="subnet4" name="subnet4" class="modal-input four-input" required pattern="^\\d{1,3}$" title="숫자만으로 최소 1자리 최대 3자리를 입력해주세요.">
                    </div>

                    <div class="mb-3 equip-div" style="display: flex; gap: 3px;">
                        <label class="equip-label" for="gateway1">게이트웨이</label>
                        <input type="text" id="gateway1" name="gateway1" class="modal-input four-input" required pattern="^\\d{1,3}$" title="숫자만으로 최소 1자리 최대 3자리를 입력해주세요.">
                        <input type="text" id="gateway2" name="gateway2" class="modal-input four-input" required pattern="^\\d{1,3}$" title="숫자만으로 최소 1자리 최대 3자리를 입력해주세요.">
                        <input type="text" id="gateway3" name="gateway3" class="modal-input four-input" required pattern="^\\d{1,3}$" title="숫자만으로 최소 1자리 최대 3자리를 입력해주세요.">
                        <input type="text" id="gateway4" name="gateway4" class="modal-input four-input" required pattern="^\\d{1,3}$" title="숫자만으로 최소 1자리 최대 3자리를 입력해주세요.">
                    </div>

                    <div class="mb-3 equip-div">
                        <label class="equip-label" for="port">Port</label>
                        <input type="text" id="port" name="port" class="modal-input equip-input" required pattern="^\\d{1,5}$" title="숫자만으로 최소 1자리 최대 5자리를 입력해주세요.">
                    </div>
                    
                     <div class="mb-3 equip-div">
                        <label class="equip-label" for="timeout">Timeout</label>
                        <input type="text" id="timeout" name="timeout" class="modal-input equip-input" required>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" id="btnDeleteEquipmentModal" class="modal-btn modal-delete-btn">삭제</button>
                        <button type="submit" id="btnSubmitEquipmentModal" class="modal-btn modal-submit-btn">등록</button>
                    </div>
               </form>
            </div>
        </div>
    </div>
    `;

    document.body.appendChild(modalWrapper);
    const equipTypeRadiosWrapper = modalWrapper.querySelector('#equipTypes');
    equipTypes.forEach(t => {
        const id = 'equipType_' + t.value;

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.className = 'tree-check-radio';
        radio.name = 'equipType';
        radio.value = t.displayName;
        radio.id = id;
        radio.required = true;

        const label = document.createElement('label');
        label.htmlFor = id;
        label.innerText = t.displayName;
        label.className = 'place-radio-label';

        equipTypeRadiosWrapper.appendChild(radio);
        equipTypeRadiosWrapper.appendChild(label);
    });

    const form = modalWrapper.querySelector('#equipmentForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = this.getEquipmentFormData('equipmentForm');
        modalWrapper.style.display = 'none';

        if (!this.data.equipment) {
            await this.addEquipment(formData);
        } else {
            await this.modifyEquipment(formData);
        }
        drawer.draw();
    });

    document.getElementById('btnDeleteEquipmentModal').addEventListener('click', async()=>{
      await this.deleteEquipment();
      modalWrapper.remove();
      drawer.draw();
    })

    modalWrapper.querySelector('#btnCloseEquipmentModal').addEventListener('click', () => {
      modalWrapper.style.display = 'none';
      modalWrapper.remove();
    });

    return modalWrapper;
}

Node.prototype.openEquipmentModal = function (drawer){
    const existingModal = document.getElementById('equipmentModal');
    if (existingModal) existingModal.remove();

    const modal = this.createEquipmentModal(drawer);
    const form = modal.querySelector('#equipmentForm');

    const submitBtn = document.getElementById('btnSubmitEquipmentModal');
    const deleteBtn = document.getElementById('btnDeleteEquipmentModal');
    if(!this.data.equipment || this.data.equipment == null){
        form.reset();
        form.querySelector('#placeName').value = this.data.name;
        submitBtn.textContent = '등록';
        deleteBtn.style.display = 'none';
        modal.querySelector('.modal-title').textContent = '장치 추가';
    }else{
        submitBtn.textContent = '수정';
        deleteBtn.style.display = 'block';
        modal.querySelector('.modal-title').textContent = '장치 수정';
        
        if(!this.data.equipment) return;

        const equip = this.data.equipment;
        form.querySelector('#placeName').value = this.data.name;
        form.querySelector('#alias').value = equip.result.initialSetting.alias || '';
        form.querySelector('#mac').value = equip.result.mac || '';
        form.querySelector('#port').value = equip.result.initialSetting.port || '';
        form.querySelector('#timeout').value = equip.result.initialSetting.timeout || '';

        form.querySelector('#dhcp').checked = !!equip.result.initialSetting.dhcp;

        const emplacementTypeRadio = form.querySelector(`input[name="equipType"][value="${equip.result.equipType}"]`);
        if (emplacementTypeRadio) emplacementTypeRadio.checked = true;

        if (equip.result.initialSetting.ip) {
            const [ip1, ip2, ip3, ip4] = equip.result.initialSetting.ip.split('.');
            form.querySelectorAll('input[name="ip1"]')[0].value = ip1 || '';
            form.querySelectorAll('input[name="ip2"]')[0].value = ip2 || '';
            form.querySelectorAll('input[name="ip3"]')[0].value = ip3 || '';
            form.querySelectorAll('input[name="ip4"]')[0].value = ip4 || '';
        }
          
        if (equip.result.initialSetting.subnet) {
            const [s1, s2, s3, s4] = equip.result.initialSetting.subnet.split('.');
            form.querySelectorAll('input[name="subnet1"]')[0].value = s1 || '';
            form.querySelectorAll('input[name="subnet2"]')[0].value = s2 || '';
            form.querySelectorAll('input[name="subnet3"]')[0].value = s3 || '';
            form.querySelectorAll('input[name="subnet4"]')[0].value = s4 || '';
        }
          
        if (equip.result.initialSetting.gateway) {
            const [g1, g2, g3, g4] = equip.result.initialSetting.gateway.split('.');
            form.querySelectorAll('input[name="gateway1"]')[0].value = g1 || '';
            form.querySelectorAll('input[name="gateway2"]')[0].value = g2 || '';
            form.querySelectorAll('input[name="gateway3"]')[0].value = g3 || '';
            form.querySelectorAll('input[name="gateway4"]')[0].value = g4 || '';
        }  
    }
    modal.style.display = 'block';
}

Node.prototype.modifyData = async function(data){
    const equipData = this.data.equipment;
    const newData = {
        id: this.data.id,
        equipment: equipData,
        ...data
    };
    document.getElementById("loading").style.display = 'flex';
    document.body.style.overflow = 'hidden'
    const isSaved = await this.requestModifyPlace(newData);

    if(isSaved){
        this.data = newData;
        this.parent.removeChild(this);
        const newParent = this.findNodeByIdForRoot(parseInt(data.parentId));
        if (newParent) {
            this.parent = newParent;
            newParent.children.push(this);
        }
    }
    document.getElementById("loading").style.display = 'none';
    document.body.style.overflow = '';
}

Node.prototype.addChildFromModal = async function(formData) {
    const data = {
        parent_id: this.data.id,
        ...formData
    };
    document.getElementById("loading").style.display = 'flex';
    document.body.style.overflow = 'hidden'
    const newId = await this.requestAddPlace(data);
    if(newId){
        data.id = newId;
        const child = this.addChild(data);
        child.setCss();
    }
    document.getElementById("loading").style.display = 'none';
    document.body.style.overflow = '';
};

Node.prototype.addEquipment = async function(formData){
    document.getElementById("loading").style.display = 'flex';
    document.body.style.overflow = 'hidden'
    const isSaved = await this.requestAddEquipment(formData);
    if(isSaved){
        this.data.equipment = formData
    }
    document.getElementById("loading").style.display = 'none';
    document.body.style.overflow = '';
}

Node.prototype.modifyEquipment = async function(formData){
    document.getElementById("loading").style.display = 'flex';
    document.body.style.overflow = 'hidden'
    const isSaved = await this.requestModifyEquipment(formData);
    if(isSaved){
        this.data.equipment = formData
    }
    document.getElementById("loading").style.display = 'none';
    document.body.style.overflow = '';
}

Node.prototype.deleteEquipment = async function(){
    document.getElementById("loading").style.display = 'flex';
    document.body.style.overflow = 'hidden'
  const isSaved = await this.requestDeleteEquipment()
  if(isSaved){
    this.data.equipment = null;
  }
    document.getElementById("loading").style.display = 'none';
    document.body.style.overflow = '';
}

Node.prototype.requestAddPlace = async function(data) {
    try {
      const response = await fetch(`/emplacement/add/${customerId}`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
        const responseData = await response.json();
        console.log(responseData);
        if(!responseData.status){
            this.createToast(false, responseData.message);
            return null;
        }else{
            this.createToast(true, responseData.message);
            return responseData.response;
        }
    } catch (error) {
      console.error('오류:', error);
    }
};

Node.prototype.requestModifyPlace = async function(data) {
  try {
    const response = await fetch('/emplacement/modify', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
      const responseData = await response.json();
      console.log(responseData);
      if(!responseData.status){
          this.createToast(false, responseData.message);
          return false;
      }else{
          this.createToast(true, responseData.message);
          return true;
      }
  } catch (error) {
    console.error('오류:', error);
  }
};

Node.prototype.requestDeletePlace = async function(emplacementIds){
  try {
      const body = {
          emplacementId: this.data.id,
          emplacementIds: emplacementIds
      };

      const response = await fetch('/emplacement/delete', {
      method: 'DELETE',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
      const responseData = await response.json();
      console.log(responseData);
      if(!responseData.status){
          this.createToast(false, responseData.message);
          return false;
      }else{
          this.createToast(true, responseData.message);
          return true;
      }
  } catch (error) {
    console.error('오류:', error);
  }
}

Node.prototype.requestAddEquipment = async function(data) {
  try {
      messageBox.value = '';
      messageBox.style.visibility = 'hidden';
      const uri = this.data.emplacementType === 3 ? '/equipment/pv/add' : '/equipment/add';
    const response = await fetch(uri, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
      const responseData = await response.json();
      console.log(responseData);
      if(responseData.status !== true){
          this.createToast(false, responseData.message);
          return false;
      }else{
          this.createToast(true, responseData.message);
          return true;
      }
  } catch (error) {
    console.error('오류:', error);
  }
};

Node.prototype.requestModifyEquipment = async function(data) {
    try {
        messageBox.value = '';
        messageBox.style.visibility = 'hidden';
        const uri = this.data.emplacementType === 3 ? '/equipment/pv/modify' : '/equipment/modify';
        const response = await fetch(uri, {
            method: 'PATCH',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        const responseData = await response.json();
        console.log(responseData);
        if(!responseData.status){
            this.createToast(false, responseData.message);
            return false;
        }else{
            this.createToast(true, responseData.message);
            return true;
        }
    } catch (error) {
        console.error('오류:', error);
    }
};

Node.prototype.requestDeleteEquipment = async function(){
    try {
        messageBox.value = '';
        messageBox.style.visibility = 'hidden';
        const uri = this.data.emplacementType === 3 ? '/equipment/pv/delete' : '/equipment/delete';
        const response = await fetch(uri, {
            method: 'DELETE',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(this.data.equipment.result.emplacementId)
        });
        const responseData = await response.json();
        console.log(responseData);
        if(!responseData.status){
            this.createToast(false, responseData.message);
            return false;
        }else{
            this.createToast(true, responseData.message);
            return true;
        }
    } catch (error) {
        console.error('오류:', error);
    }
}


Node.prototype.getPlaceFormData = function(modalId){
    const form = document.getElementById(modalId);
    const formDataObj = new FormData(form);
    const formData = {
        name: formDataObj.get('name'),
        volt: formDataObj.get('volt'),
        voltAmpere: formDataObj.get('voltAmpere'),
        installationCapacity: formDataObj.get('installationCapacity'),
        emplacementType: formDataObj.get('emplacementType'),
        wiringType: formDataObj.get('wiringType'),
        parentId: formDataObj.get('parentId'),
        isDisplay: form.querySelector('#isDisplay')?.checked || false,
    };
    return formData;
}

Node.prototype.getEquipmentFormData = function(modalId) {
    const form = document.getElementById(modalId);
    const formDataObj = new FormData(form);
    const data = {
        result : {
            id: this.data.equipment != null && this.data.equipment.id != null ? this.data.equipment.id : null,
            customerCode: customerCode,
            emplacementId: this.data.id,
            mac: formDataObj.get('mac'),
            equipType: formDataObj.get('equipType'),
            initialSetting : {
                alias: formDataObj.get('alias'),
                dhcp: form.querySelector('#dhcp')?.checked || false,
                ip: formDataObj.get('ip1') + '.' + formDataObj.get('ip2')+ '.' +
                    formDataObj.get('ip3') + '.' + formDataObj.get('ip4'),
                subnet:
                    formDataObj.get('subnet1') + '.' + formDataObj.get('subnet2') + '.' +
                    formDataObj.get('subnet3') + '.' + formDataObj.get('subnet4'),
                gateway :
                    formDataObj.get('gateway1') + '.' + formDataObj.get('gateway2') + '.' +
                    formDataObj.get('gateway3') + '.' + formDataObj.get('gateway4'),
                port: formDataObj.get('port'),
                timeout: formDataObj.get('timeout')
            }
        }
    };
    return data;
  }

  Node.prototype.setCss = function(){
    if(this.parent){
      this.width  = this.parent.width;
      this.height = this.parent.height;
      this.xSpacing = this.parent.xSpacing;
      this.padding = this.parent.padding;
      this.border = this.parent.border;
      this.borderStyle = this.parent.borderStyle;
      this.borderColor = this.parent.borderColor;
      this.lineStyle = this.parent.lineStyle ;
      this.lineWidth = this.parent.lineWidth;
      this.lineColor = this.parent.lineColor;
      this.isRoot = false;
      this.settingWidth = this.parent.settingWidth;
      this.settingHeight = this.parent.settingHeight;
      this.nameTextFontSize = this.parent.nameTextFontSize;
      this.equipBtnHeight = this.parent.equipBtnHeight;
      this.btnFontSize = this.parent.btnFontSize;
      this.borderRadius = this.parent.borderRadius;
    }
  }
Node.prototype.createToast = function(status, message){
    const color = status === true ? '#73c9ed' : '#c86e76';
    const toastContainer = document.getElementById("response-toast-container");

    const toast = document.createElement("div");
    toast.className = "toast emplacement-toast align-items-center text-bg-primary border-0";
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");
    toast.setAttribute("data-bs-autohide", "false");

    toast.style.backgroundColor = color;
    toast.style.borderRadius = '0.375rem';
    toast.style.marginTop = '5px';
    toast.style.textAlign = 'center';
    toast.innerHTML = `
        <div class="d-flex" style="justify-content: center">
            <div class="toast-body" style="font-size: 17px;">
                <strong>${message}</strong>
            </div>
        </div>
    `;

    toastContainer.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    setTimeout(() => {
        bsToast.hide();
    }, 5000);
}

let count = 0;
Node.prototype.countPv = function(){
    if (this.data.pv){
        count = count + 1;
    }
    this.children.forEach(child => {
        child.countPv();
    })
    return count;
}

  
  
  