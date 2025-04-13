
import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Shuffle, FastForward } from 'lucide-react';

interface GameMove {
  id?: string;
  word: string;
  player: string;
  score: number;
  moveType?: 'place_tiles' | 'shuffle' | 'pass';
  created?: string;
}

interface WordHistoryTableProps {
  words: GameMove[];
}

const WordHistoryTable: React.FC<WordHistoryTableProps> = ({ words }) => {
  if (words.length === 0) {
    return (
      <Card className="bg-game-light/40 backdrop-blur-md border-game-accent-blue/30">
        <CardHeader>
          <CardTitle className="text-lg">Orðasaga</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            Engin orð spiluð enn
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-game-light/40 backdrop-blur-md border-game-accent-blue/30">
      <CardHeader>
        <CardTitle className="text-lg">Orðasaga</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Orð/Aðgerð</TableHead>
              <TableHead>Leikmaður</TableHead>
              <TableHead className="text-right">Stig</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {words.map((entry, index) => (
              <TableRow key={entry.id || index}>
                <TableCell>
                  {entry.moveType === 'shuffle' ? (
                    <Shuffle className="h-4 w-4 text-yellow-400" />
                  ) : entry.moveType === 'pass' ? (
                    <FastForward className="h-4 w-4 text-blue-400" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {entry.moveType === 'shuffle' ? 'Blöndun' : 
                   entry.moveType === 'pass' ? 'Umferð sleppt' : 
                   entry.word || 'Orð spilað'}
                </TableCell>
                <TableCell>{entry.player}</TableCell>
                <TableCell className="text-right">{entry.score}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default WordHistoryTable;
