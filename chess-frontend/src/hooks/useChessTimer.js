import { useEffect, useState } from "react";

export default function useChessTimer(startSeconds, isActive) {
  const [time, setTime] = useState(startSeconds);

  useEffect(() => {
    setTime(startSeconds);
  }, [startSeconds]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTime(t => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  return time;
}
