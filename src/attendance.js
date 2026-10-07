export function attendanceStatus(training, playerId) {
  const status = training?.attendance?.[playerId]
  return ['present', 'absent', 'excused'].includes(status) ? status : 'unrecorded'
}

export function updateAttendance(training, playerId, status) {
  const attendance = { ...training.attendance }
  if (status === 'unrecorded') delete attendance[playerId]
  else if (['present', 'absent', 'excused'].includes(status)) attendance[playerId] = status
  return { ...training, attendance }
}
