
# Orðaskák

![Orðaskák Logo](public/favicon.ico)

## Overview

Orðaskák (Word Chess) is an Icelandic word game inspired by classic word-building board games. It provides a fun and educational way to improve Icelandic vocabulary while enjoying a strategic multiplayer experience.

## Features

- **Icelandic-focused gameplay**: Built specifically for the Icelandic language, complete with special characters and appropriate letter distribution
- **Multiplayer support**: Play with friends in real-time
- **User accounts**: Track your progress, statistics, and game history
- **Responsive design**: Play on desktop or mobile devices
- **Interactive board**: Drag and drop tiles to form words on the game board

## Game Rules

1. Players take turns placing letter tiles on the board to form words
2. New words must connect to existing words on the board
3. Words are scored based on:
   - Letter values (common letters like A are worth less than rare letters like Þ)
   - Board bonuses (double letter, triple word, etc.)
4. The game ends when all tiles have been played or when all players pass consecutively
5. The player with the highest score wins

## Letter Distribution

Orðaskák uses a custom letter distribution tailored for Icelandic:

| Letter | Count | Value |   | Letter | Count | Value |
|--------|-------|-------|---|--------|-------|-------|
| A      | 10    | 1     |   | N      | 8     | 1     |
| Á      | 3     | 3     |   | O      | 2     | 4     |
| B      | 1     | 5     |   | Ó      | 2     | 4     |
| D      | 4     | 2     |   | P      | 1     | 8     |
| Ð      | 2     | 4     |   | R      | 6     | 1     |
| E      | 9     | 1     |   | S      | 5     | 1     |
| É      | 1     | 6     |   | T      | 5     | 1     |
| F      | 3     | 3     |   | U      | 3     | 3     |
| G      | 3     | 3     |   | Ú      | 1     | 6     |
| H      | 3     | 3     |   | V      | 2     | 4     |
| I      | 7     | 1     |   | X      | 1     | 10    |
| Í      | 2     | 4     |   | Y      | 2     | 4     |
| J      | 1     | 8     |   | Ý      | 1     | 6     |
| K      | 3     | 3     |   | Þ      | 1     | 8     |
| L      | 4     | 2     |   | Æ      | 1     | 8     |
| M      | 2     | 4     |   | Ö      | 1     | 8     |
|        |       |       |   | ?      | 2     | 0     |

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: React Router
- **State Management**: React hooks and context
- **Backend**: PocketBase
- **Data Fetching**: TanStack Query

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Setup

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd orðaskak

# Install dependencies
npm install
# or
bun install

# Start the development server
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:5173`.

### Project Structure

- `/src/components`: React components
  - `/game`: Game-specific components
  - `/ui`: Reusable UI components
- `/src/hooks`: Custom React hooks
- `/src/services`: API and service functions
- `/src/utils`: Utility functions and game logic
- `/src/contexts`: React contexts for state management
- `/src/pages`: Top-level page components

## Game Architecture

The game is built using a component-based architecture:

- `Game`: Main component that orchestrates the game flow
- `GameBoard`: Renders the game board and handles tile placement
- `PlayerRack`: Displays and manages the player's letter tiles
- `GameControls`: Provides buttons for game actions (play word, shuffle, etc.)
- `ScoreBoard`: Shows the current scores for all players
- `WordHistoryTable`: Displays a log of all words played in the game

Game state is managed through the `useGameState` hook, which handles:
- Player turns
- Tile selection and placement
- Word validation
- Score calculation
- Game completion

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The Icelandic Language Institute for language resources
- The open-source community for the amazing tools and libraries
