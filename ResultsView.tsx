import React, { useState } from 'react';

interface ResultsViewProps {
  time: number;
  mistakes: number;
  onNewGame: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const ResultsView: React.FC<ResultsViewProps> = ({ time, mistakes, onNewGame }) => {
  const [activeIndex, setActiveIndex] = useState(1);
  
  // Mock statistics for display
  const averageTime = Math.floor(time * 1.4) + 15;
  const betterThanPercentage = Math.min(99, Math.floor(Math.random() * 20 + 75));

  const cards = [
    {
      id: 'streak',
      icon: '🔥',
      label: 'New streak',
      mainText: 'Game on!',
      subText: '3 day streak',
      bgGradient: 'from-orange-400/30 to-yellow-400/30',
      borderColor: 'border-yellow-200/50',
      iconBg: 'bg-yellow-100 text-yellow-600'
    },
    {
      id: 'time',
      icon: '⚡',
      label: '', // No label for main card in this design
      mainText: formatTime(time),
      subText: `Today's avg: ${formatTime(averageTime)}`,
      bgGradient: 'bg-[#FFF9EC]',
      borderColor: 'border-white',
      iconBg: 'bg-orange-100 text-orange-500',
      isMain: true
    },
    {
      id: 'smart',
      icon: '🧠',
      label: 'Smarter than',
      mainText: `${betterThanPercentage}%`,
      subText: 'of players',
      bgGradient: 'from-purple-400/30 to-indigo-400/30',
      borderColor: 'border-purple-200/50',
      iconBg: 'bg-purple-100 text-purple-600'
    }
  ];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleCopy = () => {
    const text = `I solved the 6x6 Sudoku in ${formatTime(time)}! Can you beat me?`;
    navigator.clipboard.writeText(text);
    alert('Result copied to clipboard!');
  };

  const handleShare = () => {
    const text = `I solved the 6x6 Sudoku in ${formatTime(time)}!`;
    if (navigator.share) {
      navigator.share({ title: '6x6 Sudoku Result', text }).catch(console.error);
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#FF5F1F] z-[100] flex flex-col items-center justify-center p-4 overflow-hidden font-sans text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500 to-[#FF5F1F] opacity-50 pointer-events-none" />
      
      {/* Top Icon */}
      <div className="relative mb-4 animate-bounce shrink-0">
        <span className="text-6xl filter drop-shadow-lg">🏁</span>
        <div className="absolute -top-2 -right-4 text-4xl animate-pulse">✨</div>
      </div>

      {/* Header */}
      <div className="text-center mb-6 relative z-10 shrink-0">
        <h2 className="text-orange-100 font-bold text-lg mb-1 tracking-wide uppercase opacity-90">Daily #267</h2>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight drop-shadow-sm">You're crushing it!</h1>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full max-w-[90vw] md:max-w-4xl h-80 md:h-96 flex items-center justify-center mb-8 perspective-1000">
        {cards.map((card, index) => {
          // Calculate position relative to active index
          let position = index - activeIndex;
          
          // Handle wrapping for infinite scroll illusion with 3 items
          if (position < -1) position += cards.length;
          if (position > 1) position -= cards.length;

          const isActive = position === 0;
          const isLeft = position === -1;
          const isRight = position === 1;
          
          // Determine styles based on position
          let transform = '';
          let opacity = 'opacity-0';
          let zIndex = 0;
          let pointerEvents = 'pointer-events-none';

          if (isActive) {
            transform = 'translateX(0) scale(1)';
            opacity = 'opacity-100';
            zIndex = 30;
            pointerEvents = 'pointer-events-auto';
          } else if (isLeft) {
            transform = 'translateX(-110%) scale(0.85) rotateY(10deg)';
            opacity = 'opacity-60 blur-[1px]';
            zIndex = 10;
          } else if (isRight) {
            transform = 'translateX(110%) scale(0.85) rotateY(-10deg)';
            opacity = 'opacity-60 blur-[1px]';
            zIndex = 10;
          }

          // Special styling for the "Main" card (center white one) vs others (glass)
          const isMainStyle = card.isMain;
          const cardClasses = isMainStyle 
            ? `bg-[#FFF9EC] text-slate-800 shadow-2xl rounded-[2.5rem]` 
            : `bg-gradient-to-br ${card.bgGradient} backdrop-blur-xl border ${card.borderColor} text-white shadow-xl rounded-3xl`;

          return (
            <div
              key={card.id}
              className={`absolute w-64 h-72 md:w-72 md:h-80 transition-all duration-500 ease-out flex flex-col items-center justify-center p-6 text-center select-none ${cardClasses} ${opacity}`}
              style={{ 
                transform, 
                zIndex, 
                left: '50%', 
                marginLeft: isMainStyle ? '-9rem' : '-8rem', // Center the card (width/2)
                width: isMainStyle ? '18rem' : '16rem',
                height: isMainStyle ? '20rem' : '18rem',
              }}
              onClick={() => {
                if (isLeft) handlePrev();
                if (isRight) handleNext();
              }}
            >
              {isMainStyle && (
                 <div className="absolute -top-20 -right-20 w-40 h-40 bg-white opacity-40 blur-3xl rounded-full pointer-events-none" />
              )}

              <div className={`w-20 h-20 ${card.iconBg} rounded-2xl mb-4 flex items-center justify-center shadow-lg text-4xl`}>
                {card.icon}
              </div>

              {card.label && (
                <div className={`font-bold text-xl mb-1 ${isMainStyle ? 'text-slate-800' : 'text-white'}`}>
                  {card.label}
                </div>
              )}

              <div className={`font-black ${isMainStyle ? 'text-6xl font-mono tracking-tighter mb-2' : 'text-3xl mb-1'}`}>
                {card.mainText}
              </div>

              <div className={`${isMainStyle ? 'text-slate-600 font-bold' : 'text-white/80 font-medium'} text-sm`}>
                {card.subText}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <div className="flex gap-4 mb-8 relative z-10 shrink-0">
         <button onClick={handlePrev} className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center text-white hover:bg-white/20 transition-colors active:scale-95">
            <i className="fa-solid fa-chevron-left"></i>
         </button>
         <button onClick={handleNext} className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center text-white hover:bg-white/20 transition-colors active:scale-95">
            <i className="fa-solid fa-chevron-right"></i>
         </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-8 md:gap-16 relative z-10 shrink-0">
        <ActionButton icon="pen-to-square" label="Post" onClick={handleShare} />
        <ActionButton icon="paper-plane" label="Send" onClick={handleShare} />
        <ActionButton icon="copy" label="Copy" onClick={handleCopy} />
        <ActionButton icon="rotate-right" label="New" onClick={onNewGame} />
      </div>

    </div>
  );
};

const ActionButton: React.FC<{ icon: string, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={onClick}>
    <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center text-[#FF5F1F] text-2xl shadow-lg group-hover:scale-110 group-active:scale-95 transition-all duration-200">
      <i className={`fa-solid fa-${icon}`}></i>
    </div>
    <span className="font-semibold text-sm opacity-90 group-hover:opacity-100">{label}</span>
  </div>
);
