# Pediatric Bedside Monitor Prototype

## Status

This branch is an isolated prototype. It does **not** replace the existing arrhythmia quiz and should not be merged into `master` until the intended home for the full simulator is confirmed.

Prototype route: `/monitor`

## Implemented

- Generic pediatric bedside-monitor shell.
- Six-month-old rhythm-lab scenario.
- Canonical cardiac event clock in `lib/monitor/eventClock.ts`.
- Ventricular events are the single source of truth for QRS timing.
- Displayed heart rate is measured from completed ventricular-event intervals rather than independently assigned.
- ECG waveform is generated from cardiac events.
- Pleth waveform is mechanically coupled to ventricular events with a pulse-transit delay rather than animated independently.
- Narrow-complex tachycardia and sinus-tachycardia developer scenarios.
- ECG lead disconnect/reconnect behavior.
- Generic high-heart-rate alarm and alarm-silence interaction.
- Scenario/developer controls are visually separated from bedside monitor controls.

## Architectural contract

Patient state -> electrophysiology -> cardiac events -> waveform rendering -> measured monitor values -> UI.

No downstream waveform or numeric display should independently create cardiac timing.

## Intentionally not validated yet

The prototype is manufacturer-neutral. The following must not be treated as real-device behavior until the exact bedside monitor model is selected and checked against official documentation and/or physical hardware:

- alarm thresholds and alarm delays;
- heart-rate averaging windows;
- QRS detection and artifact rejection;
- lead-fail behavior;
- sweep implementation and filtering;
- gain/speed menu interactions;
- numeric update cadence;
- SpO2 averaging and signal-quality behavior;
- NIBP workflow and cuff cycling;
- button layout, menus, tones, colors, and priority hierarchy.

## Next engineering steps

1. Move or recreate this prototype in the actual simulator repository once the local implementation is available in GitHub.
2. Add deterministic event-clock tests for rate, QRS count, transition timing, and multi-channel synchronization.
3. Add a rhythm-transition engine so SVT onset/termination changes future cardiac events rather than swapping a visual preset.
4. Add artifact/lead-loss states without corrupting the underlying patient rhythm.
5. Select the exact clinical monitor model and implement a device adapter over the generic physiology layer.
6. Add physical-device acceptance tests for alarms, averaging, controls, and display behavior.
