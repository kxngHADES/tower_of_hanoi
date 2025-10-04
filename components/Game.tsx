"use client";
import React, { useEffect, useState, useRef } from "react";
import styles from "./Game.module.css";
import Rod from "./Rod";

type Move = [number, number];
type RecursionStep = {
  depth: number;
  n: number;
  from: number;
  to: number;
  aux: number[];
  phase: "enter" | "move" | "exit";
};

function generateInitialRods(pegs: number, disks: number) {
  const rods: number[][] = Array.from({ length: pegs }, () => []);
  // Represent disk sizes as numbers: 1 = smallest, disks = largest.
  rods[0] = Array.from({ length: disks }, (_, i) => disks - i);
  return rods;
}

// Recursive solver: simple generalization that always uses the first available aux peg.
// Not optimal for >3 pegs, but fine for visualizing recursion.
function computeMoves(
  n: number,
  from: number,
  to: number,
  aux: number[],
  out: Move[]
) {
  if (n <= 0) return;
  if (n === 1) {
    out.push([from, to]);
    return;
  }
  if (aux.length === 0) {
    // No auxiliary pegs: cannot recursively move n>1 properly, fallback to direct cheat (not ideal)
    out.push([from, to]);
    return;
  }
  const temp = aux[0];
  const restAux = aux.slice(1);
  // move n-1 from -> temp, using to + restAux as auxiliaries
  computeMoves(n - 1, from, temp, [to, ...restAux], out);
  out.push([from, to]);
  computeMoves(n - 1, temp, to, [from, ...restAux], out);
}

function computeMovesWithTrace(
  n: number,
  from: number,
  to: number,
  aux: number[],
  out: Move[],
  trace: RecursionStep[],
  depth: number = 0
) {
  if (n <= 0) return;

  trace.push({ depth, n, from, to, aux, phase: "enter" });

  if (n === 1) {
    out.push([from, to]);
    trace.push({ depth, n, from, to, aux, phase: "move" });
    trace.push({ depth, n, from, to, aux, phase: "exit" });
    return;
  }

  if (aux.length === 0) {
    out.push([from, to]);
    trace.push({ depth, n, from, to, aux, phase: "move" });
    trace.push({ depth, n, from, to, aux, phase: "exit" });
    return;
  }
  const temp = aux[0];
  const restAux = aux.slice(1);
  computeMovesWithTrace(n - 1, from, temp, [to, ...restAux], out, trace, depth + 1);
  out.push([from, to]);
  trace.push({ depth, n, from, to, aux, phase: "move" });
  computeMovesWithTrace(n - 1, temp, to, [from, ...restAux], out, trace, depth + 1);

  trace.push({ depth, n, from, to, aux, phase: "exit" });
}

export default function Game() {
  const [pegs, setPegs] = useState(3);
  const [disks, setDisks] = useState(4);
  const [rods, setRods] = useState<number[][]>(
    () => generateInitialRods(3, 4)
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(500); // ms per move
  const [moveIndex, setMoveIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [recursionTrace, setRecursionTrace] = useState<RecursionStep[]>([]);
  const [currentTraceIndex, setCurrentTraceIndex] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    setRods(generateInitialRods(pegs, disks));
    setSelected(null);
    setMoves([]);
    setMoveIndex(0);
    setRunning(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pegs, disks]);

  useEffect(() => {
    if (running && moveIndex < moves.length) {
      animRef.current = window.setTimeout(() => {
        applyMove(moves[moveIndex]);
        setMoveIndex((i) => i + 1);
        // Update trace index - find next 'move' phase
        let nextTrace = currentTraceIndex;
        while (
          nextTrace < recursionTrace.length &&
          recursionTrace[nextTrace].phase !== "move"
        ) {
          nextTrace++;
        }
        if (nextTrace < recursionTrace.length) {
          setCurrentTraceIndex(nextTrace + 1);
        }
      }, speed);
    } else {
      if (moveIndex >= moves.length) setRunning(false);
    }
    return () => {
      if (animRef.current) window.clearTimeout(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, moveIndex, moves, speed]);

  function applyMove([from, to]: Move) {
    setRods((prev) => {
      const copy = prev.map((r) => r.slice());
      const src = copy[from];
      const dst = copy[to];
      if (src.length === 0) return prev; // nothing to move
      const disk = src[src.length - 1];
      // validate
      if (dst.length === 0 || disk < dst[dst.length - 1]) {
        src.pop();
        dst.push(disk);
      } else {
        // illegal - ignore
      }
      return copy;
    });
  }

  function handleRodClick(index: number) {
    if (running) return;
    if (selected === null) {
      if (rods[index].length === 0) {
        setMessage("Select a rod with disks first.");
        setTimeout(() => setMessage(null), 1200);
        return;
      }
      setSelected(index);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    // attempt move selected -> index
    const src = rods[selected];
    const dst = rods[index];
    if (src.length === 0) {
      setMessage("No disk to move.");
      setSelected(null);
      setTimeout(() => setMessage(null), 1200);
      return;
    }
    const disk = src[src.length - 1];
    if (dst.length === 0 || disk < dst[dst.length - 1]) {
      // perform move
      setRods((prev) => {
        const copy = prev.map((r) => r.slice());
        copy[index].push(copy[selected!].pop()!);
        return copy;
      });
    } else {
      setMessage("Illegal move: cannot place larger disk on smaller one.");
      setTimeout(() => setMessage(null), 1500);
    }
    setSelected(null);
  }

  function startSolve() {
    const aux = Array.from({ length: pegs }, (_, i) => i).filter(
      (i) => i !== 0 && i !== pegs - 1
    );
    const out: Move[] = [];
    const trace: RecursionStep[] = [];
    computeMovesWithTrace(disks, 0, pegs - 1, aux, out, trace);
    setMoves(out);
    setRecursionTrace(trace);
    setMoveIndex(0);
    setCurrentTraceIndex(0);
    setRunning(true);
  }

  function stepSolve() {
    if (running) return;
    if (moves.length === 0) {
      const aux = Array.from({ length: pegs }, (_, i) => i).filter(
        (i) => i !== 0 && i !== pegs - 1
      );
      const out: Move[] = [];
      const trace: RecursionStep[] = [];
      computeMovesWithTrace(disks, 0, pegs - 1, aux, out, trace);
      setMoves(out);
      setRecursionTrace(trace);
      setMoveIndex(0);
      setCurrentTraceIndex(0);
    }
    if (moveIndex < moves.length) {
      applyMove(moves[moveIndex]);
      setMoveIndex((i) => i + 1);
      let nextTrace = currentTraceIndex;
      while (nextTrace < recursionTrace.length && recursionTrace[nextTrace].phase !== "move") {
        nextTrace++;
      }
      if (nextTrace < recursionTrace.length) {
        setCurrentTraceIndex(nextTrace + 1);
      }
    }
  }

  function resetGame() {
    if (animRef.current) window.clearTimeout(animRef.current);
    setRods(generateInitialRods(pegs, disks));
    setSelected(null);
    setMoves([]);
    setRecursionTrace([]);
    setMoveIndex(0);
    setCurrentTraceIndex(0);
    setRunning(false);
  }

  // Get active recursion calls for visualization
  const activeStack = recursionTrace
    .slice(0, currentTraceIndex)
    .filter((step) => {
      const exitIndex = recursionTrace.findIndex(
        (s, i) =>
          i > recursionTrace.indexOf(step) &&
          s.depth === step.depth &&
          s.n === step.n &&
          s.phase === "exit"
      );
      return exitIndex === -1 || exitIndex >= currentTraceIndex;
    })
    .filter(
      (step, idx, arr) =>
        arr.findIndex(
          (s) => s.depth === step.depth && s.n === step.n && s.from === step.from
        ) === idx
    );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Tower of Hanoi — Visual Recursive Demo</h1>

      <section className={styles.controls}>
        <label>
          Pegs:
          <input
            type="number"
            min={2}
            max={8}
            value={pegs}
            onChange={(e) =>
              setPegs(
                Math.max(2, Math.min(8, Number(e.target.value || 3)))
              )
            }
            className={styles.number}
          />
        </label>
        <label>
          Disks:
          <input
            type="number"
            min={1}
            max={8}
            value={disks}
            onChange={(e) =>
              setDisks(
                Math.max(1, Math.min(8, Number(e.target.value || 4)))
              )
            }
            className={styles.number}
          />
        </label>
        <button onClick={resetGame} className={styles.btn}>
          Reset
        </button>
        <button onClick={startSolve} className={styles.btn} disabled={running}>
          Solve (Animate)
        </button>
        <button onClick={stepSolve} className={styles.btn} disabled={running}>
          Step
        </button>
        <label className={styles.speedLabel}>
          Speed:
          <input
            type="range"
            min={100}
            max={1200}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <span className={styles.small}>{speed} ms</span>
        </label>
      </section>

      {message && <div className={styles.message}>{message}</div>}

      <section className={styles.playArea}>
        {rods.map((stack, i) => (
          <Rod
            key={i}
            index={i}
            disks={stack}
            maxDisks={disks}
            onClick={() => handleRodClick(i)}
            selected={selected === i}
            label={`Rod ${i + 1}`}
          />
        ))}
      </section>

      <section className={styles.recursionViz}>
        <h2>Python Recursion Call Stack Visualization</h2>
        <div className={styles.callStack}>
          {recursionTrace.length === 0 ? (
            <div className={styles.callItem}>
              <span className={styles.noActive}>
                Click "Solve (Animate)" or "Step" to see recursion in action
              </span>
            </div>
          ) : activeStack.length === 0 ? (
            <div className={styles.callItem}>
              <span className={styles.noActive}>
                No active calls (completed or not started)
              </span>
            </div>
          ) : (
            activeStack.map((step, idx) => (
              <div
                key={idx}
                className={`${styles.callItem} ${
                  idx === activeStack.length - 1 ? styles.activeCall : ""
                }`}
                style={{ paddingLeft: `${step.depth * 24}px` }}
              >
                <span className={styles.callText}>
                  {`${
                    "  ".repeat(step.depth)
                  }solve(n=${step.n}, from=Rod${
                    step.from + 1
                  }, to=Rod${step.to + 1}, aux=[${step.aux
                    .map((a) => `Rod${a + 1}`)
                    .join(", ")}])`}
                </span>
              </div>
            ))
          )}
        </div>
        <div className={styles.progressInfo}>
          <span>
            Move {moveIndex} of {moves.length}
          </span>
        </div>
      </section>
    </div>
  );
}