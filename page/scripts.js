const canvas = document.querySelector("canvas");
const canwrap = document.querySelector(".canwrap");
const ctx = canvas.getContext("2d");
let screeninfo = [];

let totalw = 0;
let totalh = 0;
let div = 1;
let basetransform;
function resizecanvas() {
    console.log("update size");
    canvas.style.width = "5px";
    canvas.style.height = "5px";
    const canvasRect = canwrap.getBoundingClientRect();
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width = canvasRect.width;
    canvas.height = canvasRect.height;

    div = Math.max(totalw / (canvas.width - 40), totalh / (canvas.height - 40));
    ctx.lineWidth = div * 1.5;
    ctx.setTransform(
        1 / div,
        0,
        0,
        1 / div,
        canvas.width / 2,
        canvas.height / 2
    );
    basetransform = ctx.getTransform();
}
const observer = new ResizeObserver(resizecanvas);
observer.observe(document.body);
let x = 0;
let img = new Image();
let imgReady = false;
const imgTransform = { x: 0, y: 0, scale: 1, rotation: 0 };
function updateCanvas() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(basetransform);
    //draw image if selected
    if (img) {
        ctx.save();
        ctx.translate(imgTransform.x, imgTransform.y);
        ctx.scale(imgTransform.scale, imgTransform.scale);
        ctx.rotate(imgTransform.rotation);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
    }

    ctx.translate(-totalw / 2, -totalh / 2);
    screeninfo.forEach(screen => {
        ctx.strokeRect(screen.x, screen.y, screen.w, screen.h);
    });
    canvas.classList.remove(["hidden"]);
    document.querySelector(".loading").classList.add(["hidden"]);
    requestAnimationFrame(updateCanvas);
}
let isMouseDragg = false;
let isMouseRotate = false;
const dragOffset = { x: 0, y: 0 };
let rotateOffset = 0;
canvas.addEventListener("mousedown", e => {
    if (e.button == 0 && !isMouseRotate) {
        isMouseDragg = true;
        dragOffset.x = e.x;
        dragOffset.y = e.y;
    } else if (e.button == 2 && !isMouseDragg) {
        isMouseRotate = true;
        const cx = canvas.width / 2 + imgTransform.x / div + canvas.offsetLeft;
        const cy = canvas.height / 2 + imgTransform.y / div + canvas.offsetTop;
        rotateOffset = imgTransform.rotation - Math.atan2(e.y - cy, e.x - cx);
    }
});
canvas.addEventListener("mouseup", e => {
    if (e.button == 0) isMouseDragg = false;
    if (e.button == 2) isMouseRotate = false;
});
canvas.addEventListener("mousemove", e => {
    if (isMouseDragg) {
        const mult = e.shiftKey ? div / 5 : div;
        imgTransform.x += (e.x - dragOffset.x) * mult;
        imgTransform.y += (e.y - dragOffset.y) * mult;
        dragOffset.x = e.x;
        dragOffset.y = e.y;
    }
    if (isMouseRotate) {
        const cx = canvas.width / 2 + imgTransform.x / div + canvas.offsetLeft;
        const cy = canvas.height / 2 + imgTransform.y / div + canvas.offsetTop;
        const rot = Math.atan2(e.y - cy, e.x - cx);
        imgTransform.rotation = rot + rotateOffset;
    }
});
const maxScale = 10;
const minScale = 0.2;
canvas.addEventListener("wheel", e => {
    const mult = e.shiftKey ? 5000 : 1000;
    const scaleVal = imgTransform.scale * (1 - e.deltaY / mult);
    imgTransform.scale = Math.max(Math.min(scaleVal, maxScale), minScale);
});

(async () => {
    const data = await ipcRenderer.invoke("getScreendata");
    console.log(data);
    screeninfo = data.screeninfo;
    totalw = data.w;
    totalh = data.h;
    resizecanvas();
    updateCanvas();
    document.querySelector(".file button").disabled = false;
})();

async function getimg() {
    imgReady = false;
    const imgsrc = await ipcRenderer.invoke("getimg");
    if (imgsrc) {
        img.onload = () => (imgReady = true);
        img.src = imgsrc;
        document.querySelector(".filefield").innerHTML = imgsrc;
        document.querySelectorAll(".buttons button").forEach(button => {
            button.disabled = false;
        });
        //Reset image transform
        imgTransform.x = 0;
        imgTransform.y = 0;
        imgTransform.scale = 1;
    }
}

async function save() {
    const path = await ipcRenderer.invoke("save");
    const blobs = [];
    screeninfo.forEach(screen => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = screen.w;
        canvas.height = screen.h;
        ctx.translate(totalw / 2 - screen.x, totalh / 2 - screen.y);

        ctx.save();
        ctx.translate(imgTransform.x, imgTransform.y);
        ctx.scale(imgTransform.scale, imgTransform.scale);
        ctx.rotate(imgTransform.rotation);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
        const blob = new Promise(resolve =>
            canvas.toBlob(blob => resolve(blob), "image/png", 1)
        );
        blobs.push(blob);
    });
    const wallpapers = await Promise.all(blobs);
    for (let i = 0; i < wallpapers.length; i++) {
        const wallpaperbuffer = await wallpapers[i].arrayBuffer();
        saveimg(
            `${path.slice(0, path.length - 4)}_${i + 1}.png`,
            wallpaperbuffer
        );
    }
}

function rstPosition() {
    imgTransform.x = 0;
    imgTransform.y = 0;
}
function rstScale() {
    imgTransform.scale = 1;
}
function rstRotation() {
    imgTransform.rotation = 0;
}
