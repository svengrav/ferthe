import clsx from "clsx";
import { useEffect, useRef } from "react";

interface Card {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
}

interface CardCanvasProps {
  children?: React.ReactNode;
  className?: string;
  cardCount?: number;
  maxSpeed?: number;
  connectionDistance?: number;
  cardWidth?: number;
  cardHeight?: number;
  cardBorder?: string;
  lineColor?: string;
}

export function CardCanvas({
  children,
  className,
  cardCount = 15,
  maxSpeed = 0.3,
  connectionDistance = 200,
  cardWidth = 40,
  cardHeight = 60,
  cardBorder = "#ddd",
  lineColor = "#fff",
}: CardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let cards: Card[] = [];
    let canvasWidth = 0;
    let canvasHeight = 0;

    const CARD_COLORS = [
      "#212840ff",
      // "#4ECDC4",
      // "#45B7D1",
      // "#FFA07A",
      // "#98D8C8",
      // "#F7DC6F",
      // "#BB8FCE",
      // "#85C1E2",
      // "#F8B739",
      // "#52B788",
    ];

    const CONFIG = {
      cardCount,
      maxSpeed,
      connectionDistance,
      cardWidth,
      cardHeight,
      cardBorder,
      lineColor,
    };

    const initCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvasWidth = rect.width;
      canvasHeight = rect.height;
      canvas.width = rect.width * globalThis.devicePixelRatio;
      canvas.height = rect.height * globalThis.devicePixelRatio;
      ctx.scale(globalThis.devicePixelRatio, globalThis.devicePixelRatio);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    const createCards = () => {
      cards = Array.from({ length: CONFIG.cardCount }, () => {
        const sizeVariation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
        return {
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * CONFIG.maxSpeed,
          vy: (Math.random() - 0.5) * CONFIG.maxSpeed,
          width: CONFIG.cardWidth * sizeVariation,
          height: CONFIG.cardHeight * sizeVariation,
          color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)],
        };
      });
    };

    const updateCards = () => {
      cards.forEach((card) => {
        card.x += card.vx;
        card.y += card.vy;

        if (card.x < 0 || card.x > canvasWidth) card.vx *= -1;
        if (card.y < 0 || card.y > canvasHeight) card.vy *= -1;

        card.x = Math.max(0, Math.min(canvasWidth, card.x));
        card.y = Math.max(0, Math.min(canvasHeight, card.y));
      });
    };

    const drawConnections = () => {
      cards.forEach((cardA, i) => {
        cards.slice(i + 1).forEach((cardB) => {
          const dx = cardB.x - cardA.x;
          const dy = cardB.y - cardA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < CONFIG.connectionDistance) {
            const opacity = 1 - distance / CONFIG.connectionDistance;
            ctx.strokeStyle = CONFIG.lineColor;
            ctx.globalAlpha = opacity * 1;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cardA.x, cardA.y);
            ctx.lineTo(cardB.x, cardB.y);
            ctx.stroke();
          }
        });
      });
      ctx.globalAlpha = 1;
    };

    const roundRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number,
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height,
      );
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    const drawCards = () => {
      cards.forEach((card) => {
        const x = card.x - card.width / 2;
        const y = card.y - card.height / 2;
        const radius = 4;

        // Card background with rounded corners
        ctx.fillStyle = card.color;
        roundRect(x, y, card.width, card.height, radius);
        ctx.fill();
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      updateCards();
      drawConnections();
      drawCards();

      animationFrameId = requestAnimationFrame(animate);
    };

    initCanvas();
    createCards();
    animate();

    const resizeObserver = new ResizeObserver(() => {
      initCanvas();
      createCards();
    });

    const container = containerRef.current;
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [
    cardCount,
    maxSpeed,
    connectionDistance,
    cardWidth,
    cardHeight,
    cardBorder,
    lineColor,
  ]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        "overflow-hidden rounded-md relative flex justify-center items-center w-full flex-1",
        className,
      )}
    >
      {children}
      <canvas
        ref={canvasRef}
        className="flex w-full flex-1 "
      />
    </div>
  );
}
