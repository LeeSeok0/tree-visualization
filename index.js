const customerId = document.getElementById('customerId').value;
const customerCode = document.getElementById('customerCode').value;
const messageBox = document.getElementById('messageBox');
const addRootBtn = document.getElementById('addRootNodeBtn');
addRootBtn.addEventListener('click', () => {
    const rootNode = new Node();
    rootNode.isRoot = true;
    rootNode.openPlaceModal('add', drawer);
});
const container = document.getElementById('container')
const drawer = new Drawer(container);

addRootBtn.disabled = true;
getData();

function getData() {
    fetch('/emplacement/data/' + customerId, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json"
        }
    }).then(async response =>{
        const responseData = await response.json();
        console.log(responseData);
        if (responseData.status) {
            parseData(responseData.response); // 파싱할 데이터 전달
            addRootBtn.disabled = false;
        } else {
            messageBox.style.visibility = 'visible';
            messageBox.value = responseData.message;
        }
    })
    .catch(error => {
        messageBox.style.visibility = 'visible';
        messageBox.value = error.message;
    });
}

function parseData(data) {
    if (Array.isArray(data) && data.length > 0) {
        addRootBtn.style.display = 'none';
        const rootData = data.find(d => d.parentId == null);
        const childData = data.filter(d => d.parentId != null);
        const rootNode = new Node(rootData);
        rootNode.isRoot = true;
        rootNode.addChilds(childData);
        drawer.setRoot(rootNode);
        drawer.draw();
    } else {
        addRootBtn.style.visibility = 'visible';
    }
}

container.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
            drawer.zoomIn(drawer.rootNode);
        } else if (e.deltaY > 0) {
            drawer.zoomOut(drawer.rootNode);
        }
        drawer.zoomDraw();
    }
}, { passive: false });

window.onload = function() {
    document.getElementById('sidebar').className = 'inactive';
}
let isMouseDown = false;
let startX;
let startY;
let scrollLeft;
let scrollTop;

container.addEventListener("mousedown", (e)=>{
    if(e.ctrlKey){
        e.preventDefault()
        isMouseDown = true;
        startX = e.pageX - container.offsetLeft;
        startY = e.pageY - container.offsetTop;
        scrollTop = container.scrollTop;
        scrollLeft = container.scrollLeft;
    }
})
container.addEventListener("mouseleave", () => {
    isMouseDown = false;
});

container.addEventListener("mouseup", () => {
    isMouseDown = false;
});

container.addEventListener("mousemove", (e) => {
    if (!isMouseDown) return;
    if(e.ctrlKey){
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const y = e.pageY - container.offsetTop;
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    }
});