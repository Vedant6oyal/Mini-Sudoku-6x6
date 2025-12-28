
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Board, Cell, Position, GameStatus } from './types';
import { GRID_SIZE, BLOCK_ROWS, BLOCK_COLS, isValid, isBoardComplete, solveSudoku, checkMoveCompletion } from './utils/sudokuLogic';
import { getGeminiHint, parseSudokuImage } from './services/geminiService';
import { ResultsView } from './ResultsView';
import { STATIC_PUZZLES } from './utils/puzzles';

// --- Audio System ---
const playSound = (type: 'select' | 'input' | 'error' | 'success' | 'win') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  const now = ctx.currentTime;

  if (type === 'select') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    gainNode.gain.setValueAtTime(0.05, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  } else if (type === 'input') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.15);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  } else if (type === 'error') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.linearRampToValueAtTime(100, now + 0.3);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  } else if (type === 'success') {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gn = ctx.createGain();
      osc.connect(gn);
      gn.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.05;
      gn.gain.setValueAtTime(0, start);
      gn.gain.linearRampToValueAtTime(0.1, start + 0.05);
      gn.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  } else if (type === 'win') {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; 
    notes.forEach((freq, i) => {
       const osc = ctx.createOscillator();
       const gn = ctx.createGain();
       osc.connect(gn);
       gn.connect(ctx.destination);
       osc.type = 'triangle';
       osc.frequency.value = freq;
       const start = now + i * 0.1;
       gn.gain.setValueAtTime(0, start);
       gn.gain.linearRampToValueAtTime(0.1, start + 0.1);
       gn.gain.exponentialRampToValueAtTime(0.001, start + 1.5);
       osc.start(start);
       osc.stop(start + 2.0);
    });
  }
};

const Fireworks: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: {x: number, y: number, vx: number, vy: number, color: string, alpha: number}[] = [];
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

    const createExplosion = (x: number, y: number) => {
      const particleCount = 40;
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 2 + Math.random() * 4;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1
        });
      }
    };

    let frame = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (frame % 25 === 0) {
         const x = Math.random() * canvas.width;
         const y = Math.random() * (canvas.height * 0.7);
         createExplosion(x, y);
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.alpha -= 0.02;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      frame++;
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
};

const App: React.FC = () => {
  const [board, setBoard] = useState<Board>([]);
  const [solution, setSolution] = useState<(number | null)[][] | null>(null);
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [status, setStatus] = useState<GameStatus>(GameStatus.PLAYING);
  const [timer, setTimer] = useState(0);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [history, setHistory] = useState<Board[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived state for completed cells (persistent green)
  const successCells = useMemo(() => {
    const success = new Set<string>();
    if (board.length === 0) return success;

    // Check Rows
    for (let r = 0; r < GRID_SIZE; r++) {
      const rowVals = board[r].map(c => c.value);
      if (rowVals.every(v => v !== null) && new Set(rowVals).size === GRID_SIZE) {
        if (board[r].every((c, idx) => isValid(board, r, idx, c.value!))) {
           for (let c = 0; c < GRID_SIZE; c++) success.add(`${r}-${c}`);
        }
      }
    }

    // Check Cols
    for (let c = 0; c < GRID_SIZE; c++) {
      const colVals = [];
      for(let r=0; r < GRID_SIZE; r++) colVals.push(board[r][c].value);
      if (colVals.every(v => v !== null) && new Set(colVals).size === GRID_SIZE) {
         if (colVals.every((v, idx) => isValid(board, idx, c, v!))) {
            for (let r = 0; r < GRID_SIZE; r++) success.add(`${r}-${c}`);
         }
      }
    }

    // Check Blocks
    for (let br = 0; br < GRID_SIZE / BLOCK_ROWS; br++) { // 3 block rows
      for (let bc = 0; bc < GRID_SIZE / BLOCK_COLS; bc++) { // 2 block cols
        const startRow = br * BLOCK_ROWS;
        const startCol = bc * BLOCK_COLS;
        const blockVals = [];
        for (let i = 0; i < BLOCK_ROWS; i++) {
          for (let j = 0; j < BLOCK_COLS; j++) {
            blockVals.push(board[startRow + i][startCol + j].value);
          }
        }
        if (blockVals.every(v => v !== null) && new Set(blockVals).size === GRID_SIZE) {
           let validBlock = true;
           for(let i=0; i<BLOCK_ROWS; i++) {
             for(let j=0; j<BLOCK_COLS; j++) {
               if(!isValid(board, startRow+i, startCol+j, board[startRow+i][startCol+j].value!)) validBlock = false;
             }
           }
           if(validBlock) {
             for (let i = 0; i < BLOCK_ROWS; i++) {
                for (let j = 0; j < BLOCK_COLS; j++) {
                  success.add(`${startRow + i}-${startCol + j}`);
                }
             }
           }
        }
      }
    }
    return success;
  }, [board]);

  const createBoardFromValues = useCallback((values: (number | null)[][]) => {
    const solvedGrid = solveSudoku(values);
    setSolution(solvedGrid);

    const newBoard: Board = values.map((row, r) =>
      row.map((val, c) => ({
        row: r,
        col: c,
        value: val,
        isInitial: val !== null,
        notes: new Set<number>(),
      }))
    );
    setBoard(newBoard);
    setSelectedCell(null);
    setStatus(GameStatus.PLAYING);
    setTimer(0);
    setHistory([]);
    setHint(null);
    setMistakes(0);
    setShowCelebration(false);
  }, []);

  const initGame = useCallback(() => {
    const randomPuzzle = STATIC_PUZZLES[Math.floor(Math.random() * STATIC_PUZZLES.length)];
    createBoardFromValues(randomPuzzle);
  }, [createBoardFromValues]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      timerRef.current = window.setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (board.length > 0 && isBoardComplete(board) && status !== GameStatus.WON) {
      setStatus(GameStatus.WON);
      playSound('win');
      setShowCelebration(true);
    }
  }, [board, status]);

  const handleCellClick = (row: number, col: number) => {
    playSound('select');
    setSelectedCell({ row, col });
  };

  const handleNumberInput = useCallback((num: number) => {
    if (!selectedCell || status !== GameStatus.PLAYING) return;
    const { row, col } = selectedCell;
    const cell = board[row][col];
    if (cell.isInitial) return;

    setHistory(prev => [...prev, board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })))]);
    const newBoard = board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
    
    if (isNotesMode) {
      playSound('select');
      if (newBoard[row][col].notes.has(num)) {
        newBoard[row][col].notes.delete(num);
      } else {
        newBoard[row][col].notes.add(num);
      }
      setBoard(newBoard);
    } else {
      if (newBoard[row][col].value === num) {
        newBoard[row][col].value = null;
        playSound('select');
      } else {
        const isErr = num !== null && !isValid(board, row, col, num);
        if (isErr) {
          setMistakes(prev => prev + 1);
          playSound('error');
        } else {
          playSound('input');
        }

        newBoard[row][col].value = num;
        newBoard[row][col].notes.clear();

        if (solution && checkMoveCompletion(newBoard, solution, row, col).isAnyCompleted) {
           playSound('success');
        }
      }
      setBoard(newBoard);
    }
  }, [selectedCell, status, board, isNotesMode, solution]);

  const handleErase = useCallback(() => {
    if (!selectedCell || status !== GameStatus.PLAYING) return;
    const { row, col } = selectedCell;
    if (board[row][col].isInitial) return;
    const newBoard = board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
    newBoard[row][col].value = null;
    newBoard[row][col].notes.clear();
    setBoard(newBoard);
    playSound('select');
  }, [selectedCell, status, board]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setBoard(last);
    setHistory(prev => prev.slice(0, -1));
    playSound('select');
  }, [history]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setHint("Analyzing your image... please wait.");
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const grid = await parseSudokuImage(base64Data, file.type);
        if (grid) {
          createBoardFromValues(grid);
          setHint("Board loaded successfully!");
          playSound('success');
        } else {
          setHint("Could not recognize a 6x6 Sudoku grid in that image.");
          playSound('error');
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setHint("An error occurred while uploading.");
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== GameStatus.PLAYING) return;
      if (e.key >= '1' && e.key <= '6') handleNumberInput(parseInt(e.key));
      else if (e.key === 'Backspace' || e.key === 'Delete') handleErase();
      else if (e.key.toLowerCase() === 'n') setIsNotesMode(prev => !prev);
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        setSelectedCell(prev => {
          if (!prev) return { row: 0, col: 0 };
          let { row, col } = prev;
          if (e.key === 'ArrowUp') row = Math.max(0, row - 1);
          if (e.key === 'ArrowDown') row = Math.min(GRID_SIZE - 1, row + 1);
          if (e.key === 'ArrowLeft') col = Math.max(0, col - 1);
          if (e.key === 'ArrowRight') col = Math.min(GRID_SIZE - 1, col + 1);
          playSound('select');
          return { row, col };
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleNumberInput, handleErase, handleUndo]);

  const handleHint = async () => {
    if (status !== GameStatus.PLAYING) return;
    setIsLoadingHint(true);
    setHint(null);
    playSound('select');
    const hintText = await getGeminiHint(board);
    setHint(hintText || "No hint found.");
    setIsLoadingHint(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCell = (r: number, c: number) => {
    const cell = board[r][c];
    const isSelected = selectedCell?.row === r && selectedCell?.col === c;
    const isRelated = selectedCell && (selectedCell.row === r || selectedCell.col === c);
    const hasConflict = cell.value !== null && !isValid(board, r, c, cell.value);
    const sameNumber = selectedCell && board[selectedCell.row][selectedCell.col].value !== null && board[selectedCell.row][selectedCell.col].value === cell.value;
    const isSuccess = successCells.has(`${r}-${c}`);

    let classes = "flex items-center justify-center cursor-pointer select-none aspect-square text-3xl md:text-4xl lg:text-5xl transition-colors duration-150 w-full h-full ";

    if (isSelected) classes += "bg-indigo-600 text-white font-bold ";
    else if (isSuccess) classes += "bg-emerald-300 text-emerald-900 font-bold ";
    else if (hasConflict) classes += "bg-red-50 text-red-500 font-bold ";
    else if (sameNumber) classes += "bg-indigo-200 text-indigo-900 font-bold ";
    else if (isRelated) classes += "bg-slate-50 font-medium ";
    else classes += "bg-white font-medium hover:bg-slate-50 ";

    if (!isSelected && !isSuccess && !hasConflict && !sameNumber) {
        if (cell.isInitial) classes += "text-slate-900 font-bold ";
        else classes += "text-indigo-600 font-semibold ";
    }

    return (
      <div 
        key={`${r}-${c}`}
        className={classes}
        onClick={() => handleCellClick(r, c)}
      >
        {cell.value !== null ? (
          cell.value
        ) : (
          <div className="flex flex-col gap-0.5 items-center justify-center h-full opacity-40 scale-75">
             <div className="flex gap-0.5">
                {cell.notes.has(1) && <div className="w-1 h-1 rounded-full bg-slate-800"/>}
                {cell.notes.has(2) && <div className="w-1 h-1 rounded-full bg-slate-800"/>}
             </div>
             <div className="flex gap-0.5">
                {cell.notes.has(3) && <div className="w-1 h-1 rounded-full bg-slate-800"/>}
                {cell.notes.has(4) && <div className="w-1 h-1 rounded-full bg-slate-800"/>}
             </div>
             <div className="flex gap-0.5">
                {cell.notes.has(5) && <div className="w-1 h-1 rounded-full bg-slate-800"/>}
                {cell.notes.has(6) && <div className="w-1 h-1 rounded-full bg-slate-800"/>}
             </div>
          </div>
        )}
      </div>
    );
  };

  const blocks = [];
  if (board.length > 0) {
    for (let br = 0; br < 3; br++) { 
      for (let bc = 0; bc < 2; bc++) { 
        const blockCells = [];
        const startRow = br * 2;
        const startCol = bc * 3;
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 3; c++) {
            blockCells.push(renderCell(startRow + r, startCol + c));
          }
        }
        blocks.push(
          <div key={`block-${br}-${bc}`} className="grid grid-cols-3 gap-[1px] bg-slate-300">
            {blockCells}
          </div>
        );
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f1f5f9] font-sans">
      {(status === GameStatus.WON || showCelebration) && <Fireworks />}
      {status === GameStatus.WON && (
        <ResultsView 
          time={timer} 
          mistakes={mistakes} 
          onNewGame={initGame} 
        />
      )}
      
      
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 px-4">
        <h1 className="text-2xl font-bold text-slate-700 tracking-tight">Sudoku <span className="text-indigo-500">6x6</span></h1>
        <div className="flex items-center gap-4">
           <div className="text-slate-400 font-mono font-medium">{formatTime(timer)}</div>
           <div className={`text-xs font-bold px-2 py-1 rounded-full ${mistakes > 0 ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
             {mistakes} ERR
           </div>
        </div>
      </div>

      <div className="w-full h-full flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
        
        <div className="flex-1 flex items-center justify-center w-full max-w-[min(95vw,60vh)] lg:max-w-[min(95vw,95vh)] aspect-square">
           <div className="bg-[#eff2fe] p-4 md:p-6 lg:p-8 rounded-[2rem] shadow-2xl shadow-indigo-100/50 w-full h-full flex items-center justify-center">
             
             <div className="grid grid-cols-2 grid-rows-3 gap-[4px] bg-slate-800 border-[4px] border-slate-800 w-full h-full max-h-full max-w-full rounded-lg overflow-hidden">
                {blocks}
             </div>
             
           </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs shrink-0 mb-8 lg:mb-0">
           
           <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <button
                  key={n}
                  onClick={() => handleNumberInput(n)}
                  className="w-full aspect-square rounded-xl bg-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all text-lg font-bold text-slate-700 hover:text-indigo-600 flex items-center justify-center"
                >
                  {n}
                </button>
              ))}
           </div>

           <div className="flex justify-between gap-2 bg-white p-3 rounded-2xl shadow-sm">
              <ToolButton icon="rotate-left" onClick={handleUndo} />
              <ToolButton icon="eraser" onClick={handleErase} />
              <ToolButton icon="pencil" active={isNotesMode} onClick={() => { playSound('select'); setIsNotesMode(!isNotesMode); }} />
              <ToolButton icon="wand-magic-sparkles" active={isLoadingHint} onClick={handleHint} />
           </div>

           <div className="flex flex-col gap-3">
              <button 
                onClick={initGame}
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg"
              >
                New Game
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-camera"></i>
                {isUploading ? 'Scanning...' : 'Upload Photo'}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
           </div>

           {hint && (
             <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-50 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-2 text-indigo-500 font-bold text-sm uppercase tracking-wide">
                  <i className="fa-solid fa-lightbulb"></i> Hint
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {hint}
                </p>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};

const ToolButton: React.FC<{ icon: string, active?: boolean, onClick: () => void }> = ({ icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
      active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
    }`}
  >
    <i className={`fa-solid fa-${icon}`}></i>
  </button>
);

export default App;
