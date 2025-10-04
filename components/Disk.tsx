"use client";
import React from "react";
import styles from "./Disk.module.css";

export default function Disk({
  size,
  maxSize,
  isSelected,
}: {
  size: number;
  maxSize: number;
  isSelected?: boolean;
}) {
  // compute width percent: smallest = 32%, largest = 100%
  const min = 32;
  const max = 100;
  const pct = min + ((size - 1) / Math.max(1, maxSize - 1)) * (max - min);
  const totalColors = 8;
  const colorIndex = ((size - 1) % totalColors) + 1;
  return (
    <div
      className={`${styles.disk} ${isSelected ? styles.selected : ""}`}
      style={{
        width: `${pct}%`,
        background: `var(--disk-${colorIndex})`,
      }}
    >
      <span className={styles.label}>{size}</span>
    </div>
  );
}
