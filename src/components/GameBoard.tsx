
import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { BoardCell } from '@/utils/gameLogic';

interface GameBoardProps {
  board: BoardCell[][];
  onCellClick: (x: number, y: number) => void;
}

const Cell: React.FC<{
  cell: BoardCell;
  position: [number, number, number];
  onClick: () => void;
}> = ({ cell, position, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Determine cell color based on bonus - Traditional Scrabble colors
  let color = '#e8e4d7'; // default board color (cream/beige like traditional Scrabble)
  let label = '';
  
  switch (cell.bonus) {
    case 'dl':
      color = '#a6d4f0'; // light blue for double letter
      label = 'DL';
      break;
    case 'tl':
      color = '#3d9ad1'; // darker blue for triple letter
      label = 'TL';
      break;
    case 'dw':
      color = '#f9b9b7'; // pink for double word
      label = 'DW';
      break;
    case 'tw':
      color = '#e83f33'; // red for triple word
      label = 'TW';
      break;
    case 'star':
      color = '#f9b9b7'; // pink for center star (same as DW in traditional Scrabble)
      label = '★';
      break;
  }
  
  // Highlight effect for interactive cells
  const [hovered, setHovered] = React.useState(false);
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      receiveShadow
    >
      {/* Cell base */}
      <boxGeometry args={[0.95, 0.1, 0.95]} />
      <meshStandardMaterial 
        color={color as any} 
        metalness={0.1}
        roughness={0.8}
        emissive={hovered ? "#64FFDA" as any : "#000000" as any}
        emissiveIntensity={hovered ? 0.3 : 0}
      />
      
      {/* Cell border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(0.95, 0.1, 0.95)]} />
        <lineBasicMaterial color={"#192741" as any} linewidth={1} />
      </lineSegments>
      
      {cell.tile ? (
        // Tile with letter
        <group position={[0, 0.11, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[0.85, 0.12, 0.85]} />
            <meshStandardMaterial 
              color="#e2c088" 
              metalness={0.3} 
              roughness={0.2}
              // Add wood-like texture to tiles
              onBeforeCompile={(shader) => {
                shader.fragmentShader = shader.fragmentShader.replace(
                  'void main() {',
                  `
                  float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                  }
                  void main() {
                    // Add some wood-grain like noise
                  `
                );
              }}
            />
          </mesh>
          
          {/* Letter on tile */}
          <Text
            position={[0, 0.08, 0]}
            color="black"
            fontSize={0.45}
            font="/fonts/Inter-Bold.woff"
            anchorX="center"
            anchorY="middle"
          >
            {cell.tile.letter}
          </Text>
          
          {/* Point value */}
          <Text
            position={[0.26, 0.08, 0.26]}
            color="black"
            fontSize={0.2}
            font="/fonts/Inter-Medium.woff"
            anchorX="center"
            anchorY="middle"
          >
            {cell.tile.value}
          </Text>
        </group>
      ) : (
        cell.bonus !== 'none' && (
          <Text
            position={[0, 0.06, 0]}
            color="black"
            fontSize={0.2}
            font="/fonts/Inter-Medium.woff"
            anchorX="center"
            anchorY="middle"
          >
            {label}
          </Text>
        )
      )}
    </mesh>
  );
};

const Board: React.FC<GameBoardProps> = ({ board, onCellClick }) => {
  const gridSize = 15;
  const boardSize = gridSize * 1.0; // Total size of the board
  
  // Add subtle animation to the board
  const boardRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (boardRef.current) {
      const t = clock.getElapsedTime();
      boardRef.current.position.y = Math.sin(t * 0.3) * 0.03; // More subtle animation
    }
  });
  
  return (
    <group ref={boardRef}>
      {/* Board background */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[boardSize + 0.5, 0.2, boardSize + 0.5]} />
        <meshStandardMaterial color={"#0F1624" as any} />
      </mesh>
      
      {/* Board frame */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[boardSize + 0.8, 0.02, boardSize + 0.8]} />
        <meshStandardMaterial
          color={"#64FFDA" as any}
          emissive={"#64FFDA" as any}
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Grid lines */}
      {Array.from({ length: gridSize + 1 }).map((_, i) => (
        <React.Fragment key={`grid-${i}`}>
          {/* Horizontal grid line */}
          <mesh position={[0, 0.001, i - gridSize / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[boardSize, 0.01]} />
            <meshBasicMaterial color={"#333a44" as any} transparent opacity={0.3} />
          </mesh>
          
          {/* Vertical grid line */}
          <mesh position={[i - gridSize / 2, 0.001, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[boardSize, 0.01]} />
            <meshBasicMaterial color={"#333a44" as any} transparent opacity={0.3} />
          </mesh>
        </React.Fragment>
      ))}
      
      {/* Render the cells */}
      {board.map((row, y) =>
        row.map((cell, x) => (
          <Cell
            key={`${x}-${y}`}
            cell={cell}
            position={[
              x - gridSize / 2 + 0.5, // Center the board
              0,
              y - gridSize / 2 + 0.5,
            ]}
            onClick={() => onCellClick(x, y)}
          />
        ))
      )}
    </group>
  );
};

const GameBoardCanvas: React.FC<GameBoardProps> = (props) => {
  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 13, 13]} />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={10}
          maxDistance={20}
        />
        <ambientLight intensity={0.6} />
        <spotLight 
          position={[10, 15, 10]} 
          angle={0.3} 
          penumbra={1} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight
          position={[-10, 15, -10]}
          intensity={0.7}
          castShadow
        />
        <Board {...props} />
        <fog attach="fog" args={['#0F1624', 20, 35]} />
      </Canvas>
    </div>
  );
};

export default GameBoardCanvas;
