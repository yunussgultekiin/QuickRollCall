import { rateLimit } from "./rate-limit.middleware";

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const int = Math.floor(parsed);
  return int > 0 ? int : fallback;
};

const submitWindowSec = toPositiveInt(process.env.SUBMIT_LIMIT_WINDOW_SEC, 60);
const submitMax = toPositiveInt(process.env.SUBMIT_LIMIT_PER_WINDOW, 6);
const mintWindowSec = toPositiveInt(process.env.MINT_LIMIT_WINDOW_SEC, 60);
const mintMax = toPositiveInt(process.env.MINT_LIMIT_PER_WINDOW, 10);

export const submitLimiter = rateLimit({
  windowSec: submitWindowSec,
  max: submitMax,
  keyPrefix: "rl:submit",
});

export const mintLimiter = rateLimit({
  windowSec: mintWindowSec,
  max: mintMax,
  keyPrefix: "rl:mint",
});
