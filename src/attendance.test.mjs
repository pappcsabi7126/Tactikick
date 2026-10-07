import test from 'node:test'
import assert from 'node:assert/strict'
import { attendanceStatus, updateAttendance } from './attendance.js'

test('new players have no retroactive attendance and recorded statuses are preserved', () => {
  const training = { attendance: { old: 'present', absent: 'absent', excused: 'excused' } }
  assert.equal(attendanceStatus(training, 'new'), 'unrecorded')
  assert.equal(attendanceStatus(training, 'old'), 'present')
  assert.equal(attendanceStatus(training, 'absent'), 'absent')
  assert.equal(attendanceStatus(training, 'excused'), 'excused')
  assert.equal(attendanceStatus({}, 'new'), 'unrecorded')
})

test('attendance edits support marking, changing and clearing without mutating other players', () => {
  const original = { id: 1, attendance: { old: 'present' } }
  const marked = updateAttendance(original, 'new', 'present')
  assert.equal(attendanceStatus(marked, 'new'), 'present')
  assert.equal(attendanceStatus(original, 'new'), 'unrecorded')
  const absent = updateAttendance(marked, 'new', 'absent')
  assert.equal(attendanceStatus(absent, 'new'), 'absent')
  const cleared = updateAttendance(absent, 'new', 'unrecorded')
  assert.equal(attendanceStatus(cleared, 'new'), 'unrecorded')
  assert.deepEqual(cleared.attendance, { old: 'present' })
})
