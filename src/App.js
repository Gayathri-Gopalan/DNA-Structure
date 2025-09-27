import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import './index.css';

// DNA base colors
const BASE_COLORS = {
  A: 0xFF6B35, // Orange-red
  T: 0xFF1493, // Deep pink
  G: 0x4169E1, // Royal blue
  C: 0x32CD32, // Lime green
  U: 0xFFC107  // Amber
};

// Base pairs with hydrogen bond counts
const BASE_PAIRS = {
  A: { complement: 'T', hBonds: 2, type: 'purine' },
  T: { complement: 'A', hBonds: 2, type: 'pyrimidine' },
  G: { complement: 'C', hBonds: 3, type: 'purine' },
  C: { complement: 'G', hBonds: 3, type: 'pyrimidine' },
  U: { complement: 'A', hBonds: 2, type: 'pyrimidine' }
};

// Game Mode Component
function GameMode({ dnaSequence, onExitGame }) {
  const [score, setScore] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState('');
  const [playerAnswer, setPlayerAnswer] = useState('');
  const [feedback, setFeedback] = useState('');

  const challenges = [
    { question: 'What is the complementary base for A?', answer: 'T', points: 10 },
    { question: 'What is the complementary base for G?', answer: 'C', points: 10 },
    { question: 'How many hydrogen bonds form between A and T?', answer: '2', points: 20 },
    { question: 'How many hydrogen bonds form between G and C?', answer: '3', points: 20 }
  ];

  const generateChallenge = () => {
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    setCurrentChallenge(challenge);
    setPlayerAnswer('');
    setFeedback('');
  };

  const checkAnswer = () => {
    const isCorrect = playerAnswer.toUpperCase() === currentChallenge.answer.toUpperCase();
    if (isCorrect) {
      setScore(score + currentChallenge.points);
      setFeedback(`Correct! +${currentChallenge.points} points`);
    } else {
      setFeedback(`Incorrect. The correct answer is: ${currentChallenge.answer}`);
    }
  };

  useEffect(() => {
    generateChallenge();
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-purple-300 mb-2">🎮 DNA Game Mode</h3>
        <div className="text-sm">Score: {score}</div>
      </div>

      <button onClick={onExitGame} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm w-full">
        Exit Game Mode
      </button>

      {currentChallenge && (
        <div className="bg-gray-800 p-4 rounded border border-purple-400">
          <h4 className="font-bold mb-2 text-purple-200">Challenge:</h4>
          <p className="text-sm mb-3">{currentChallenge.question}</p>
          
          <input
            type="text"
            value={playerAnswer}
            onChange={(e) => setPlayerAnswer(e.target.value)}
            placeholder="Enter your answer"
            className="bg-gray-700 text-white px-3 py-2 rounded w-full text-sm border border-gray-500 mb-2"
          />
          
          <div className="flex space-x-2 mb-2">
            <button onClick={checkAnswer} className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm flex-1">
              Submit Answer
            </button>
            <button onClick={generateChallenge} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm flex-1">
              Next Challenge
            </button>
          </div>

          {feedback && (
            <div className={`text-sm p-2 rounded ${feedback.includes('Correct') ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
              {feedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main Three.js Scene Component
function DNAScene({ dnaSequence, containerRef }) {
  const sceneRef = useRef();
  const rendererRef = useRef();
  const animationIdRef = useRef();
  const dnaMeshesRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 15);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.81);
    directionalLight1.position.set(10, 10, 10);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x8888ff, 0.6);
    directionalLight2.position.set(-10, -5, -10);
    scene.add(directionalLight2);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(0, 8, 5);
    scene.add(pointLight);

    // Mouse controls
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let rotationX = 0;
    let rotationY = 0;

    const onMouseDown = (event) => {
      mouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      mouseDown = false;
    };

    const onMouseMove = (event) => {
      if (!mouseDown) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onWheel = (event) => {
      camera.position.z += event.deltaY * 0.01;
      camera.position.z = Math.max(5, Math.min(30, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Smooth camera rotation
      rotationX += (targetRotationX - rotationX) * 0.05;
      rotationY += (targetRotationY - rotationY) * 0.05;
      
      const radius = camera.position.z;
      camera.position.x = Math.sin(rotationY) * radius;
      camera.position.z = Math.cos(rotationY) * radius;
      camera.position.y = Math.sin(rotationX) * radius * 0.5;
      
      camera.lookAt(scene.position);
      
      // Rotate DNA helix slowly
      dnaMeshesRef.current.forEach(mesh => {
        if (mesh && mesh.rotation) {
          mesh.rotation.y += 0.005;
        }
      });
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, []);

  // Update DNA structure
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing meshes
    dnaMeshesRef.current.forEach(mesh => {
      sceneRef.current.remove(mesh);
    });
    dnaMeshesRef.current = [];

    const scene = sceneRef.current;

    // Create text sprite for base labels
    const createTextSprite = (text, size) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 128;
      
      context.font = 'Bold 72px monospace';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = 'white';
      context.strokeStyle = 'black';
      context.lineWidth = 6;
      context.strokeText(text, 64, 64);
      context.fillStyle = 'white';
      context.fillText(text, 64, 64);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(size, size, 1);
      
      return sprite;
    };

    // Create DNA helix
    const createDNAHelix = (sequence) => {
      const group = new THREE.Group();
      const numBases = sequence.length;
      const helixRadius = 1.0;
      const helixHeight = numBases * 0.34;
      const angleStep = (2 * Math.PI) / 10.4;

      const backbone1Points = [];
      const backbone2Points = [];

      for (let i = 0; i < numBases; i++) {
        const angle = i * angleStep;
        const y = (i * helixHeight / numBases) - helixHeight / 2;
        
        const x1 = Math.cos(angle) * helixRadius;
        const z1 = Math.sin(angle) * helixRadius;
        const x2 = Math.cos(angle + Math.PI) * helixRadius;
        const z2 = Math.sin(angle + Math.PI) * helixRadius;

        backbone1Points.push(new THREE.Vector3(x1, y, z1));
        backbone2Points.push(new THREE.Vector3(x2, y, z2));

        const base1 = sequence[i];
        const base2 = BASE_PAIRS[base1]?.complement || 'N';

        // Create base pairs
        const baseLength = 0.8;
        const baseHeight = 0.08;
        const baseWidth = 0.16;

        // Base 1
        const base1Geometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseLength);
        const base1Material = new THREE.MeshStandardMaterial({ 
          color: BASE_COLORS[base1] || 0xcccccc,
          metalness: 0.0,
          roughness: 0.1
        });
        const base1Mesh = new THREE.Mesh(base1Geometry, base1Material);
        
        const base1X = x1 * 0.7;
        const base1Z = z1 * 0.7;
        base1Mesh.position.set(base1X, y, base1Z);
        base1Mesh.rotation.y = Math.atan2(-base1X, -base1Z);
        group.add(base1Mesh);

        // Base 2
        const base2Geometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseLength);
        const base2Material = new THREE.MeshStandardMaterial({ 
          color: BASE_COLORS[base2] || 0xcccccc,
          metalness:0.0,
          roughness: 0.1
        });
        const base2Mesh = new THREE.Mesh(base2Geometry, base2Material);
        
        const base2X = x2 * 0.7;
        const base2Z = z2 * 0.7;
        base2Mesh.position.set(base2X, y, base2Z);
        base2Mesh.rotation.y = Math.atan2(-base2X, -base2Z);
        group.add(base2Mesh);

        // Add labels on top of boxes
        const base1Label = createTextSprite(base1, 0.35);
        base1Label.position.set(base1X, y + baseHeight/2 + 0.1, base1Z);
        group.add(base1Label);

        const base2Label = createTextSprite(base2, 0.35);
        base2Label.position.set(base2X, y + baseHeight/2 + 0.1, base2Z);
        group.add(base2Label);

        // Hydrogen bonds
        const bondCount = BASE_PAIRS[base1]?.hBonds || 2;
        const inner1X = x1 * 0.25;
        const inner1Z = z1 * 0.25;
        const inner2X = x2 * 0.25;
        const inner2Z = z2 * 0.25;
        
        for (let j = 0; j < bondCount; j++) {
          const offset = (j - (bondCount - 1) / 2) * 0.04;
          
          const bondGeometry = new THREE.BufferGeometry();
          const positions = [];
          
          const segments = 6;
          for (let k = 0; k < segments; k += 2) {
            const t1 = k / segments;
            const t2 = (k + 1) / segments;
            
            const x1_seg = inner1X + (inner2X - inner1X) * t1;
            const y1_seg = y + offset;
            const z1_seg = inner1Z + (inner2Z - inner1Z) * t1;
            
            const x2_seg = inner1X + (inner2X - inner1X) * t2;
            const y2_seg = y + offset;
            const z2_seg = inner1Z + (inner2Z - inner1Z) * t2;
            
            positions.push(x1_seg, y1_seg, z1_seg, x2_seg, y2_seg, z2_seg);
          }
          
          bondGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          
          const bondMaterial = new THREE.LineBasicMaterial({ 
            color: 0x87CEEB,
            linewidth: 1,
            transparent: true,
            opacity: 0.8
          });
          
          const bond = new THREE.LineSegments(bondGeometry, bondMaterial);
          group.add(bond);
        }
      }

      // Create ribbon backbones
      const createBackbone = (points, color) => {
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, points.length * 2, 0.08, 8, false);
        const material = new THREE.MeshStandardMaterial({ 
          color: color,
          metalness: 0.2,
          roughness: 0.4
        });
        return new THREE.Mesh(geometry, material);
      };

      const backbone1 = createBackbone(backbone1Points, 0x8B4A9C);
      const backbone2 = createBackbone(backbone2Points, 0x8B4A9C);
      group.add(backbone1);
      group.add(backbone2);

      // Add 5' and 3' labels
      const addStrandLabels = (group, points1, points2) => {
        const createEndLabel = (text, position, color) => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = 80;
          canvas.height = 40;
          
          context.font = 'Bold 24px Arial';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillStyle = 'white';
          context.strokeStyle = 'black';
          context.lineWidth = 3;
          context.strokeText(text, 40, 20);
          context.fillStyle = color;
          context.fillText(text, 40, 20);
          
          const texture = new THREE.CanvasTexture(canvas);
          const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
          });
          const sprite = new THREE.Sprite(material);
          sprite.position.copy(position);
          sprite.scale.set(0.8, 0.4, 1);
          
          return sprite;
        };

        const topTip1 = points1[0].clone();
        const bottomTip1 = points1[points1.length-1].clone();
        const topTip2 = points2[0].clone();
        const bottomTip2 = points2[points2.length-1].clone();

        const topDirection1 = points1.length > 1 ? 
          topTip1.clone().sub(points1[1]).normalize().multiplyScalar(0.3) : 
          new THREE.Vector3(0, 0.3, 0);
        
        const bottomDirection1 = points1.length > 1 ? 
          bottomTip1.clone().sub(points1[points1.length-2]).normalize().multiplyScalar(0.3) : 
          new THREE.Vector3(0, -0.3, 0);
        
        const topDirection2 = points2.length > 1 ? 
          topTip2.clone().sub(points2[1]).normalize().multiplyScalar(0.3) : 
          new THREE.Vector3(0, 0.3, 0);
        
        const bottomDirection2 = points2.length > 1 ? 
          bottomTip2.clone().sub(points2[points2.length-2]).normalize().multiplyScalar(0.3) : 
          new THREE.Vector3(0, -0.3, 0);

        const label5_1 = createEndLabel("5'", topTip1.clone().add(topDirection1), '#FFD700');
        const label3_1 = createEndLabel("3'", bottomTip1.clone().add(bottomDirection1), '#32CD32');
        const label3_2 = createEndLabel("3'", topTip2.clone().add(topDirection2), '#32CD32');
        const label5_2 = createEndLabel("5'", bottomTip2.clone().add(bottomDirection2), '#FFD700');
        
        group.add(label5_1);
        group.add(label3_1);
        group.add(label3_2);
        group.add(label5_2);
      };

      addStrandLabels(group, backbone1Points, backbone2Points);

      return group;
    };

    const dnaHelix = createDNAHelix(dnaSequence);
    scene.add(dnaHelix);
    dnaMeshesRef.current.push(dnaHelix);

  }, [dnaSequence]);

  return null;
}

// Main Component
export default function DNASimulation() {
  const [dnaSequence, setDnaSequence] = useState('ATCGATCGATCGATCG');
  const [gameMode, setGameMode] = useState(false);
  const containerRef = useRef();

  const generateRandomSequence = () => {
    const bases = ['A', 'T', 'C', 'G'];
    const length = 16;
    const sequence = Array.from({ length }, () => bases[Math.floor(Math.random() * 4)]).join('');
    setDnaSequence(sequence);
  };

  const getComplementarySequence = (seq) => {
    return seq.split('').map(base => BASE_PAIRS[base]?.complement || 'N').join('');
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col">
      {/* Header */}
      <div className="bg-black/90 text-white p-4 text-center border-b border-gray-600">
        <h1 className="text-3xl font-bold text-cyan-300 mb-2">DNA Structure - Interactive Biology Simulation</h1>
        <div className="text-sm text-gray-300">Explore the DNA double helix structure and base pairing</div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Controls Panel */}
        <div className="w-80 bg-black/90 text-white p-4 border-r border-gray-600 overflow-y-auto">
          <div className="space-y-6">
            {gameMode ? (
              <GameMode 
                dnaSequence={dnaSequence}
                onExitGame={() => setGameMode(false)}
              />
            ) : (
              <>
                {/* DNA Sequence Input */}
                <div>
                  <h3 className="text-lg font-bold mb-3 text-cyan-300">DNA Sequence</h3>
                  <input
                    type="text"
                    value={dnaSequence}
                    onChange={(e) => setDnaSequence(e.target.value.toUpperCase().replace(/[^ATCG]/g, ''))}
                    placeholder="Enter DNA sequence (A,T,C,G)"
                    className="bg-gray-800 text-white px-3 py-2 rounded w-full text-sm border border-gray-600 focus:border-cyan-400 mb-2"
                  />
                  <button
                    onClick={generateRandomSequence}
                    className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm w-full mb-3 transition-colors"
                  >
                    Generate Random Sequence
                  </button>
                  
                  <div className="text-xs space-y-2">
                    <div>
                      <strong className="text-cyan-200">5' → 3' Strand:</strong>
                      <div className="font-mono bg-gray-800 p-2 rounded mt-1 break-all border border-gray-600">
                        {dnaSequence}
                      </div>
                    </div>
                    <div>
                      <strong className="text-pink-200">3' → 5' Strand:</strong>
                      <div className="font-mono bg-gray-800 p-2 rounded mt-1 break-all border border-gray-600">
                        {getComplementarySequence(dnaSequence)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Game Mode */}
                <div>
                  <h3 className="text-lg font-bold mb-3 text-cyan-300">Game Mode</h3>
                  <button
                    onClick={() => setGameMode(true)}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm w-full transition-colors"
                  >
                    🎮 Start Game Mode
                  </button>
                </div>

                {/* Base Colors Legend */}
                <div>
                  <h3 className="text-lg font-bold mb-3 text-cyan-300">Base Colors</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center"><span className="inline-block w-4 h-4 mr-2 rounded" style={{backgroundColor: '#FF6B35'}}></span>A (Adenine)</div>
                    <div className="flex items-center"><span className="inline-block w-4 h-4 mr-2 rounded" style={{backgroundColor: '#FF1493'}}></span>T (Thymine)</div>
                    <div className="flex items-center"><span className="inline-block w-4 h-4 mr-2 rounded" style={{backgroundColor: '#4169E1'}}></span>G (Guanine)</div>
                    <div className="flex items-center"><span className="inline-block w-4 h-4 mr-2 rounded" style={{backgroundColor: '#32CD32'}}></span>C (Cytosine)</div>
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-gray-600 text-xs">
                    <div className="font-semibold text-yellow-200 mb-1">H-Bonds:</div>
                    <div className="flex items-center mb-1"><span className="inline-block w-3 h-1 bg-cyan-500 mr-2"></span>A-T: 2 bonds</div>
                    <div className="flex items-center mb-1"><span className="inline-block w-3 h-1 bg-cyan-500 mr-2"></span>G-C: 3 bonds</div>
                    <div className="mt-2 pt-1 border-t border-gray-700">
                      <div className="flex items-center"><span className="inline-block w-4 h-4 mr-2 rounded" style={{backgroundColor: '#8B4A9C'}}></span>Backbone</div>
                    </div>
                  </div>
                </div>

                {/* Controls Help */}
                <div>
                  <h3 className="text-lg font-bold mb-3 text-cyan-300">Controls</h3>
                  <div className="text-xs space-y-1">
                    <div>• Mouse drag: Rotate view</div>
                    <div>• Scroll: Zoom in/out</div>
                    <div>• Interactive 3D navigation</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3D Visualization Area */}
        <div className="flex-1 relative">
          <div ref={containerRef} className="w-full h-full" />
          
          <DNAScene 
            dnaSequence={dnaSequence}
            containerRef={containerRef}
          />
        </div>
      </div>

      {/* Bottom Information Panel */}
      <div className="bg-black/90 text-white p-4 border-t border-gray-600">
        <div className="max-w-6xl mx-auto">
          <h4 className="font-bold mb-2 text-cyan-300 text-lg">DNA Double Helix Structure</h4>
          <p className="mb-3 text-gray-200 text-sm">
            The DNA double helix consists of two antiparallel strands with sugar-phosphate backbones on the outside 
            and nitrogenous bases forming complementary pairs on the inside. A-T pairs form 2 hydrogen bonds, 
            while G-C pairs form 3 hydrogen bonds, making G-C pairs more stable.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="text-gray-300">• Antiparallel strands (5'→3' and 3'→5')</div>
            <div className="text-gray-300">• Sugar-phosphate backbone</div>
            <div className="text-gray-300">• Major and minor grooves</div>
            <div className="text-gray-300">• 3.4 Angstroms between base pairs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
