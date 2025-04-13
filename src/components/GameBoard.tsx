
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
  
  // Determine cell color based on bonus
  let color = '#192741'; // default board color
  
  switch (cell.bonus) {
    case 'dl':
      color = '#1a3b6d'; // double letter
      break;
    case 'tl':
      color = '#156a6a'; // triple letter
      break;
    case 'dw':
      color = '#7b3e6a'; // double word
      break;
    case 'tw':
      color = '#9b2d3b'; // triple word
      break;
    case 'star':
      color = '#664d7c'; // center star
      break;
  }
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onClick}
      receiveShadow
    >
      <boxGeometry args={[0.9, 0.1, 0.9]} />
      <meshStandardMaterial color={color} />
      
      {cell.tile ? (
        <group position={[0, 0.11, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[0.8, 0.12, 0.8]} />
            <meshStandardMaterial color="#e2c088" metalness={0.3} roughness={0.2} />
          </mesh>
          <Text
            position={[0, 0.08, 0]}
            color="black"
            fontSize={0.4}
            font="/fonts/Inter-Bold.woff"
            anchorX="center"
            anchorY="middle"
          >
            {cell.tile.letter}
          </Text>
          <Text
            position={[0.25, 0.08, 0.25]}
            color="black"
            fontSize={0.15}
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
            color="white"
            fontSize={0.15}
            font="/fonts/Inter-Medium.woff"
            anchorX="center"
            anchorY="middle"
          >
            {cell.bonus.toUpperCase()}
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
      boardRef.current.position.y = Math.sin(t * 0.5) * 0.05;
    }
  });
  
  return (
    <group ref={boardRef}>
      {/* Board background */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[boardSize + 0.5, 0.2, boardSize + 0.5]} />
        <meshStandardMaterial color="#0F1624" />
      </mesh>
      
      {/* Border with glow effect */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[boardSize + 0.8, 0.02, boardSize + 0.8]} />
        <meshStandardMaterial
          color="#64FFDA"
          emissive="#64FFDA"
          emissiveIntensity={0.5}
        />
      </mesh>
      
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
        <PerspectiveCamera makeDefault position={[0, 12, 12]} />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={10}
          maxDistance={20}
        />
        <ambientLight intensity={0.5} />
        <spotLight 
          position={[10, 15, 10]} 
          angle={0.3} 
          penumbra={1} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight
          position={[-10, 15, -10]}
          intensity={0.5}
          castShadow
        />
        <Board {...props} />
        <fog attach="fog" args={['#0F1624', 15, 30]} />
      </Canvas>
    </div>
  );
};

export default GameBoardCanvas;
