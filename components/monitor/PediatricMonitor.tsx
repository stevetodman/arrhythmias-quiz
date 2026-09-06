"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  advanceEventClock,
  CardiacBeat,
  createEventClockState,
  measureHeartRate,
  resetEventClock,
  RhythmMode,
} from "@/lib/monitor/eventClock";

type MonitorScenario = {
  rhythm: RhythmMode;
  rateBpm: number;
  spo2: number;
  respiratoryRate: number;
  nibp: string;
};

const DEFAULT_SCENARIO: MonitorScenario = {
  rhythm: "svt",
  rateBpm: 232,
  spo2: 97,
  respiratoryRate: 38,
  nibp: "78/46",
};

const SWEEP_SECONDS = 6;
const ECG_GAIN = 58;
const PLETH_GAIN = 46;

function gaussian(x: number, center: number, width: number, amplitude: number) {
  const z = (x - center) / width;
  return amplitude * Math.exp(-0.5 * z * z);
}

function ecgAmplitudeAt(
  timeSeconds: number,
  beats: CardiacBeat[],
  rhythm: RhythmMode,
) {
  let y = 0;

  for (const beat of beats) {
    const dt = timeSeconds - beat.ventricularAt;
    if (dt < -0.22 || dt > 0.48) continue;

    if (rhythm === "sinus-tach" && beat.atrialAt !== null) {
      const pDt = timeSeconds - beat.atrialAt;
      y += gaussian(pDt, 0, 0.018, 0.12);
    }

    y += gaussian(dt, -0.014, 0.008, -0.2);
    y += gaussian(dt, 0, 0.009, 1.0);
    y += gaussian(dt, 0.018, 0.012, -0.34);
    y += gaussian(dt, 0.15, 0.045, 0.28);
  }

  return y;
}

function plethAmplitudeAt(timeSeconds: number, beats: CardiacBeat[]) {
  let y = 0;

  for (const beat of beats) {
    const dt = timeSeconds - beat.ventricularAt - 0.18;
    if (dt < 0 || dt > 0.72) continue;

    const systolic = Math.exp(-dt / 0.16) * Math.sin(Math.min(Math.PI, dt * 12));
    const dicrotic = gaussian(dt, 0.28, 0.035, 0.18);
    y += Math.max(0, systolic) + dicrotic;
  }

  return y;
}

function resizeCanvas(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d");
  if (!context) return null;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { context, width: rect.width, height: rect.height };
}

function drawTrace(
  canvas: HTMLCanvasElement,
  nowSeconds: number,
  beats: CardiacBeat[],
  rhythm: RhythmMode,
  kind: "ecg" | "pleth",
) {
  const resized = resizeCanvas(canvas);
  if (!resized) return;

  const { context, width, height } = resized;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#020806";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = kind === "ecg" ? "rgba(39, 255, 127, 0.08)" : "rgba(54, 201, 255, 0.07)";
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  const baseline = height * 0.52;
  const gain = kind === "ecg" ? ECG_GAIN : PLETH_GAIN;
  context.strokeStyle = kind === "ecg" ? "#39ff88" : "#4cc9ff";
  context.lineWidth = kind === "ecg" ? 1.8 : 1.7;
  context.shadowBlur = 7;
  context.shadowColor = context.strokeStyle;
  context.beginPath();

  for (let x = 0; x <= width; x += 1.5) {
    const age = ((width - x) / width) * SWEEP_SECONDS;
    const sampleAt = nowSeconds - age;
    const amplitude =
      kind === "ecg"
        ? ecgAmplitudeAt(sampleAt, beats, rhythm)
        : plethAmplitudeAt(sampleAt, beats);
    const y = baseline - amplitude * gain;

    if (x === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }

  context.stroke();
  context.shadowBlur = 0;

  const sweepX = width - ((nowSeconds * width) / SWEEP_SECONDS) % width;
  context.fillStyle = "rgba(255,255,255,0.05)";
  context.fillRect(sweepX, 0, 2, height);
}

function NumericTile({
  label,
  value,
  unit,
  accent,
  compact = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent: string;
  compact?: boolean;
}) {
  return (
    <div className="border-b border-white/10 px-4 py-3 last:border-b-0">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {label}
        </span>
        {unit ? <span className="text-[10px] text-white/35">{unit}</span> : null}
      </div>
      <div className={`${compact ? "text-4xl" : "text-6xl"} font-light leading-none tabular-nums`} style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

export default function PediatricMonitor() {
  const ecgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const plethCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const clockRef = useRef(createEventClockState());
  const startRef = useRef<number | null>(null);
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [displayHr, setDisplayHr] = useState<number | null>(null);
  const [connected, setConnected] = useState(true);
  const [alarmSilenced, setAlarmSilenced] = useState(false);

  const rhythmLabel = useMemo(
    () => (scenario.rhythm === "svt" ? "NARROW TACHYCARDIA" : "SINUS TACHYCARDIA"),
    [scenario.rhythm],
  );

  useEffect(() => {
    resetEventClock(clockRef.current);
    startRef.current = null;
    setDisplayHr(null);
  }, [scenario.rhythm, scenario.rateBpm]);

  useEffect(() => {
    let frame = 0;
    let lastNumericUpdate = 0;

    const render = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const nowSeconds = (timestamp - startRef.current) / 1000;

      if (connected) {
        const beats = advanceEventClock(
          clockRef.current,
          nowSeconds,
          scenario.rateBpm,
          scenario.rhythm,
        );

        if (ecgCanvasRef.current) {
          drawTrace(ecgCanvasRef.current, nowSeconds, beats, scenario.rhythm, "ecg");
        }
        if (plethCanvasRef.current) {
          drawTrace(plethCanvasRef.current, nowSeconds, beats, scenario.rhythm, "pleth");
        }

        if (timestamp - lastNumericUpdate > 450) {
          setDisplayHr(measureHeartRate(beats, nowSeconds));
          lastNumericUpdate = timestamp;
        }
      } else {
        for (const canvas of [ecgCanvasRef.current, plethCanvasRef.current]) {
          if (!canvas) continue;
          const resized = resizeCanvas(canvas);
          if (!resized) continue;
          resized.context.fillStyle = "#020806";
          resized.context.fillRect(0, 0, resized.width, resized.height);
        }
        setDisplayHr(null);
      }

      frame = window.requestAnimationFrame(render);
    };

    frame = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(frame);
  }, [connected, scenario.rateBpm, scenario.rhythm]);

  const highHrAlarm = connected && displayHr !== null && displayHr >= 210;

  return (
    <main className="min-h-screen bg-[#08100f] p-3 text-white md:p-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-white/45">Pediatric bedside monitor prototype</div>
            <h1 className="text-xl font-semibold text-white/90">6-month-old • Rhythm Lab</h1>
          </div>
          <div className="rounded border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100/80">
            Generic device shell — manufacturer behavior not yet validated
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-white/15 bg-black shadow-2xl shadow-black/50">
          <div className={`flex min-h-11 items-center justify-between gap-4 border-b px-4 py-2 ${highHrAlarm && !alarmSilenced ? "border-red-400/40 bg-red-700/90" : "border-white/10 bg-[#111a18]"}`}>
            <div className="flex items-center gap-3 text-sm font-semibold tracking-wide">
              <span>{connected ? "BED 01" : "LEADS OFF"}</span>
              <span className="text-white/50">INFANT</span>
              <span className="text-white/50">{rhythmLabel}</span>
            </div>
            <div className="text-sm font-bold tracking-[0.14em]">
              {highHrAlarm ? (alarmSilenced ? "HIGH HR — SILENCED" : "HIGH HR") : "MONITORING"}
            </div>
          </div>

          <div className="grid min-h-[630px] grid-cols-1 lg:grid-cols-[1fr_260px]">
            <div className="grid grid-rows-[1fr_0.6fr_auto] border-r border-white/10">
              <div className="relative min-h-[290px] border-b border-white/10">
                <div className="absolute left-3 top-2 z-10 flex gap-3 text-xs font-semibold">
                  <span className="text-[#39ff88]">ECG II</span>
                  <span className="text-white/35">25 mm/s</span>
                  <span className="text-white/35">10 mm/mV</span>
                </div>
                <canvas ref={ecgCanvasRef} className="h-full min-h-[290px] w-full" aria-label="Live ECG waveform" />
              </div>

              <div className="relative min-h-[190px] border-b border-white/10">
                <div className="absolute left-3 top-2 z-10 flex gap-3 text-xs font-semibold">
                  <span className="text-[#4cc9ff]">PLETH</span>
                  <span className="text-white/35">mechanically coupled</span>
                </div>
                <canvas ref={plethCanvasRef} className="h-full min-h-[190px] w-full" aria-label="Live pulse oximeter pleth waveform" />
              </div>

              <div className="grid grid-cols-2 gap-px bg-white/10 text-xs sm:grid-cols-4">
                <button className="bg-[#111a18] px-4 py-4 text-left hover:bg-white/10" onClick={() => setAlarmSilenced((value) => !value)}>
                  <span className="block text-white/45">Alarm</span>
                  <span className="font-semibold">{alarmSilenced ? "Resume" : "Silence"}</span>
                </button>
                <button className="bg-[#111a18] px-4 py-4 text-left hover:bg-white/10" onClick={() => setConnected((value) => !value)}>
                  <span className="block text-white/45">ECG cable</span>
                  <span className="font-semibold">{connected ? "Disconnect" : "Reconnect"}</span>
                </button>
                <div className="bg-[#111a18] px-4 py-4">
                  <span className="block text-white/45">Wave source</span>
                  <span className="font-semibold">Event clock</span>
                </div>
                <div className="bg-[#111a18] px-4 py-4">
                  <span className="block text-white/45">HR source</span>
                  <span className="font-semibold">Measured QRS</span>
                </div>
              </div>
            </div>

            <aside className="bg-[#07100e]">
              <NumericTile label="HR" value={connected ? displayHr ?? "---" : "---"} unit="bpm" accent="#39ff88" />
              <NumericTile label="SpO₂" value={connected ? scenario.spo2 : "---"} unit="%" accent="#4cc9ff" />
              <NumericTile label="RR" value={connected ? scenario.respiratoryRate : "---"} unit="/min" accent="#f8d45c" compact />
              <NumericTile label="NIBP" value={connected ? scenario.nibp : "---/---"} unit="mmHg" accent="#f4f4f5" compact />
              <div className="px-4 py-4 text-xs leading-5 text-white/45">
                Monitor numerics intentionally use a generic display model. Device-specific averaging, alarm delays, artifact rejection, and menu behavior remain unvalidated.
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Developer scenario controls</div>
              <div className="text-sm text-white/70">Not part of the bedside monitor UI</div>
            </div>
            <div className="text-xs text-white/35">Canonical event clock drives all cardiac timing</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-lg border px-4 py-2 text-sm ${scenario.rhythm === "svt" ? "border-emerald-400/50 bg-emerald-400/15" : "border-white/10 bg-black/20"}`}
              onClick={() => setScenario((current) => ({ ...current, rhythm: "svt", rateBpm: 232 }))}
            >
              Narrow-complex tachycardia
            </button>
            <button
              className={`rounded-lg border px-4 py-2 text-sm ${scenario.rhythm === "sinus-tach" ? "border-emerald-400/50 bg-emerald-400/15" : "border-white/10 bg-black/20"}`}
              onClick={() => setScenario((current) => ({ ...current, rhythm: "sinus-tach", rateBpm: 188 }))}
            >
              Sinus tachycardia
            </button>
            <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm">
              Rate
              <input
                aria-label="Scenario heart rate"
                className="w-28 accent-emerald-400"
                type="range"
                min="120"
                max="280"
                step="1"
                value={scenario.rateBpm}
                onChange={(event) => setScenario((current) => ({ ...current, rateBpm: Number(event.target.value) }))}
              />
              <span className="w-8 tabular-nums text-white/70">{scenario.rateBpm}</span>
            </label>
          </div>
        </section>
      </div>
    </main>
  );
}
