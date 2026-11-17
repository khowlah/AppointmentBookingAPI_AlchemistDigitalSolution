import test, { describe, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { dbPool } from '../src/config/supabase.js';

describe('Concurrency & Double-Booking Stress Test', () => {
  const testSpecialistId = '22222222-2222-2222-2222-222222222201'; // Dr. Sarah
  const testServiceId = '11111111-1111-1111-1111-111111111101';    // General Consultation
  const raceSlotId = '44444444-4444-4444-4444-444444444402';       // Dr. Sarah 09:30-10:00
  const testDate = '2026-12-01';
  let successfulBookingId = null;

  after(async () => {
    if (successfulBookingId) {
      await dbPool.query('DELETE FROM bookings WHERE id = $1;', [successfulBookingId]);
      await dbPool.query('UPDATE availability_slots SET is_available = true WHERE id = $1;', [raceSlotId]);
    }
    await dbPool.end();
  });

  test('High Concurrency: Exactly ONE request succeeds (201) and all other concurrent requests are rejected (409 Conflict)', async () => {
    // Ensure slot is available before race
    await dbPool.query('UPDATE availability_slots SET is_available = true WHERE id = $1;', [raceSlotId]);

    const concurrentRequestsCount = 8;
    const promises = [];

    for (let i = 0; i < concurrentRequestsCount; i++) {
      const payload = {
        serviceId: testServiceId,
        specialistId: testSpecialistId,
        date: testDate,
        timeSlot: raceSlotId,
        client: {
          fullName: `Concurrent Client ${i + 1}`,
          email: `concurrent.client${i + 1}@example.com`,
          phone: `+96655000000${i}`
        },
        notes: `Simultaneous race request #${i + 1}`
      };

      promises.push(request(app).post('/api/bookings').send(payload));
    }

    const responses = await Promise.all(promises);

    const successful = responses.filter(r => r.status === 201);
    const conflicts = responses.filter(r => r.status === 409);

    console.log(`\nConcurrency Test Results: ${successful.length} succeeded (201), ${conflicts.length} rejected (409)`);

    assert.equal(successful.length, 1, 'Exactly one concurrent booking must succeed');
    assert.equal(conflicts.length, concurrentRequestsCount - 1, 'All other concurrent bookings must receive 409 Conflict');

    successfulBookingId = successful[0].body.data.id;

    // Verify slot in DB is marked unavailable
    const slotCheck = await dbPool.query('SELECT is_available FROM availability_slots WHERE id = $1;', [raceSlotId]);
    assert.equal(slotCheck.rows[0].is_available, false);
  });
});
