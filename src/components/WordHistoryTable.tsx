
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

interface WordHistoryTableProps {
  words: Array<{
    word: string;
    player: string;
    score: number;
  }>;
}

const WordHistoryTable: React.FC<WordHistoryTableProps> = ({ words }) => {
  if (words.length === 0) {
    return (
      <Card className="bg-game-light/40 backdrop-blur-md border-game-accent-blue/30">
        <CardHeader>
          <CardTitle className="text-lg">Word History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            No words played yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-game-light/40 backdrop-blur-md border-game-accent-blue/30">
      <CardHeader>
        <CardTitle className="text-lg">Word History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Word</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {words.map((entry, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{entry.word}</TableCell>
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
