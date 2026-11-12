import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../i18n/i18n.dart';
import '../models/models.dart';
import 'format.dart';

/// Printable documents — the mobile versions of the web's
/// PrintableReceipt.jsx and PrintablePrescriptionSlip.jsx.
///
/// Both are laid out for an 80 mm receipt roll (what the clinic's web
/// portal targets) and open the system print / share sheet, so they can go
/// to a printer or be saved as PDF.
class PrintDocs {
  PrintDocs._();

  static Future<pw.ThemeData> _theme() async {
    // Ethiopic and Arabic glyphs aren't in the built-in PDF fonts, so names
    // and instructions typed in Amharic/Arabic need Noto fallbacks.
    try {
      final base = await PdfGoogleFonts.notoSansRegular();
      final bold = await PdfGoogleFonts.notoSansBold();
      final fallback = [
        await PdfGoogleFonts.notoSansEthiopicRegular(),
        await PdfGoogleFonts.notoNaskhArabicRegular(),
      ];
      return pw.ThemeData.withFont(base: base, bold: bold, fontFallback: fallback);
    } catch (_) {
      // Offline: the built-in font still prints Latin text correctly.
      return pw.ThemeData.base();
    }
  }

  static pw.Widget _divider() => pw.Padding(
        padding: const pw.EdgeInsets.symmetric(vertical: 6),
        child: pw.Divider(borderStyle: pw.BorderStyle.dashed, thickness: 0.6),
      );

  static pw.Widget _line(String label, String? value) => value == null || value.isEmpty
      ? pw.SizedBox()
      : pw.Padding(
          padding: const pw.EdgeInsets.only(bottom: 2),
          child: pw.RichText(
            text: pw.TextSpan(children: [
              pw.TextSpan(
                  text: '$label ', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              pw.TextSpan(text: value),
            ]),
          ),
        );

  static pw.Widget _header(String subtitle) => pw.Column(
        children: [
          pw.Text(tr('receipt.clinicName'),
              style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold)),
          pw.Text(subtitle, style: const pw.TextStyle(fontSize: 9)),
          pw.SizedBox(height: 2),
          pw.Text('${Fmt.date(DateTime.now())} ${Fmt.time(DateTime.now())}',
              style: const pw.TextStyle(fontSize: 8)),
        ],
      );

  static String _doctorName(PersonRef? d) => d == null
      ? ''
      : tr('receipt.doctorNameFormat', {'firstName': d.firstName, 'lastName': d.lastName});

  static String _meta(Prescription rx) => [
        tr('receipt.medicine.qty', {'quantity': rx.quantity}),
        rx.dosage ?? tr('receipt.placeholder'),
        rx.frequency ?? tr('receipt.placeholder'),
        ?rx.route,
        ?rx.duration,
      ].join(' • ');

  static String _money(double v) =>
      tr('receipt.currencyFormat', {'amount': v.toStringAsFixed(2)});

  /// Receipt for a paid visit (cashier).
  static Future<void> receipt({
    required Visit visit,
    List<Prescription>? prescriptions,
    Payment? payment,
  }) async {
    final items = prescriptions ?? visit.prescriptions;
    final patient = visit.patient ?? payment?.patient;
    final total = items.fold<double>(0, (s, p) => s + p.totalAmount);
    final theme = await _theme();
    final doc = pw.Document(theme: theme);
    doc.addPage(pw.Page(
      pageFormat: PdfPageFormat.roll80,
      margin: const pw.EdgeInsets.all(10),
      textDirection: I18n.instance.isRtl ? pw.TextDirection.rtl : pw.TextDirection.ltr,
      build: (_) => pw.DefaultTextStyle(
        style: const pw.TextStyle(fontSize: 9),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.stretch,
          children: [
            _header(tr('receipt.clinicSubtitle')),
            _divider(),
            _line(tr('receipt.label.patient'), patient?.fullName),
            _line(tr('receipt.label.id'), patient?.patientId),
            _line(tr('receipt.label.visit'),
                visit.visitNumber.isEmpty ? null : '#${visit.visitNumber}'),
            _line(tr('receipt.label.doctor'), _doctorName(visit.doctor)),
            if (payment != null) ...[
              _line(tr('common.paymentNumber'), payment.paymentNumber),
              _line(tr('common.method'), Payment.methodLabel(payment.method)),
            ],
            _divider(),
            pw.Text(tr('receipt.sectionPrescribedMedicines'),
                style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 4),
            for (final rx in items)
              pw.Padding(
                padding: const pw.EdgeInsets.only(bottom: 4),
                child: pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Expanded(
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(
                            rx.medicine?.strength == null
                                ? rx.medicineName
                                : '${rx.medicineName} (${rx.medicine!.strength})',
                            style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                          ),
                          pw.Text(_meta(rx), style: const pw.TextStyle(fontSize: 8)),
                          if (rx.instructions != null)
                            pw.Text(rx.instructions!,
                                style: pw.TextStyle(
                                    fontSize: 8, fontStyle: pw.FontStyle.italic)),
                        ],
                      ),
                    ),
                    pw.SizedBox(width: 6),
                    pw.Text(_money(rx.totalAmount)),
                  ],
                ),
              ),
            _divider(),
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text(tr('receipt.totalLabel'),
                    style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
                pw.Text(_money(payment?.amount ?? total),
                    style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
              ],
            ),
            _divider(),
            pw.Center(
              child: pw.Column(children: [
                pw.Text('${tr('receipt.footer.thankYou')} ${tr('receipt.footer.clinicName')}'),
                pw.Text(tr('receipt.footer.disclaimer'),
                    style: const pw.TextStyle(fontSize: 7)),
              ]),
            ),
          ],
        ),
      ),
    ));
    await Printing.layoutPdf(
      name: 'receipt-${visit.visitNumber.isEmpty ? payment?.paymentNumber ?? '' : visit.visitNumber}',
      format: PdfPageFormat.roll80,
      onLayout: (_) => doc.save(),
    );
  }

  /// Herbal prescription slip handed to the patient (doctor).
  static Future<void> prescriptionSlip({
    required Visit visit,
    required List<Prescription> prescriptions,
    PersonRef? doctor,
  }) async {
    final p = visit.patient;
    final theme = await _theme();
    final doc = pw.Document(theme: theme);
    doc.addPage(pw.Page(
      pageFormat: PdfPageFormat.roll80,
      margin: const pw.EdgeInsets.all(10),
      textDirection: I18n.instance.isRtl ? pw.TextDirection.rtl : pw.TextDirection.ltr,
      build: (_) => pw.DefaultTextStyle(
        style: const pw.TextStyle(fontSize: 9),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.stretch,
          children: [
            _header(tr('mobile.print.prescriptionSubtitle')),
            _divider(),
            _line(tr('receipt.label.patient'), p?.fullName),
            _line(tr('receipt.label.id'), p?.patientId),
            if (p?.age != null)
              _line(tr('doctorQueue.consultation.ageGender'),
                  [tr('mobile.common.ageYears', {'age': p!.age}), genderLabel(p.gender)]
                      .where((e) => e.isNotEmpty)
                      .join(' · ')),
            _line(tr('receipt.label.visit'),
                visit.visitNumber.isEmpty ? null : '#${visit.visitNumber}'),
            _line(tr('receipt.label.doctor'), _doctorName(doctor ?? visit.doctor)),
            _divider(),
            pw.Text('Rx', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 4),
            if (prescriptions.isEmpty)
              pw.Text(tr('doctorQueue.consultation.printNoPrescriptions'))
            else
              for (var i = 0; i < prescriptions.length; i++)
                pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 6),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        '${i + 1}. ${prescriptions[i].medicineName}'
                        '${prescriptions[i].medicine?.strength == null ? '' : ' (${prescriptions[i].medicine!.strength})'}',
                        style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                      ),
                      pw.Text(_meta(prescriptions[i]), style: const pw.TextStyle(fontSize: 8)),
                      if (prescriptions[i].instructions != null)
                        pw.Text(prescriptions[i].instructions!,
                            style: pw.TextStyle(fontSize: 8, fontStyle: pw.FontStyle.italic)),
                    ],
                  ),
                ),
            _divider(),
            if (visit.followUpDate != null)
              _line(tr('consultation.followUpDateLabel'),
                  Fmt.date(DateTime.tryParse(visit.followUpDate!))),
            pw.Center(
              child: pw.Text(tr('mobile.print.disclaimer'),
                  style: const pw.TextStyle(fontSize: 7)),
            ),
          ],
        ),
      ),
    ));
    await Printing.layoutPdf(
      name: '${p?.firstName ?? ''}-${p?.lastName ?? ''}-Rx',
      format: PdfPageFormat.roll80,
      onLayout: (_) => doc.save(),
    );
  }
}
