import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import type {
  HealthReport,
} from '../types/report'

export function generateHealthPDF(
  report: HealthReport
) {

  const doc = new jsPDF()

  function format(
    value: number | null
  ) {
    return value === null
      ? 'Unavailable'
      : value.toFixed(2)
  }

  // HEADER

  doc.setFillColor(8, 15, 38)
  doc.rect(0, 0, 210, 43, 'F')

  doc.setTextColor(255, 255, 255)

  doc.setFontSize(25)
  doc.setFont('helvetica', 'bold')
  doc.text('MediConnect', 15, 17)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.text('Patient Health Monitoring Report', 15, 27)

  doc.setFontSize(9)
  doc.text('Experimental monitoring prototype', 15, 35)

  // PATIENT INFORMATION

  autoTable(doc, {

    startY: 50,

    head: [
      ['Patient information', 'Details'],
    ],

    body: [
      ['Patient name', report.patient.user.fullName],
      ['Patient ID', report.patient.patientCode],

      [
        'Treating doctor',
        report.patient.doctor.user.fullName,
      ],

      [
        'Period start',
        new Date(report.period.from).toLocaleString('en-IN'),
      ],

      [
        'Period end (exclusive)',
        new Date(report.period.to).toLocaleString('en-IN'),
      ],

      [
        'Generated',
        new Date(report.generatedAt).toLocaleString('en-IN'),
      ],

      [
        'Stored readings',
        String(report.summary.totalReadings),
      ],
    ],

    theme: 'grid',

    headStyles: {
      fillColor: [67, 97, 238],
    },

    styles: {
      fontSize: 10,
    },
  })

  // STATISTICAL SUMMARY

  const stats = [
    {
      name: 'Heart rate (BPM)',
      data: report.summary.heartRate,
    },
    {
      name: 'SpO2 (%)',
      data: report.summary.spo2,
    },
    {
      name: 'Sensor temp. (C)',
      data: report.summary.temperature,
    },
  ]

  autoTable(doc, {

    head: [
      [
        'Parameter',
        'Minimum',
        'Maximum',
        'Mean',
        'Samples',
      ],
    ],

    body: stats.map(item => [
      item.name,
      format(item.data.min),
      format(item.data.max),
      format(item.data.average),
      String(item.data.count),
    ]),

    headStyles: {
      fillColor: [23, 37, 84],
    },

    styles: {
      fontSize: 9,
    },
  })

  // HEALTH ALERTS

  autoTable(doc, {

    head: [
      ['Health alert', 'Severity', 'Status', 'Date'],
    ],

    body: report.alerts.length
      ? report.alerts.map(alert => [
          alert.title,
          alert.severity,
          alert.status,
          new Date(
            alert.createdAt
          ).toLocaleString('en-IN'),
        ])
      : [
          ['No alerts recorded', '-', '-', '-'],
        ],

    headStyles: {
      fillColor: [67, 97, 238],
    },

    styles: {
      fontSize: 9,
    },
  })

  // MEDICATION LOGS

  autoTable(doc, {

    head: [
      ['Medication', 'Reported intake', 'Date'],
    ],

    body: report.medicationLogs.length
      ? report.medicationLogs.map(log => [
          log.medication.medicineName,
          log.taken ? 'Taken' : 'Not taken',

          new Date(
            log.createdAt
          ).toLocaleString('en-IN'),
        ])
      : [
          ['No medication logs recorded', '-', '-'],
        ],

    headStyles: {
      fillColor: [67, 97, 238],
    },

    styles: {
      fontSize: 9,
    },
  })

  // RECENT HISTORICAL READINGS

  doc.addPage()

  doc.setTextColor(8, 15, 38)
  doc.setFontSize(17)
  doc.text('Recent stored measurements', 15, 20)

  doc.setFontSize(10)
  doc.text(
    'Latest 100 stored readings in the selected period.',
    15,
    29
  )

  autoTable(doc, {

    startY: 35,

    head: [
      [
        'Time',
        'HR (BPM)',
        'SpO2 (%)',
        'Temp. (C)',
        'Signal',
      ],
    ],

    body: report.readings.slice(-100).reverse().map(r => [
      new Date(r.recordedAt).toLocaleString('en-IN'),

      r.signalQuality === 'GOOD'
        ? String(r.heartRate ?? '-')
        : '-',

      r.signalQuality === 'GOOD'
        ? String(r.spo2 ?? '-')
        : '-',

      String(r.temperature ?? '-'),

      r.signalQuality,
    ]),

    headStyles: {
      fillColor: [23, 37, 84],
    },

    styles: {
      fontSize: 8,
    },
  })

  // DISCLAIMER

  doc.addPage()

  doc.setFontSize(16)
  doc.text('Report interpretation', 15, 22)

  doc.setFontSize(11)

  const disclaimer = [
    'This report contains experimental sensor measurements.',
    'Stored readings are periodic snapshots, not continuous clinical records.',
    'Sensor temperature is not a validated core body temperature measurement.',
    'Medication intake information is self-reported.',
    'Alert and medication tables contain up to 500 recent records each.',
    report.truncated
      ? 'The measurement dataset was truncated to 50,000 records.'
      : 'Measurement statistics cover the retrieved period.',
    'This report does not establish a medical diagnosis or treatment effectiveness.',
    'Clinical interpretation must be performed by a qualified healthcare professional.',
  ].join('\n\n')

  doc.text(
    doc.splitTextToSize(disclaimer, 175),
    15,
    36
  )

  // PAGE FOOTERS

  const pages = doc.getNumberOfPages()

  for (let page = 1; page <= pages; page++) {

    doc.setPage(page)

    doc.setDrawColor(220, 225, 235)
    doc.line(15, 280, 195, 280)

    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)

    doc.text(
      'MediConnect | Confidential health information',
      15,
      286
    )

    doc.text(
      `${page} / ${pages}`,
      195,
      286,
      { align: 'right' }
    )
  }

  doc.save(
    `MediConnect-${report.patient.patientCode}-${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`
  )
}