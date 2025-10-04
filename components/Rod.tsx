"use client";
import React from "react";
import Disk from "./Disk";
import styles from "./Rod.module.css";

export default function Rod({
  index,
  disks,
  maxDisks,
  onClick,
  selected,
  label,
}: {
  index: number;
  disks: number[];
  maxDisks: number;
  onClick: () => void;
  selected?: boolean;
  label?: string;
}) {
  const reversedDisks = disks.slice().reverse();

  return (
    <div
      className={`${styles.rodWrap} ${selected ? styles.selected : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={label || `Rod ${index + 1}`}
    >
      <div className={styles.rod}>
        <div className={styles.pole} />
        <div className={styles.base} />
        <div className={styles.stack}>
          {Array.from({ length: maxDisks - disks.length }).map((_, i) => (
            <div key={"sp" + i} className={styles.spacer} />
          ))}
          {reversedDisks.map((size, i) => (
            <Disk
              key={i}
              size={size}
              maxSize={maxDisks}
              isSelected={selected && i === 0}
            />
          ))}
        </div>
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
