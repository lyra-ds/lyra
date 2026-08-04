import { WeeklyScheduleEditor } from '@lyra-ds/react';

export function WeeklyScheduleEditorBasic() {
  return (
    <div className="lw-example-scroll">
      <WeeklyScheduleEditor
        defaultValue={{
          1: [{ start: '09:00', end: '17:00' }],
          2: [{ start: '09:00', end: '17:00' }],
          3: [{ start: '09:00', end: '17:00' }],
          4: [{ start: '09:00', end: '17:00' }],
          5: [{ start: '09:00', end: '16:00' }],
        }}
        showExceptions={false}
      />
    </div>
  );
}
