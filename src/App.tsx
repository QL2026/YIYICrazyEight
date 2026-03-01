/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Info, 
  ChevronRight, 
  User, 
  Cpu,
  AlertCircle
} from 'lucide-react';
import { Card, GameStatus, Turn, Suit } from './types';
import { createDeck, getSuitSymbol, getSuitColor, getSuitName, SUITS } from './constants';

const CardCenterSymbols = ({ rank, suit }: { rank: string; suit: Suit }) => {
  const symbol = getSuitSymbol(suit);
  const color = getSuitColor(suit);

  if (['J', 'Q', 'K', 'A'].includes(rank)) {
    return (
      <div className={`text-4xl md:text-6xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${color} opacity-90`}>
        {symbol}
      </div>
    );
  }

  const count = parseInt(rank);
  
  return (
    <div className={`absolute inset-x-3 inset-y-6 md:inset-x-5 md:inset-y-8 flex flex-wrap items-center justify-center content-center gap-x-1 md:gap-x-2 gap-y-0.5 md:gap-y-1 ${color} opacity-80`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="text-base md:text-xl leading-none">
          {symbol}
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Turn>('player');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [currentSuit, setCurrentSuit] = useState<Suit | null>(null);
  const [lastAction, setLastAction] = useState<string>("游戏开始！轮到你了。");
  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [pendingEightCard, setPendingEightCard] = useState<Card | null>(null);

  // Initialize Game
  const initGame = useCallback(() => {
    const newDeck = createDeck();
    const pHand = newDeck.splice(0, 8);
    const aHand = newDeck.splice(0, 8);
    
    // Find a starting card that is not an 8
    let startIndex = 0;
    while (newDeck[startIndex].rank === '8') {
      startIndex++;
    }
    const startingCard = newDeck.splice(startIndex, 1)[0];

    setDeck(newDeck);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setDiscardPile([startingCard]);
    setCurrentTurn('player');
    setStatus('playing');
    setCurrentSuit(null);
    setLastAction("游戏开始！轮到你了。");
    setShowSuitPicker(false);
    setPendingEightCard(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const topCard = discardPile[discardPile.length - 1];
  const activeSuit = currentSuit || topCard?.suit;

  const isPlayable = (card: Card) => {
    if (card.rank === '8') return true;
    return card.suit === activeSuit || card.rank === topCard.rank;
  };

  const checkWin = (hand: Card[], turn: Turn) => {
    if (hand.length === 0) {
      setStatus(turn === 'player' ? 'won' : 'lost');
      return true;
    }
    return false;
  };

  const playCard = (card: Card, isPlayer: boolean) => {
    if (status !== 'playing') return;
    if (isPlayer && currentTurn !== 'player') return;
    if (!isPlayable(card)) return;

    if (isPlayer) {
      setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    } else {
      setAiHand(prev => prev.filter(c => c.id !== card.id));
    }

    setDiscardPile(prev => [...prev, card]);
    setCurrentSuit(null); // Reset suit override

    if (card.rank === '8') {
      if (isPlayer) {
        setPendingEightCard(card);
        setShowSuitPicker(true);
        setStatus('suit_picking');
      } else {
        // AI logic for picking suit
        const suitsInHand = aiHand.filter(c => c.id !== card.id).map(c => c.suit);
        const mostCommonSuit = suitsInHand.length > 0 
          ? suitsInHand.sort((a,b) => suitsInHand.filter(v => v===a).length - suitsInHand.filter(v => v===b).length).pop()!
          : SUITS[Math.floor(Math.random() * 4)];
        
        setCurrentSuit(mostCommonSuit);
        setLastAction(`AI 打出了 8 并选择了 ${getSuitName(mostCommonSuit)}！`);
        if (!checkWin(aiHand.filter(c => c.id !== card.id), 'ai')) {
          setCurrentTurn('player');
        }
      }
    } else {
      setLastAction(`${isPlayer ? '你' : 'AI'} 打出了 ${getSuitName(card.suit)} ${card.rank}`);
      const nextHand = isPlayer ? playerHand.filter(c => c.id !== card.id) : aiHand.filter(c => c.id !== card.id);
      if (!checkWin(nextHand, isPlayer ? 'player' : 'ai')) {
        setCurrentTurn(isPlayer ? 'ai' : 'player');
      }
    }
  };

  const drawCard = (isPlayer: boolean) => {
    if (status !== 'playing') return;
    if (isPlayer && currentTurn !== 'player') return;
    if (deck.length === 0) {
      setLastAction("牌堆已空！跳过回合。");
      setCurrentTurn(isPlayer ? 'ai' : 'player');
      return;
    }

    const newDeck = [...deck];
    const card = newDeck.pop()!;
    setDeck(newDeck);

    if (isPlayer) {
      setPlayerHand(prev => [...prev, card]);
      setLastAction("你摸了一张牌。");
      // Check if the drawn card is playable, if not, turn ends? 
      // In some rules you keep drawing, but here we'll follow "draw one and move on if not playable"
      if (!isPlayable(card)) {
        setTimeout(() => setCurrentTurn('ai'), 1000);
      }
    } else {
      setAiHand(prev => [...prev, card]);
      setLastAction("AI 摸了一张牌。");
      if (!isPlayable(card)) {
        setTimeout(() => setCurrentTurn('player'), 1000);
      } else {
        // If AI drew a playable card, it should play it immediately in its turn logic
      }
    }
  };

  // AI Turn Logic
  useEffect(() => {
    if (currentTurn === 'ai' && status === 'playing') {
      const timer = setTimeout(() => {
        const playableCards = aiHand.filter(isPlayable);
        if (playableCards.length > 0) {
          // AI plays the first playable card (could be smarter)
          const cardToPlay = playableCards[0];
          playCard(cardToPlay, false);
        } else {
          if (deck.length > 0) {
            drawCard(false);
          } else {
            setLastAction("AI 无牌可出且牌堆已空。跳过回合。");
            setCurrentTurn('player');
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, aiHand, status, deck]);

  const handleSuitSelect = (suit: Suit) => {
    setCurrentSuit(suit);
    setShowSuitPicker(false);
    setStatus('playing');
    setLastAction(`你打出了 8 并选择了 ${getSuitName(suit)}！`);
    
    if (!checkWin(playerHand, 'player')) {
      setCurrentTurn('ai');
    }
  };

  return (
    <div className="flex flex-col h-screen felt-table overflow-hidden font-sans">
      {/* Header */}
      <header className="p-4 bg-black/20 backdrop-blur-sm border-b border-white/10 z-10">
        <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">8</span>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight">YIYI 疯狂 8 点</h1>
              <p className="text-xs text-emerald-200/70 uppercase tracking-widest">标准规则</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase text-emerald-300/50 font-bold">当前花色</span>
              <div className={`flex items-center gap-1 text-lg font-bold ${getSuitColor(activeSuit)}`}>
                {getSuitSymbol(activeSuit)} <span className="capitalize">{getSuitName(activeSuit)}</span>
              </div>
            </div>
            <button 
              onClick={initGame}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-emerald-100"
              title="重新开始"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 relative p-2 md:p-8 overflow-y-auto scrollbar-hide">
        <div className="max-w-5xl mx-auto min-h-full flex flex-col items-center justify-between py-4">
          {/* AI Hand */}
          <div className={`w-full flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-500 ${currentTurn === 'ai' ? 'bg-amber-500/5 shadow-[0_0_50px_rgba(245,158,11,0.1)]' : ''}`}>
            <div className="flex items-center gap-2 text-emerald-300/80 text-sm font-medium">
              <Cpu size={16} />
              <span>AI 对手 ({aiHand.length} 张牌)</span>
            </div>
            <div className="flex justify-center -space-x-12 md:-space-x-16 h-28 md:h-36">
              <AnimatePresence>
                {aiHand.map((card, index) => {
                  const rotation = (index - (aiHand.length - 1) / 2) * 2;
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ y: -50, opacity: 0, rotate: rotation }}
                      animate={{ y: 0, opacity: 1, rotate: rotation }}
                      exit={{ y: -100, opacity: 0 }}
                      className="w-16 md:w-24 h-24 md:h-32 bg-slate-800 rounded-lg border-2 border-slate-700 shadow-xl flex items-center justify-center relative overflow-hidden group"
                      style={{ zIndex: index }}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-50" />
                      <div className="w-full h-full border-4 border-slate-700/50 rounded-lg flex items-center justify-center relative">
                        {/* Pattern on card back */}
                        <div className="absolute inset-2 border border-slate-600/30 rounded flex flex-wrap gap-1 items-center justify-center opacity-20">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="w-1 h-1 bg-emerald-500/50 rounded-full" />
                          ))}
                        </div>
                        <div className="text-slate-500 font-serif font-bold text-xl md:text-3xl z-10">?</div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Center: Deck and Discard Pile */}
          <div className="flex items-center gap-8 md:gap-16 my-4 relative">
            {/* Active Suit Indicator Overlay */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 bg-black/30 backdrop-blur-md px-4 py-1 rounded-full border border-white/10">
              <span className="text-[10px] uppercase text-emerald-300/50 font-bold tracking-tighter">当前花色</span>
              <div className={`flex items-center gap-2 text-xl font-black ${getSuitColor(activeSuit)}`}>
                {getSuitSymbol(activeSuit)} <span className="text-sm font-bold">{getSuitName(activeSuit)}</span>
              </div>
            </div>

            {/* Draw Pile */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => drawCard(true)}
                disabled={currentTurn !== 'player' || status !== 'playing'}
                className={`relative w-20 md:w-28 h-28 md:h-40 bg-slate-800 rounded-xl border-2 border-slate-700 shadow-2xl transition-transform active:scale-95 group ${currentTurn === 'player' && status === 'playing' ? 'cursor-pointer hover:-translate-y-1' : 'cursor-not-allowed opacity-80'}`}
              >
                {deck.length > 0 && (
                  <>
                    <div className="absolute -top-1 -left-1 w-full h-full bg-slate-700 rounded-xl -z-10" />
                    <div className="absolute -top-2 -left-2 w-full h-full bg-slate-600 rounded-xl -z-20" />
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
                        <ChevronRight className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <span className="text-xs font-bold text-slate-400">{deck.length}</span>
                    </div>
                  </>
                )}
                {deck.length === 0 && (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs text-center p-2">
                    已空
                  </div>
                )}
              </button>
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-widest">摸牌</span>
            </div>

            {/* Discard Pile */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-20 md:w-28 h-28 md:h-40 bg-white rounded-xl border-2 border-slate-200 shadow-2xl flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={topCard?.id}
                    initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    className="w-full h-full p-2 flex flex-col justify-between relative"
                  >
                    {/* Top Left Corner */}
                    <div className={`flex flex-col items-center leading-none w-fit ${getSuitColor(topCard?.suit)}`}>
                      <span className="text-lg md:text-2xl font-serif font-bold">{topCard?.rank}</span>
                      <span className="text-sm md:text-lg">{getSuitSymbol(topCard?.suit)}</span>
                    </div>
                    
                    {/* Center Symbols */}
                    <CardCenterSymbols rank={topCard?.rank || ''} suit={topCard?.suit || 'hearts'} />
                    
                    {/* Bottom Right Corner */}
                    <div className={`flex flex-col items-center leading-none w-fit self-end rotate-180 ${getSuitColor(topCard?.suit)}`}>
                      <span className="text-lg md:text-2xl font-serif font-bold">{topCard?.rank}</span>
                      <span className="text-sm md:text-lg">{getSuitSymbol(topCard?.suit)}</span>
                    </div>
                    
                    {/* Subtle inner border */}
                    <div className="absolute inset-1 border border-slate-100 rounded-lg pointer-events-none" />
                  </motion.div>
                </AnimatePresence>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-widest">弃牌堆</span>
            </div>
          </div>

          {/* Player Hand */}
          <div className={`w-full flex flex-col items-center gap-2 md:gap-4 mt-auto p-4 rounded-2xl transition-all duration-500 ${currentTurn === 'player' ? 'bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.1)]' : ''}`}>
            <div className="flex items-center gap-2 text-emerald-300/80 text-xs md:text-sm font-medium">
              <User size={14} className="md:w-4 md:h-4" />
              <span>你的手牌 ({playerHand.length} 张牌)</span>
            </div>
            <div className="flex justify-center -space-x-10 md:-space-x-14 h-44 md:h-56 w-full max-w-4xl overflow-x-auto overflow-y-visible pb-10 px-12 scrollbar-hide">
              <AnimatePresence>
                {playerHand.map((card, index) => {
                  const playable = isPlayable(card) && currentTurn === 'player' && status === 'playing';
                  const rotation = (index - (playerHand.length - 1) / 2) * 3;
                  return (
                    <motion.button
                      key={card.id}
                      layout
                      initial={{ y: 50, opacity: 0, rotate: rotation }}
                      animate={{ 
                        y: playable ? -25 : 0, 
                        opacity: 1,
                        scale: playable ? 1.05 : 1,
                        rotate: rotation
                      }}
                      whileHover={playable ? { y: -50, scale: 1.15, zIndex: 100, rotate: 0 } : {}}
                      exit={{ y: 100, opacity: 0 }}
                      onClick={() => playCard(card, true)}
                      disabled={!playable}
                      className={`flex-shrink-0 w-20 md:w-32 h-28 md:h-44 bg-white rounded-xl border-2 shadow-2xl flex flex-col justify-between p-2 transition-all relative overflow-hidden ${playable ? 'border-emerald-400 cursor-pointer ring-4 ring-emerald-500/20' : 'border-slate-200 opacity-90 cursor-not-allowed'}`}
                      style={{ zIndex: index }}
                    >
                      {/* Top Left Corner */}
                      <div className={`flex flex-col items-center leading-none w-fit ${getSuitColor(card.suit)}`}>
                        <span className="text-lg md:text-2xl font-serif font-bold">{card.rank}</span>
                        <span className="text-sm md:text-lg">{getSuitSymbol(card.suit)}</span>
                      </div>
                      
                      {/* Center Symbols */}
                      <CardCenterSymbols rank={card.rank} suit={card.suit} />
                      
                      {/* Bottom Right Corner */}
                      <div className={`flex flex-col items-center leading-none w-fit self-end rotate-180 ${getSuitColor(card.suit)}`}>
                        <span className="text-lg md:text-2xl font-serif font-bold">{card.rank}</span>
                        <span className="text-sm md:text-lg">{getSuitSymbol(card.suit)}</span>
                      </div>
                      
                      {/* Subtle inner border */}
                      <div className="absolute inset-1 border border-slate-50 rounded-lg pointer-events-none" />
                      
                      {!playable && currentTurn === 'player' && (
                        <div className="absolute inset-0 bg-slate-900/10 rounded-xl pointer-events-none" />
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="p-4 bg-black/40 backdrop-blur-md border-t border-white/10 z-10">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full animate-pulse ${currentTurn === 'player' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-sm font-medium text-emerald-100">
              {currentTurn === 'player' ? "你的回合" : "AI 正在思考..."}
            </span>
          </div>
          <div className="flex-1 mx-8 text-center">
            <p className="text-xs md:text-sm text-emerald-200/60 italic truncate">
              {lastAction}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Info size={16} className="text-emerald-400/50" />
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {/* Suit Picker Modal */}
        {showSuitPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center"
            >
              <h2 className="text-2xl font-display font-bold mb-2">万能 8 点！</h2>
              <p className="text-slate-400 mb-8">为下一位玩家选择新的花色。</p>
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map(suit => (
                  <button
                    key={suit}
                    onClick={() => handleSuitSelect(suit)}
                    className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/50 transition-all group"
                  >
                    <span className={`text-4xl ${getSuitColor(suit)} group-hover:scale-125 transition-transform`}>
                      {getSuitSymbol(suit)}
                    </span>
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-300">{getSuitName(suit)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Game Over Modal */}
        {(status === 'won' || status === 'lost') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border-2 border-emerald-500/30 p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
              
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${status === 'won' ? 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'bg-slate-800'}`}>
                {status === 'won' ? <Trophy size={40} className="text-white" /> : <AlertCircle size={40} className="text-slate-400" />}
              </div>

              <h2 className="text-4xl font-display font-black mb-2 uppercase tracking-tight">
                {status === 'won' ? '胜利！' : '失败'}
              </h2>
              <p className="text-slate-400 mb-10">
                {status === 'won' ? '你先出完了所有牌。打得漂亮！' : 'AI 先出完了牌。下次好运！'}
              </p>

              <button
                onClick={initGame}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                再玩一次
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
