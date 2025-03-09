import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';

// Прозорец/background
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// Камера
const fov = 55;
const aspect = w / h;
const near = 0.1;
const far = 700;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(12, 10, -12);

const scene = new THREE.Scene();
const texture = new THREE.TextureLoader().load('./cityBackground.jpg');
scene.background = texture; // Фон с картина
const controls = new OrbitControls(camera, renderer.domElement);

//////////////////////////////////////////////////////////

const listener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();
const backgroundSong = new THREE.Audio(listener); // Аудио източник

// Зареждаме и възпроизвеждаме песента
audioLoader.load('./song.mp3', function (buffer) {
    backgroundSong.setBuffer(buffer);
    backgroundSong.setLoop(true); // За безкрайно възпроизвеждане
    backgroundSong.setVolume(0.1); // Регулираме силата на звука
    backgroundSong.play(); // Започваме възпроизвеждането
});

camera.add(listener); // Добавяме аудио слушателя към камерата

// Променлива за проверка дали песента е в пауза
let isPause = false;

// Избор на бутона от DOM
const pauseButton = document.getElementById('pauseButton');
// Проверка дали песента е на пауза и настройване на текста в началото
if (isPause) {
    pauseButton.textContent = 'Play'; // Текстът трябва да е 'Play', ако песента е в пауза
} else {
    pauseButton.textContent = 'Pause'; // Текстът трябва да е 'Pause', ако песента се възпроизвежда
}

// Обработчик за натискане на бутона
pauseButton.addEventListener('click', () => {
    if (isPause) {
        backgroundSong.play(); // Възпроизвеждаме песента
        pauseButton.textContent = 'Pause'; // Променяме текста на бутона на 'Pause'
    } else {
        backgroundSong.pause(); // Спираме песента
        pauseButton.textContent = 'Play'; // Променяме текста на бутона на 'Play'
    }
    isPause = !isPause; // Променяме състоянието (пауза/възпроизвеждане)
});


//////////////////////////////////////////////////////////

const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

let materials = [];

// Задаване на цветове
const initMaterials = () => {
  for (let i = 0; i <= 5; i++) { 
    let color;
    if (i === 0) color = 0xEF479F;      //PINK
    else if (i === 1) color = 0xFD5901; //ORANGE
    else if (i === 2) color = 0xFFD320; //YELLOW
    else if (i === 3) color = 0x06D6A0; //CYAN
    else if (i === 4) color = 0x118AB2; //BLUE
    else if (i === 5) color = 0x5B2B89; //PURPLE

    materials.push(
      new THREE.MeshPhongMaterial({
        color: color,
      })
    );
  }
};

// Масив от кубове 
// По x
function lineOfMeshes(w, g) {
    const cubes = [];
    for (let i = 0; i < w; i++) {
        const cube = new THREE.Mesh(geometry, materials); 
        cube.position.x = i * g;
        cube.targetRotation = { x: 0, y: 0 };
        cube.isSelected = false;

        // Create an outline or dark edge for each cube
        const edgeGeometry = new THREE.EdgesGeometry(geometry); // Create edges from geometry
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }); // Dark color for edges
        const edgeMesh = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        edgeMesh.scale.set(1.05, 1.05, 1.05); // Scale slightly to make edges visible around the cube
        cube.add(edgeMesh); // Add edges as a child of the cube

        cubes.push(cube);
    }
    return cubes;
}

// По x и z
function gridOfMeshes(w, g) {
    const cubes = [];
    for (let line = 0; line < w; line++) {
        const lineOfCubes = lineOfMeshes(w, g);
        lineOfCubes.forEach(cube => cube.position.z = line * g);
        cubes.push(lineOfCubes);
    }
    return cubes;
}

// По x, y и z
function cubeOfMeshes(w, g) {
    const cubes = [];
    for (let grid = 0; grid < w; grid++) {
        const gridOfCubes = gridOfMeshes(w, g);
        gridOfCubes.forEach(lineOfCubes => {
            lineOfCubes.forEach(cube => cube.position.y = grid * g);
        });
        cubes.push(gridOfCubes);
    }
    return cubes;
}

// Добавяне на 3D кубчетата в scene
let gridWidth = 3;
let gridGap = 1.55;
const cubes = cubeOfMeshes(gridWidth, gridGap);

cubes.forEach(grid => {
    grid.forEach(line => {
        line.forEach(cube => {
            scene.add(cube);
        });
    });
    
});

// Осветление
const light = new THREE.AmbientLight(0xAF9BB8, 0.85);
scene.add(light);

// Fixed rotation increment (90 degrees in radians)
const rotationIncrement = Math.PI / 2;

// Active selection for row, column, or layer
let selectedCubes = [];

// Function to select a column
function selectColumn(columnIndex) {
    selectedCubes = [];
    cubes.forEach(grid => {
        grid.forEach(line => {
            selectedCubes.push(line[columnIndex]);
        });
    });
}

// Function to select a layer (z-axis level)
function selectLayer(layerIndex) {
    selectedCubes = [];
    
    selectedCubes = cubes[layerIndex].flat();
    
}

// Update the target rotation based on the key pressed
function updateTargetRotation(keyCode) {
    if (selectedCubes.length > 0) {
        const isLayerSelected = selectedCubes.every(cube => cube.position.y === selectedCubes[0].position.y); // Check if all selected cubes are in the same layer
        const isColumnSelected = selectedCubes.every(cube => cube.position.x === selectedCubes[0].position.x); // Check if all selected cubes have the same x position (column)

        // Allow x-axis rotation only if a column is selected, not a layer
        if (!isLayerSelected) {
            if (keyCode === 'ArrowUp') {
                selectedCubes.forEach(cube => cube.targetRotation.x -= rotationIncrement);
            } else if (keyCode === 'ArrowDown') {
                selectedCubes.forEach(cube => cube.targetRotation.x += rotationIncrement);
            }
            
        }
        if (!isColumnSelected) {
            // Allow y-axis rotation for both columns and layers
            if (keyCode === 'ArrowRight') {
                selectedCubes.forEach(cube => cube.targetRotation.y += rotationIncrement);
            } else if (keyCode === 'ArrowLeft') {
                selectedCubes.forEach(cube => cube.targetRotation.y -= rotationIncrement);
            }
        }
        
    }
    
}


// Завъртане на кубчетата
function animateCubes() {
    selectedCubes.forEach(cube => {
        cube.rotation.x += (cube.targetRotation.x - cube.rotation.x) * 0.2;
        cube.rotation.y += (cube.targetRotation.y - cube.rotation.y) * 0.2;
    });
    
}

// Контролироне с клавиатура
window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyA': // Select the first column
            selectColumn(2);
            break;
        case 'KeyS': // Select the second column
            selectColumn(1);
            break;
        case 'KeyD': // Select the third column
            selectColumn(0);
            break;
        case 'KeyZ': // Select the first layer (z-axis)
            selectLayer(2);
            break;
        case 'KeyX': // Select the second layer
            selectLayer(1);
            break;
        case 'KeyC': // Select the third layer
            selectLayer(0);
            break;
        default:
            updateTargetRotation(event.code); // Rotate selected cubes on arrow key press
            break;
    }
});

// Рендериране на сцената
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    animateCubes(); // Update завъртане след всяко рендериране на сцената
    renderer.render(scene, camera);
}

initMaterials();
animate();

