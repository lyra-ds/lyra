import { WeeklyScheduleEditor } from '@lyra-ds/react';

export function WeeklyScheduleEditorExceptions() {
  return (
    <div className="lw-example-scroll">
      <WeeklyScheduleEditor
        defaultValue={{ 1: [{ start: '10:00', end: '18:00' }] }}
        exceptions={[
          { date: '2026-12-25', ranges: [] },
          { date: '2026-12-31', ranges: [{ start: '10:00', end: '13:00' }] },
        ]}
      />
    </div>
  );
}
