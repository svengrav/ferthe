import clsx from "clsx";
import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface TrailCanvasProps {
  children?: React.ReactNode;
  className?: string;
  nodeCount?: number;
  maxSpeed?: number;
  connectionDistance?: number;
  nodeRadius?: number;
  nodeColor?: string;
  lineColor?: string;
}

export function TrailCanvas({
  children,
  className,
  nodeCount = 25,
  maxSpeed = 0.2,
  connectionDistance = 100,
  nodeRadius = 3,
  nodeColor = "#fff",
  lineColor = "#fff",
}: TrailCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let nodes: Node[] = [];
    let canvasWidth = 0;
    let canvasHeight = 0;

    const CONFIG = {
      nodeCount,
      maxSpeed,
      connectionDistance,
      nodeRadius,
      nodeColor,
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

    const createNodes = () => {
      nodes = Array.from({ length: CONFIG.nodeCount }, () => ({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        vx: (Math.random() - 0.5) * CONFIG.maxSpeed,
        vy: (Math.random() - 0.5) * CONFIG.maxSpeed,
        radius: CONFIG.nodeRadius,
      }));
    };

    const updateNodes = () => {
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvasWidth) node.vx *= -1;
        if (node.y < 0 || node.y > canvasHeight) node.vy *= -1;

        node.x = Math.max(0, Math.min(canvasWidth, node.x));
        node.y = Math.max(0, Math.min(canvasHeight, node.y));
      });
    };

    const drawConnections = () => {
      nodes.forEach((nodeA, i) => {
        nodes.slice(i + 1).forEach((nodeB) => {
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < CONFIG.connectionDistance) {
            const opacity = 1 - distance / CONFIG.connectionDistance;
            ctx.strokeStyle = CONFIG.lineColor;
            ctx.globalAlpha = opacity * 0.5;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.stroke();
          }
        });
      });
      ctx.globalAlpha = 1;
    };

    const drawNodes = () => {
      ctx.fillStyle = CONFIG.nodeColor;
      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      updateNodes();
      drawConnections();
      drawNodes();

      animationFrameId = requestAnimationFrame(animate);
    };

    initCanvas();
    createNodes();
    animate();

    const resizeObserver = new ResizeObserver(() => {
      console.log("Resizing canvas...");
      initCanvas();
      createNodes();
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
    nodeCount,
    maxSpeed,
    connectionDistance,
    nodeRadius,
    nodeColor,
    lineColor,
  ]);
  return (
    <div
      ref={containerRef}
      className={clsx(
        "overflow-hidden rounded-md relative",
        className,
      )}
    >
      {children}

      <canvas
        id="canvas"
        ref={canvasRef}
        className=" w-7xl position: absolute "
      />
    </div>
  );
}
