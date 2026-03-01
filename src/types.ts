export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type GameStatus = 'playing' | 'won' | 'lost' | 'suit_picking';
export type Turn = 'player' | 'ai';

export interface GameState {
  deck: Card[];
  playerHand: Card[];
  aiHand: Card[];
  discardPile: Card[];
  currentTurn: Turn;
  status: GameStatus;
  currentSuit: Suit | null; // For when an 8 is played
  lastAction: string;
}
