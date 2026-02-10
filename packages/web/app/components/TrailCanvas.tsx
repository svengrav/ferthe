import clsx from "clsx";
import { useEffect, useRef } from "react";
import { Logo } from "./Logo.tsx";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface TrailCanvasProps {
  className?: string;
}

export function TrailCanvas({ className }: TrailCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let nodes: Node[] = [];

    const CONFIG = {
      nodeCount: 25,
      maxSpeed: 0.3,
      connectionDistance: 150,
      nodeRadius: 3,
      nodeColor: "#000",
      lineColor: "#000",
    };

    const initCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * globalThis.devicePixelRatio;
      canvas.height = rect.height * globalThis.devicePixelRatio;
      ctx.scale(globalThis.devicePixelRatio, globalThis.devicePixelRatio);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    const createNodes = () => {
      const rect = canvas.getBoundingClientRect();
      nodes = Array.from({ length: CONFIG.nodeCount }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * CONFIG.maxSpeed,
        vy: (Math.random() - 0.5) * CONFIG.maxSpeed,
        radius: CONFIG.nodeRadius,
      }));
    };

    const updateNodes = () => {
      const rect = canvas.getBoundingClientRect();

      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > rect.width) node.vx *= -1;
        if (node.y < 0 || node.y > rect.height) node.vy *= -1;

        node.x = Math.max(0, Math.min(rect.width, node.x));
        node.y = Math.max(0, Math.min(rect.height, node.y));
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
            ctx.globalAlpha = opacity * 0.4;
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
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      updateNodes();
      drawConnections();
      drawNodes();

      animationFrameId = requestAnimationFrame(animate);
    };

    initCanvas();
    createNodes();
    animate();

    const resizeObserver = new ResizeObserver(() => {
      initCanvas();
    });
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      className={clsx(
        "overflow-hidden rounded-md relative flex justify-center items-center w-full",
        className,
      )}
    >
      <Logo className="absolute fill-black w-96" height={200} />
      <canvas
        ref={canvasRef}
        className="rounded-md w-full"
      />
    </div>
  );
}
