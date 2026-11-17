export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Appointment & Consultation Booking Platform API',
    version: '1.0.0',
    description: 'RESTful API for consultation services, specialist directory, calendar availability scheduling, and double-booking prevention built with Node.js, Express.js, and Supabase PostgreSQL.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server'
    }
  ],
  tags: [
    { name: 'Services', description: 'Consultation service catalog endpoints' },
    { name: 'Specialists', description: 'Specialist profiles and availability schedule endpoints' },
    { name: 'Bookings', description: 'Appointment booking lifecycle, concurrency, and rescheduling endpoints' }
  ],
  paths: {
    '/api/services': {
      get: {
        tags: ['Services'],
        summary: 'Retrieve all active consultation services',
        description: 'Returns a list of all active consultation services with duration, fee, and category. Supports optional category filtering.',
        parameters: [
          {
            name: 'category',
            in: 'query',
            description: 'Filter services by department/category (e.g. Cardiology, General Medicine, Pediatrics)',
            required: false,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'List of services retrieved successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Services retrieved successfully',
                  data: [
                    {
                      id: '11111111-1111-1111-1111-111111111101',
                      title: 'General Medical Consultation',
                      description: 'Comprehensive initial medical evaluation.',
                      duration_minutes: 30,
                      fee: 75,
                      category: 'General Medicine',
                      is_active: true
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/api/services/{id}': {
      get: {
        tags: ['Services'],
        summary: 'Retrieve a consultation service by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'UUID of the service',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          200: { description: 'Service retrieved successfully' },
          404: { description: 'Service not found' }
        }
      }
    },
    '/api/specialists': {
      get: {
        tags: ['Specialists'],
        summary: 'Retrieve specialist profiles',
        description: 'Returns active specialists, including the consultation services they are certified to provide. Supports filtering by specialty or category.',
        parameters: [
          {
            name: 'specialty',
            in: 'query',
            description: 'Filter by specialty (e.g. Cardiology, Pediatrics)',
            required: false,
            schema: { type: 'string' }
          },
          {
            name: 'category',
            in: 'query',
            description: 'Filter by service category',
            required: false,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Specialists retrieved successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Specialists retrieved successfully',
                  data: [
                    {
                      id: '22222222-2222-2222-2222-222222222201',
                      full_name: 'Dr. Sarah Al-Mansoor',
                      email: 'sarah.mansoor@example.com',
                      phone: '+966501112233',
                      specialty: 'General Medicine',
                      services: [
                        {
                          id: '11111111-1111-1111-1111-111111111101',
                          title: 'General Medical Consultation',
                          duration_minutes: 30,
                          fee: 75,
                          category: 'General Medicine'
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/api/specialists/{id}/slots': {
      get: {
        tags: ['Specialists'],
        summary: 'Retrieve availability schedule for a specialist on a date',
        description: 'Returns all slots configured for the specialist on the requested date with clear availability status (available or booked).',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Specialist UUID',
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'date',
            in: 'query',
            required: true,
            description: 'Date in YYYY-MM-DD format',
            schema: { type: 'string', format: 'date', example: '2026-12-01' }
          }
        ],
        responses: {
          200: {
            description: 'Slots retrieved successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Specialist availability slots retrieved successfully',
                  data: {
                    specialistId: '22222222-2222-2222-2222-222222222201',
                    date: '2026-12-01',
                    slots: [
                      {
                        id: '44444444-4444-4444-4444-444444444401',
                        start_time: '09:00',
                        end_time: '09:30',
                        status: 'booked'
                      },
                      {
                        id: '44444444-4444-4444-4444-444444444402',
                        start_time: '09:30',
                        end_time: '10:00',
                        status: 'available'
                      }
                    ]
                  }
                }
              }
            }
          },
          404: { description: 'Specialist not found' }
        }
      }
    },
    '/api/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Create a new appointment booking with double-booking prevention',
        description: 'Safely reserves an appointment slot using PostgreSQL atomic row-locking and constraints to prevent race conditions.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['serviceId', 'specialistId', 'date', 'timeSlot', 'client'],
                properties: {
                  serviceId: { type: 'string', format: 'uuid' },
                  specialistId: { type: 'string', format: 'uuid' },
                  date: { type: 'string', format: 'date', example: '2026-12-01' },
                  timeSlot: { type: 'string', format: 'uuid', description: 'ID of availability slot' },
                  client: {
                    type: 'object',
                    required: ['fullName', 'email'],
                    properties: {
                      fullName: { type: 'string', example: 'Khawlah Al-Mutairi' },
                      email: { type: 'string', format: 'email', example: 'khawlah@example.com' },
                      phone: { type: 'string', example: '+966551234567' }
                    }
                  },
                  notes: { type: 'string', example: 'Initial appointment notes' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Booking created successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Appointment booked successfully',
                  data: {
                    id: '55555555-5555-5555-5555-555555555509',
                    status: 'Pending',
                    date: '2026-12-01',
                    client: { fullName: 'Khawlah Al-Mutairi', email: 'khawlah@example.com' }
                  }
                }
              }
            }
          },
          400: { description: 'Validation error or invalid relationship' },
          404: { description: 'Referenced service, specialist, or slot not found' },
          409: {
            description: 'Conflict: Slot already booked',
            content: {
              'application/json': {
                example: {
                  success: false,
                  message: 'The requested availability slot is already booked or unavailable.',
                  error: { code: 'SLOT_CONFLICT' }
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Bookings'],
        summary: 'Retrieve bookings with filtering and pagination',
        parameters: [
          { name: 'email', in: 'query', schema: { type: 'string' } },
          { name: 'phone', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'] } },
          { name: 'specialistId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: { description: 'Bookings list retrieved' }
        }
      }
    },
    '/api/bookings/{id}/status': {
      patch: {
        tags: ['Bookings'],
        summary: 'Update booking status (Pending, Confirmed, Completed, Cancelled)',
        description: 'Updates booking status. If status is set to Cancelled, the associated slot is automatically released.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'] },
                  reason: { type: 'string', example: 'Patient rescheduled' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Status updated successfully' },
          400: { description: 'Invalid status transition' },
          404: { description: 'Booking not found' }
        }
      }
    },
    '/api/bookings/{id}/reschedule': {
      patch: {
        tags: ['Bookings'],
        summary: 'Reschedule an appointment to a new availability slot',
        description: 'Atomically releases the old slot and reserves the new slot within a single atomic operation.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['timeSlot', 'date'],
                properties: {
                  timeSlot: { type: 'string', format: 'uuid', description: 'New availability slot ID' },
                  date: { type: 'string', format: 'date', example: '2026-12-01' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Appointment rescheduled successfully' },
          400: { description: 'Invalid slot or specialist mismatch' },
          404: { description: 'Booking or new slot not found' },
          409: { description: 'Target slot is already booked' }
        }
      }
    }
  }
};
